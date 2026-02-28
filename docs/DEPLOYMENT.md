# Deployment Guide

Complete guide for deploying Cangkir Mini Soccer Backend to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Process Management (PM2)](#process-management-pm2)
- [Docker Deployment](#docker-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Backup Strategy](#backup-strategy)
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**

- **CPU**: 2 cores
- **RAM**: 2 GB
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 20.04 LTS or later

**Recommended:**

- **CPU**: 4 cores
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **OS**: Ubuntu 22.04 LTS

### Software Requirements

- **Node.js**: >= 18.x LTS
- **npm**: >= 9.x
- **PostgreSQL**: >= 16.x
- **Redis**: >= 7.x
- **Nginx**: >= 1.18
- **PM2**: >= 5.x (for process management)
- **Git**: >= 2.x

---

## Environment Setup

### 1. Install Node.js

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version   # Should be 9.x or higher
```

### 2. Install PostgreSQL

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql-16 postgresql-contrib-16

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql -c "SELECT version();"
```

### 3. Install Redis

```bash
# Install Redis
sudo apt-get install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: bind 127.0.0.1 ::1

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
redis-cli ping  # Should return PONG
```

### 4. Install Nginx

```bash
# Install Nginx
sudo apt-get install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

### 5. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Verify installation
pm2 --version
```

---

## Database Setup

### 1. Create Database User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database user
CREATE USER cangkir_admin WITH PASSWORD 'your_strong_password_here';

# Create database
CREATE DATABASE cangkir_minisoccer OWNER cangkir_admin;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cangkir_minisoccer TO cangkir_admin;

# Exit psql
\q
```

### 2. Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set: listen_addresses = 'localhost'  # or specific IP

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Add: host cangkir_minisoccer cangkir_admin 127.0.0.1/32 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Test Database Connection

```bash
# Test connection
psql -h localhost -U cangkir_admin -d cangkir_minisoccer -W

# If successful, exit
\q
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone <repository-url> cangkir-mini-soccer-be
cd cangkir-mini-soccer-be

# Set proper permissions
sudo chown -R $USER:$USER /var/www/cangkir-mini-soccer-be
```

### 2. Install Dependencies

```bash
# Install production dependencies
npm ci --production=false

# Generate Prisma Client
npm run prisma:generate
```

### 3. Configure Environment Variables

```bash
# Create production .env file
nano .env

# Add production configuration (see below)
```

**Production .env Example:**

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL="postgresql://cangkir_admin:your_strong_password@localhost:5432/cangkir_minisoccer?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=cangkir_admin
DB_PASSWORD=your_strong_password
DB_NAME=cangkir_minisoccer

# JWT - MUST BE STRONG AND UNIQUE
JWT_SECRET=generate_this_with_openssl_rand_base64_32_minimum_32_chars
JWT_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Frontend & CORS
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# WhatsApp
ADMIN_WHATSAPP=628123456789

# Booking Rules
MIN_BOOKING_HOURS=1
MAX_BOOKING_HOURS=8
BOOKING_ADVANCE_DAYS=30
CANCELLATION_HOURS=24
```

**Generate Strong JWT Secret:**

```bash
openssl rand -base64 32
```

### 4. Run Database Migrations

```bash
# Run migrations
npm run prisma:migrate deploy

# Seed initial data (admin user + time slots)
npm run prisma:seed
```

### 5. Build Application

```bash
# Build TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/
```

### 6. Test Application

```bash
# Start application in production mode
npm run start:prod

# Test in another terminal
curl http://localhost:3000/api/health/ping

# If successful, stop the test
# Press Ctrl+C
```

---

## Nginx Configuration

### 1. Create Nginx Configuration

```bash
# Create Nginx config file
sudo nano /etc/nginx/sites-available/cangkir-mini-soccer
```

**Nginx Configuration:**

```nginx
# Upstream configuration
upstream cangkir_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.your-domain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;

    # SSL certificates (will be configured with Certbot)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/cangkir-mini-soccer-access.log;
    error_log /var/log/nginx/cangkir-mini-soccer-error.log;

    # Client body size limit
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://cangkir_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Caching
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (bypass proxy for faster response)
    location /api/health/ping {
        proxy_pass http://cangkir_backend;
        access_log off;
    }

    # Static files (if needed in future)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://cangkir_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cangkir-mini-soccer /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup

### Install Certbot

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended)

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Auto-Renewal Cron Job

Certbot automatically creates a cron job, but verify:

```bash
# Check cron job
sudo cat /etc/cron.d/certbot

# Should contain:
# 0 */12 * * * root certbot renew --quiet
```

---

## Process Management (PM2)

### 1. Create PM2 Ecosystem File

```bash
# Create ecosystem config
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: 'cangkir-mini-soccer-be',
      script: 'dist/main.js',
      instances: 2, // Use 'max' for all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      instance_var: 'INSTANCE_ID',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
```

### 2. Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# View application status
pm2 status

# View logs
pm2 logs cangkir-mini-soccer-be

# Monitor application
pm2 monit
```

### 3. PM2 Commands Reference

```bash
# Restart application
pm2 restart cangkir-mini-soccer-be

# Stop application
pm2 stop cangkir-mini-soccer-be

# Delete from PM2
pm2 delete cangkir-mini-soccer-be

# View detailed info
pm2 info cangkir-mini-soccer-be

# View logs (last 200 lines)
pm2 logs cangkir-mini-soccer-be --lines 200

# Clear logs
pm2 flush

# Reload (zero-downtime restart)
pm2 reload cangkir-mini-soccer-be
```

---

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

### 2. Create docker-compose.production.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cangkir-mini-soccer-api
    restart: unless-stopped
    ports:
      - '3000:3000'
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    networks:
      - cangkir-network
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:16-alpine
    container_name: cangkir-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - cangkir-network

  redis:
    image: redis:7-alpine
    container_name: cangkir-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - cangkir-network

volumes:
  postgres-data:
  redis-data:

networks:
  cangkir-network:
    driver: bridge
```

### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f app

# Run migrations
docker-compose -f docker-compose.production.yml exec app npm run prisma:migrate deploy

# Seed database
docker-compose -f docker-compose.production.yml exec app npm run prisma:seed

# Check status
docker-compose -f docker-compose.production.yml ps

# Stop services
docker-compose -f docker-compose.production.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.production.yml down -v
```

---

## Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Install PM2 Plus (optional, requires account)
pm2 plus

# Or use built-in monitoring
pm2 monit

# View metrics
pm2 describe cangkir-mini-soccer-be
```

### 2. Application Logs

```bash
# View PM2 logs
pm2 logs cangkir-mini-soccer-be

# View Nginx access logs
sudo tail -f /var/log/nginx/cangkir-mini-soccer-access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/cangkir-mini-soccer-error.log

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 3. Health Check Monitoring

Create a simple health check script:

```bash
# Create health check script
nano /var/www/cangkir-mini-soccer-be/scripts/health-check.sh
```

**scripts/health-check.sh:**

```bash
#!/bin/bash

URL="http://localhost:3000/api/health/ping"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Health check passed"
    exit 0
else
    echo "$(date): Health check failed - HTTP $RESPONSE"
    # Send alert (email, Slack, etc.)
    # pm2 restart cangkir-mini-soccer-be
    exit 1
fi
```

```bash
# Make executable
chmod +x /var/www/cangkir-mini-soccer-be/scripts/health-check.sh

# Add to crontab (every 5 minutes)
crontab -e

# Add line:
*/5 * * * * /var/www/cangkir-mini-soccer-be/scripts/health-check.sh >> /var/www/cangkir-mini-soccer-be/logs/health-check.log 2>&1
```

### 4. Database Monitoring

```bash
# Monitor database connections
psql -h localhost -U cangkir_admin -d cangkir_minisoccer -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor database size
psql -h localhost -U cangkir_admin -d cangkir_minisoccer -c "SELECT pg_size_pretty(pg_database_size('cangkir_minisoccer'));"

# Monitor slow queries
psql -h localhost -U cangkir_admin -d cangkir_minisoccer -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## Backup Strategy

### 1. Database Backup Script

```bash
# Create backup script
nano /var/www/cangkir-mini-soccer-be/scripts/backup-db.sh
```

**scripts/backup-db.sh:**

```bash
#!/bin/bash

# Configuration
DB_NAME="cangkir_minisoccer"
DB_USER="cangkir_admin"
BACKUP_DIR="/var/backups/cangkir-mini-soccer"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "$(date): Starting database backup..."
PGPASSWORD="your_db_password" pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "$(date): Backup completed successfully: $BACKUP_FILE"

    # Delete old backups
    find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "$(date): Old backups cleaned up"
else
    echo "$(date): Backup failed!"
    exit 1
fi
```

```bash
# Make executable
chmod +x /var/www/cangkir-mini-soccer-be/scripts/backup-db.sh

# Create backup directory
sudo mkdir -p /var/backups/cangkir-mini-soccer
sudo chown $USER:$USER /var/backups/cangkir-mini-soccer

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /var/www/cangkir-mini-soccer-be/scripts/backup-db.sh >> /var/www/cangkir-mini-soccer-be/logs/backup.log 2>&1
```

### 2. Restore Database

```bash
# Restore from backup
gunzip -c /var/backups/cangkir-mini-soccer/db_backup_20240228_020000.sql.gz | psql -h localhost -U cangkir_admin -d cangkir_minisoccer
```

### 3. Application Backup

```bash
# Backup application files (excluding node_modules)
tar -czf /var/backups/cangkir-mini-soccer/app_backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='logs' \
  /var/www/cangkir-mini-soccer-be
```

---

## Security Hardening

### 1. Firewall Configuration (UFW)

```bash
# Install UFW
sudo apt-get install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban for SSH Protection

```bash
# Install Fail2Ban
sudo apt-get install -y fail2ban

# Create custom configuration
sudo nano /etc/fail2ban/jail.local
```

**jail.local:**

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
```

```bash
# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status sshd
```

### 3. Secure PostgreSQL

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Set:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Ensure only local connections:
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 4. Environment Variables Security

```bash
# Secure .env file permissions
chmod 600 /var/www/cangkir-mini-soccer-be/.env

# Ensure proper ownership
chown $USER:$USER /var/www/cangkir-mini-soccer-be/.env

# Never commit .env to version control
echo ".env" >> .gitignore
```

---

## Performance Optimization

### 1. PostgreSQL Tuning

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
```

**Recommended settings for 4GB RAM server:**

```ini
# Memory
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query planner
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000  # Log queries slower than 1s
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2. Redis Tuning

```bash
# Edit redis.conf
sudo nano /etc/redis/redis.conf
```

**Recommended settings:**

```ini
maxmemory 512mb
maxmemory-policy allkeys-lru
save ""  # Disable persistence if not needed
```

```bash
# Restart Redis
sudo systemctl restart redis-server
```

### 3. Node.js Optimization

In `ecosystem.config.js`:

```javascript
instances: 'max',  // Use all CPU cores
max_memory_restart: '500M',  // Restart if memory exceeds 500MB
```

### 4. Nginx Caching

Add to Nginx configuration:

```nginx
# In http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;

# In location block
location /api/time-slots {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    proxy_pass http://cangkir_backend;
}
```

---

## Troubleshooting

### Application Won't Start

**Check PM2 logs:**

```bash
pm2 logs cangkir-mini-soccer-be --lines 100
```

**Common issues:**

- Missing .env file → Create from .env.example
- Database connection failed → Check DATABASE_URL
- Port already in use → Change PORT in .env
- Permission denied → Check file ownership

### Database Connection Issues

**Test connection:**

```bash
psql -h localhost -U cangkir_admin -d cangkir_minisoccer -W
```

**Check PostgreSQL status:**

```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql -n 50
```

**Common issues:**

- Wrong credentials → Verify DB_USER, DB_PASSWORD in .env
- PostgreSQL not running → `sudo systemctl start postgresql`
- Connection refused → Check listen_addresses in postgresql.conf

### High Memory Usage

**Monitor memory:**

```bash
pm2 monit
free -h
```

**Solutions:**

- Reduce PM2 instances
- Lower max_memory_restart
- Optimize database queries
- Add more RAM

### SSL Certificate Issues

**Check certificate:**

```bash
sudo certbot certificates
```

**Renew manually:**

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Performance Issues

**Check slow queries:**

```bash
# Enable slow query logging in .env
LOG_LEVEL=debug

# Monitor queries
pm2 logs cangkir-mini-soccer-be | grep "ms"
```

**Database performance:**

```bash
# Analyze query performance
psql -h localhost -U cangkir_admin -d cangkir_minisoccer -c "ANALYZE;"
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code tested thoroughly in staging environment
- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured for production
- [ ] Strong JWT_SECRET generated and set
- [ ] Database backup created
- [ ] SSL certificate obtained and configured
- [ ] Firewall rules configured
- [ ] Monitoring and logging set up

### Deployment

- [ ] Pull latest code from repository
- [ ] Install/update dependencies (`npm ci`)
- [ ] Generate Prisma Client (`npm run prisma:generate`)
- [ ] Run database migrations (`npm run prisma:migrate deploy`)
- [ ] Build application (`npm run build`)
- [ ] Restart application (`pm2 reload cangkir-mini-soccer-be`)
- [ ] Verify health check (`curl https://api.your-domain.com/api/health/ping`)
- [ ] Check logs for errors (`pm2 logs`)

### Post-Deployment

- [ ] Test critical endpoints (login, create booking, etc.)
- [ ] Monitor application for 10-15 minutes
- [ ] Check error logs
- [ ] Verify database connectivity
- [ ] Test from frontend application
- [ ] Notify team of successful deployment

---

## Continuous Deployment (CD)

### Simple Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to app directory
cd /var/www/cangkir-mini-soccer-be

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate deploy

# Build application
echo "🔨 Building application..."
npm run build

# Reload PM2
echo "♻️  Reloading application..."
pm2 reload cangkir-mini-soccer-be

# Wait for application to start
sleep 5

# Health check
echo "🏥 Running health check..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/ping)

if [ $HEALTH -eq 200 ]; then
    echo "✅ Deployment successful!"
    pm2 save
else
    echo "❌ Health check failed - rolling back..."
    pm2 reload cangkir-mini-soccer-be
    exit 1
fi

echo "🎉 Deployment complete!"
```

```bash
chmod +x deploy.sh
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Check current PM2 status
pm2 list

# 2. View recent logs
pm2 logs cangkir-mini-soccer-be --lines 50

# 3. Checkout previous version
git checkout <previous-commit-hash>

# 4. Reinstall dependencies
npm ci

# 5. Rebuild
npm run build

# 6. Restart
pm2 reload cangkir-mini-soccer-be

# 7. Verify
curl http://localhost:3000/api/health/ping
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**

- Monitor application logs
- Check health endpoints
- Review error logs

**Weekly:**

- Review database backups
- Check disk space usage
- Review PM2 metrics
- Update dependencies (patch versions)

**Monthly:**

- Review security updates
- Analyze performance metrics
- Clean up old logs
- Database optimization (VACUUM, ANALYZE)
- SSL certificate renewal check

**Quarterly:**

- Full security audit
- Dependency updates (minor versions)
- Performance optimization review
- Disaster recovery drill

---

**Last Updated**: February 28, 2024

**Note**: Replace placeholders (your-domain.com, passwords, etc.) with actual production values.
