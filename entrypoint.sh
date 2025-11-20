#!/bin/sh
# =============================================================================
# Next.js Application Entrypoint Script
# =============================================================================
# Similar to your Django entrypoint.sh, but simpler since:
# - No database migrations needed (MongoDB is schemaless)
# - No collectstatic needed (Next.js handles static files)
# =============================================================================

set -e  # Exit immediately if a command exits with a non-zero status

echo "========================================"
echo "Starting Nexus Next.js Application"
echo "========================================"

# Print environment info (useful for debugging)
echo "Node version: $(node --version)"
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3000}"

# Check if MongoDB connection string is set
if [ -z "$MONGODB_URI" ]; then
    echo "WARNING: MONGODB_URI is not set!"
    echo "Application may fail to connect to database."
fi

# Check if Cloudinary is configured
if [ -z "$CLOUDINARY_URL" ]; then
    echo "WARNING: CLOUDINARY_URL is not set!"
    echo "Image uploads may not work."
fi

echo "========================================"
echo "Starting Next.js server..."
echo "========================================"

# Start the Next.js server
# In standalone mode, the server is in the root directory
exec node server.js
