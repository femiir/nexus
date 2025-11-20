# ==============================================================================
# STAGE 1: Dependencies
# ==============================================================================
# Similar to your Python builder stage with uv
# This stage installs ALL dependencies (including devDependencies)
FROM node:20-alpine AS deps

# Install libc6-compat for compatibility (common need on Alpine)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm globally (like copying uv binary in your Python Dockerfile)
# We use corepack which comes with Node 20+
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files first (like pyproject.toml and uv.lock)
# This allows Docker to cache this layer if dependencies don't change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install dependencies (like uv sync --locked)
# --frozen-lockfile ensures we use exact versions from pnpm-lock.yaml
RUN pnpm install --frozen-lockfile


# ==============================================================================
# STAGE 2: Builder
# ==============================================================================
# This stage builds the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage (to avoid reinstalling)
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment variables for build
# These are needed at build time for Next.js
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build the Next.js app (like `next build`)
# The 'standalone' output mode (set in next.config.ts) will create a minimal build
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm build


# ==============================================================================
# STAGE 3: Runner (Final Production Image)
# ==============================================================================
# Similar to your "final" stage - minimal image with only what's needed to run
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Create non-root user (like your 'femiir' user in Python Dockerfile)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the production build from builder stage
# standalone mode creates a minimal self-contained build in .next/standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script (like your entrypoint-prod.sh)
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

# Switch to non-root user for security
USER nextjs

# Expose port 3000 (Next.js default)
EXPOSE 3000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Run the entrypoint script
CMD ["./entrypoint.sh"]
