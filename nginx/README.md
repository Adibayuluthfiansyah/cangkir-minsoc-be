# Nginx Configuration

This directory contains Nginx configuration files for the Cangkir Mini Soccer Backend API.

## Files

- **`nginx.conf`** - Production configuration with SSL/HTTPS
- **`nginx.local.conf`** - Local development configuration (no SSL)

---

## Local Development Setup (nginx.local.conf)

### 1. Install Nginx

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install nginx
```

**macOS:**

```bash
brew install nginx
```

### 2. Copy Configuration

```bash
# Copy local config to Nginx sites-available
sudo cp nginx/nginx.local.conf /etc/nginx/sites-available/cangkir-minisoccer

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/cangkir-minisoccer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Test Configuration

```bash
# Test Nginx configuration for syntax errors
sudo nginx -t
```

### 4. Start/Restart Nginx

```bash
# Start Nginx (if not running)
sudo systemctl start nginx

# Or restart if already running
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 5. Verify

```bash
# Check Nginx status
sudo systemctl status nginx

# Test the API through Nginx (port 80)
curl http://localhost/api/health/ping
```

### 6. Access Points

Once configured:

- **API**: http://localhost/api
- **Swagger Docs**: http://localhost/api/docs
- **Health Check**: http://localhost/api/health
- **Health Ping**: http://localhost/api/health/ping

---

## Production Setup (nginx.conf)

### Prerequisites

- Domain name pointed to your server
- Port 80 and 443 open in firewall

### 1. Update Configuration

Edit `nginx/nginx.conf` and replace `api.cangkir-minisoccer.com` with your actual domain:

```bash
# Replace all occurrences of the domain
sed -i 's/api.cangkir-minisoccer.com/your-domain.com/g' nginx/nginx.conf
```

### 2. Copy Configuration

```bash
# Copy production config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/cangkir-minisoccer

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cangkir-minisoccer /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Install Certbot (for SSL)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Or for macOS
brew install certbot
```

### 4. Obtain SSL Certificate

```bash
# Temporarily comment out SSL configuration
sudo nano /etc/nginx/sites-available/cangkir-minisoccer
# Comment out lines 28-32 (ssl_certificate lines)

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Obtain certificate
sudo certbot --nginx -d api.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended)

# After obtaining certificate, uncomment SSL lines
sudo nano /etc/nginx/sites-available/cangkir-minisoccer
# Uncomment the SSL certificate lines

# Test again
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Auto-Renewal Setup

Certbot automatically sets up renewal, verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### 6. Verify Production Setup

```bash
# Check HTTPS
curl https://api.your-domain.com/api/health/ping

# Check SSL grade
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=api.your-domain.com
```

---

## Nginx Management Commands

### View Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/cangkir-minisoccer-access.log

# Error logs
sudo tail -f /var/log/nginx/cangkir-minisoccer-error.log

# All Nginx logs
sudo tail -f /var/log/nginx/*.log
```

### Manage Service

```bash
# Start
sudo systemctl start nginx

# Stop
sudo systemctl stop nginx

# Restart (stops then starts)
sudo systemctl restart nginx

# Reload (graceful restart without dropping connections)
sudo systemctl reload nginx

# Status
sudo systemctl status nginx

# Enable on boot
sudo systemctl enable nginx

# Disable on boot
sudo systemctl disable nginx
```

### Test Configuration

```bash
# Test syntax
sudo nginx -t

# Test and show configuration
sudo nginx -T
```

### View Active Connections

```bash
# Show Nginx status (requires stub_status module)
curl http://localhost/nginx_status
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Or
sudo netstat -tulpn | grep :80

# Stop Apache if installed
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Permission Denied

```bash
# Check Nginx user
ps aux | grep nginx

# Fix log directory permissions
sudo chown -R www-data:www-data /var/log/nginx
sudo chmod -R 755 /var/log/nginx
```

### Configuration Errors

```bash
# Check syntax errors
sudo nginx -t

# View detailed errors
sudo journalctl -u nginx -n 50
```

### Cannot Connect to Backend

```bash
# Check if backend is running
curl http://localhost:3000/api/health/ping

# Check backend logs
pm2 logs cangkir-mini-soccer-be

# Restart backend
pm2 restart cangkir-mini-soccer-be
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
echo | openssl s_client -connect api.your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Performance Tuning

### Increase Worker Processes

Edit `/etc/nginx/nginx.conf`:

```nginx
# Set to number of CPU cores
worker_processes auto;
worker_connections 1024;
```

### Enable Caching

Add to your site configuration:

```nginx
# Cache configuration
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

### Rate Limiting

Add to http block:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# In location block
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://cangkir_backend;
}
```

---

## Security Best Practices

### 1. Hide Nginx Version

Edit `/etc/nginx/nginx.conf`:

```nginx
http {
    server_tokens off;
}
```

### 2. Restrict Access to Admin Panel

```nginx
# Allow only specific IPs to access admin endpoints
location /api/admin {
    allow 192.168.1.0/24;  # Your office network
    allow 103.xxx.xxx.xxx; # Your VPN IP
    deny all;

    proxy_pass http://cangkir_backend;
}
```

### 3. Enable Fail2Ban

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Create Nginx filter
sudo nano /etc/fail2ban/filter.d/nginx-req-limit.conf
```

Add:

```ini
[Definition]
failregex = limiting requests, excess: .* by zone "api_limit", client: <HOST>
ignoreregex =
```

Create jail:

```bash
sudo nano /etc/fail2ban/jail.local
```

Add:

```ini
[nginx-req-limit]
enabled = true
filter = nginx-req-limit
logpath = /var/log/nginx/cangkir-minisoccer-error.log
maxretry = 5
bantime = 600
```

Restart Fail2Ban:

```bash
sudo systemctl restart fail2ban
```

---

## Monitoring

### Basic Monitoring

```bash
# Watch access logs in real-time
sudo tail -f /var/log/nginx/cangkir-minisoccer-access.log

# Count requests per minute
sudo tail -1000 /var/log/nginx/cangkir-minisoccer-access.log | cut -d' ' -f4 | cut -d: -f2 | sort | uniq -c

# Show most common requests
sudo cat /var/log/nginx/cangkir-minisoccer-access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10

# Show status codes
sudo cat /var/log/nginx/cangkir-minisoccer-access.log | cut -d'"' -f3 | cut -d' ' -f2 | sort | uniq -c
```

### Advanced Monitoring

Consider using:

- **GoAccess**: Real-time log analyzer
- **Nginx Amplify**: Official monitoring tool
- **Prometheus + Grafana**: Full metrics stack

---

## Backup Configuration

```bash
# Backup current configuration
sudo cp /etc/nginx/sites-available/cangkir-minisoccer /etc/nginx/sites-available/cangkir-minisoccer.backup.$(date +%Y%m%d)

# Create full Nginx backup
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx
```

---

## Support

For issues with Nginx configuration, check:

1. Nginx documentation: https://nginx.org/en/docs/
2. Nginx error logs: `/var/log/nginx/cangkir-minisoccer-error.log`
3. System logs: `sudo journalctl -u nginx`

---

**Last Updated**: February 28, 2024
