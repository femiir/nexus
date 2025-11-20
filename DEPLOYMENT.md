# Nexus Deployment Guide - Raspberry Pi

This guide walks you through deploying the Nexus Next.js application to your Raspberry Pi with Traefik and Cloudflare.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Understanding the Setup](#understanding-the-setup)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Cloudflare Tunnel Configuration](#cloudflare-tunnel-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Raspberry Pi with Docker and Docker Compose installed
- ✅ Traefik running with the `proxy` network created
- ✅ Cloudflare account with DNS management access
- ✅ Domain name (e.g., `femiir.dev`) pointing to Cloudflare
- ✅ MongoDB Atlas database (or self-hosted MongoDB)
- ✅ Cloudinary account for image storage

---

## Understanding the Setup

### How It Works (Python Developer's Perspective)

If you're coming from Django/Python (like your SpeakTree API), here's how Next.js compares:

| Concept | Django/Python | Next.js/Node |
|---------|--------------|--------------|
| **Web Framework** | Django | Next.js |
| **Package Manager** | `uv` / `pip` | `pnpm` / `npm` |
| **Dependency File** | `pyproject.toml` | `package.json` |
| **Lock File** | `uv.lock` | `pnpm-lock.yaml` |
| **Virtual Environment** | `.venv` | `node_modules` |
| **Environment Variables** | `.env` | `.env` (same!) |
| **Migrations** | `manage.py migrate` | Not needed (MongoDB is schemaless) |
| **Static Files** | `collectstatic` | Built into Next.js build |
| **Production Server** | Gunicorn/Uvicorn | Node.js built-in |
| **Default Port** | 8000 | 3000 |

### Architecture

```
Internet
    ↓
Cloudflare Tunnel (cloudflared)
    ↓
Traefik (Reverse Proxy + SSL)
    ↓
Next.js App (Port 3000)
    ↓
MongoDB Atlas (Cloud Database)
    ↓
Cloudinary (Image Storage)
```

### File Structure

```
/Users/femiir/dev/nexus/
├── Dockerfile              # Multi-stage build for production
├── docker-compose.yml      # Service definition with Traefik labels
├── .dockerignore          # Files to exclude from Docker build
├── entrypoint.sh          # Startup script (like your Django entrypoint)
├── .env                   # Environment variables (DO NOT commit!)
├── .env.example           # Template for environment variables
├── next.config.ts         # Next.js configuration (standalone mode enabled)
└── package.json           # Dependencies (like pyproject.toml)
```

---

## Step-by-Step Deployment

### 1. Prepare Environment Variables

On your Raspberry Pi, navigate to the project directory and create `.env`:

```bash
cd /path/to/nexus
cp .env.example .env
nano .env
```

Update the following values:

```env
# Change to your production URL
NEXT_PUBLIC_BASE_URL=https://nexus.femiir.dev

# Your PostHog credentials (from existing .env)
NEXT_PUBLIC_POSTHOG_KEY=your_actual_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Your MongoDB Atlas credentials
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=nexus
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_CLUSTER=your-cluster.mongodb.net
MONGODB_APP_NAME=nexus

# Your Cloudinary credentials
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://key:secret@cloud_name
```

**Security Note**: Just like your Django app, NEVER commit `.env` to git!

### 2. Update Traefik Host Rule

Edit `docker-compose.yml` and change the subdomain:

```yaml
labels:
  - "traefik.http.routers.nexus.rule=Host(`nexus.femiir.dev`)"
  # Change 'nexus.femiir.dev' to your desired subdomain
```

### 3. Verify Traefik Network

Ensure the `proxy` network exists (same network your Django app uses):

```bash
docker network ls | grep proxy
```

If it doesn't exist:

```bash
docker network create proxy
```

### 4. Build the Docker Image

**First time building on Raspberry Pi (ARM64):**

The build might take 10-15 minutes on Raspberry Pi due to:
- Installing dependencies
- Compiling Next.js build
- ARM64 architecture differences

```bash
docker compose build
```

**Understanding the build process:**
1. **Stage 1 (deps)**: Installs all dependencies (like `uv sync`)
2. **Stage 2 (builder)**: Builds the Next.js app (like `python manage.py collectstatic`)
3. **Stage 3 (runner)**: Creates minimal production image (like your Django final stage)

### 5. Start the Application

```bash
docker compose up -d
```

Check logs:

```bash
docker compose logs -f app
```

You should see:

```
========================================
Starting Nexus Next.js Application
========================================
Node version: v20.x.x
Environment: production
Port: 3000
========================================
Starting Next.js server...
========================================
```

### 6. Verify Application Health

Check if the container is healthy:

```bash
docker ps
```

Look for "healthy" status under the HEALTH column.

Test the health endpoint directly:

```bash
docker exec nexus node -e "require('http').get('http://localhost:3000/api/health', (r) => console.log('Status:', r.statusCode))"
```

### 7. Test via Traefik

From your local machine (or any device):

```bash
curl https://nexus.femiir.dev
```

You should receive the Next.js app response.

---

## Cloudflare Tunnel Configuration

### Option 1: Update Existing Cloudflare Tunnel

If you already have a tunnel running (like in your docker-compose), add a new route:

1. Go to Cloudflare Zero Trust Dashboard: https://one.dash.cloudflare.com/
2. Navigate to **Access** → **Tunnels**
3. Click on your existing tunnel
4. Add a new **Public Hostname**:
   - **Subdomain**: `nexus`
   - **Domain**: `femiir.dev`
   - **Type**: `HTTP`
   - **URL**: `nexus:3000` (Docker service name)

### Option 2: CLI Configuration

If managing via `.cloudflared/config.yml`:

```yaml
tunnel: your-tunnel-id
credentials-file: /home/nonroot/.cloudflared/your-tunnel-credentials.json

ingress:
  # Your Django API
  - hostname: speaktree.femiir.dev
    service: http://speaktree:8000

  # New Next.js app
  - hostname: nexus.femiir.dev
    service: http://nexus:3000

  # Catch-all rule (required)
  - service: http_status:404
```

Then restart cloudflared:

```bash
docker restart cloudflared
```

### Verify Tunnel Routing

```bash
docker logs cloudflared
```

Look for lines like:

```
Registered tunnel connection: nexus.femiir.dev -> http://nexus:3000
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker compose logs app
```

**Common issues:**

1. **Port conflict**: Another service using port 3000
   ```bash
   sudo lsof -i :3000
   ```

2. **Missing environment variables**:
   - Check `.env` file exists and has all required variables
   - Compare with `.env.example`

3. **MongoDB connection failed**:
   - Verify `MONGODB_URI` is correct
   - Check if MongoDB Atlas IP whitelist includes your Raspberry Pi's IP
   - Test connection: `docker exec nexus node -e "console.log(process.env.MONGODB_URI)"`

### Health Check Failing

**Symptoms**: Container shows "unhealthy" status

**Debug:**

```bash
# Check if app is running
docker exec nexus ps aux

# Test health endpoint manually
docker exec nexus wget -q -O- http://localhost:3000/api/health
```

**Fix**: Create the health endpoint if it doesn't exist:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 })
}
```

### Traefik Not Routing

**Check Traefik dashboard**: `https://traefik.femiir.dev` (with your basic auth)

1. Go to **HTTP Routers**
2. Look for `nexus` router
3. Verify:
   - Rule: `Host(\`nexus.femiir.dev\`)`
   - Status: Should be green/active
   - TLS: Should show certificate

**Common issues:**

1. **Wrong network**: Ensure app is on `proxy` network
   ```bash
   docker network inspect proxy
   ```

2. **Traefik not detecting container**: Check labels in `docker-compose.yml`

3. **DNS not resolving**: Verify DNS record in Cloudflare points to tunnel

### Image Build Fails on Raspberry Pi

**Symptoms**: "platform mismatch" or "exec format error"

**Fix**: Explicitly set platform:

```yaml
# In docker-compose.yml
services:
  app:
    platform: linux/arm64/v8
    build:
      context: .
```

### High Memory Usage

Raspberry Pi has limited RAM. If the container is killed by OOM:

**Add resource limits** to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M  # Adjust based on your Pi's RAM
        reservations:
          memory: 256M
```

---

## Comparing to Your Django Setup

### Similarities

✅ Both use multi-stage Dockerfiles for smaller images
✅ Both use external `proxy` network for Traefik
✅ Both use `expose` instead of `ports` for security
✅ Both use `.env` files for configuration
✅ Both have health checks
✅ Both use non-root users in containers

### Differences

| Aspect | Django (SpeakTree) | Next.js (Nexus) |
|--------|-------------------|-----------------|
| **Database** | PostgreSQL container | MongoDB Atlas (cloud) |
| **Cache** | Redis container | No cache container needed |
| **Worker** | Procrastinate worker | No separate worker needed |
| **Dependencies** | Install via `uv` | Install via `pnpm` |
| **Migrations** | Run on startup | Not needed (MongoDB) |
| **Port** | 8000 | 3000 |

---

## Next Steps

1. **Set up monitoring**: Add logging to track requests (similar to Django)
2. **Configure backups**: MongoDB Atlas handles this automatically
3. **Set up CI/CD**: Auto-deploy when pushing to git
4. **Add rate limiting**: Use Traefik middleware (like you might with Django)

---

## Useful Commands

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Rebuild after code changes
docker compose build && docker compose up -d

# Check resource usage
docker stats nexus

# Access container shell (for debugging)
docker exec -it nexus sh

# Stop application
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

---

## Need Help?

- **Next.js Docs**: https://nextjs.org/docs
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **Traefik Docs**: https://doc.traefik.io/traefik/
- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

**Happy Deploying! 🚀**
