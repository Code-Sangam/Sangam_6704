#!/bin/bash

# Production Startup Script for Sangam Alumni Network
set -e

echo "🚀 Starting Sangam Alumni Network in Production Mode"
echo "=================================================="

# Configuration
APP_DIR="/var/www/sangam-alumni-network/server"
USER="www-data"
NODE_ENV="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    warn "Running as root. Consider using a non-root user for security."
fi

# Change to application directory
cd "$APP_DIR" || error "Failed to change to application directory: $APP_DIR"

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    error "Environment file (.env) not found. Please create it from .env.production template."
fi

# Source environment variables
set -a
source .env
set +a

log "Environment: $NODE_ENV"
log "Port: ${PORT:-3000}"

# Validate required environment variables
required_vars=("DATABASE_URL" "SESSION_SECRET" "NODE_ENV")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        error "Required environment variable $var is not set"
    fi
done

log "Environment variables validated"

# Check Node.js version
node_version=$(node --version)
log "Node.js version: $node_version"

# Check if PostgreSQL is accessible
log "Testing database connection..."
if ! node -e "
const { testConnection } = require('./config/database');
testConnection().then(() => {
    console.log('Database connection successful');
    process.exit(0);
}).catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
});
"; then
    error "Database connection failed. Please check your DATABASE_URL and ensure PostgreSQL is running."
fi

# Check if required directories exist
required_dirs=("logs" "uploads" "public")
for dir in "${required_dirs[@]}"; do
    if [[ ! -d "$dir" ]]; then
        log "Creating directory: $dir"
        mkdir -p "$dir"
    fi
done

# Set proper permissions
log "Setting file permissions..."
chmod -R 755 public/ uploads/ 2>/dev/null || warn "Could not set permissions for public/uploads directories"
chmod -R 644 logs/ 2>/dev/null || warn "Could not set permissions for logs directory"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    error "PM2 is not installed. Please install it with: npm install -g pm2"
fi

# Stop existing PM2 processes
log "Stopping existing PM2 processes..."
pm2 stop sangam-alumni-network 2>/dev/null || log "No existing PM2 process to stop"

# Run database migrations
log "Running database migrations..."
if ! npm run db:migrate; then
    error "Database migrations failed"
fi

# Build application if needed
if [[ ! -d "dist" ]] || [[ "package.json" -nt "dist" ]]; then
    log "Building application..."
    if ! npm run build; then
        error "Application build failed"
    fi
fi

# Start application with PM2
log "Starting application with PM2..."
if ! pm2 start ecosystem.config.js --env production; then
    error "Failed to start application with PM2"
fi

# Save PM2 configuration
pm2 save

# Display status
log "Application started successfully!"
pm2 status

# Show logs
log "Recent application logs:"
pm2 logs sangam-alumni-network --lines 10 --nostream

# Health check
log "Performing health check..."
sleep 5

health_url="http://localhost:${PORT:-3000}/api/health"
if curl -f -s "$health_url" > /dev/null; then
    log "Health check passed ✅"
else
    warn "Health check failed. Please check application logs."
fi

# Display useful information
echo ""
echo "🎉 Sangam Alumni Network is now running in production!"
echo "=================================================="
echo "Application URL: http://localhost:${PORT:-3000}"
echo "Health Check: $health_url"
echo "PM2 Status: pm2 status"
echo "View Logs: pm2 logs sangam-alumni-network"
echo "Stop App: pm2 stop sangam-alumni-network"
echo "Restart App: pm2 restart sangam-alumni-network"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Nginx reverse proxy"
echo "2. Set up SSL certificate"
echo "3. Configure firewall rules"
echo "4. Set up monitoring and backups"
echo ""

log "Production startup completed successfully!"