# ProjectPulse V1 Deployment Scripts

This directory contains comprehensive deployment scripts for ProjectPulse V1.0, providing complete one-shot installation including database setup, schema creation, CSV data import, SSL configuration, and application startup.

## 🚀 Quick Start (Recommended)

For the fastest deployment experience:

```bash
# Quick development deployment
./deployment/quick-start.sh

# Or for full production deployment
./deployment/deploy-v1.sh local
```

## 📁 Available Scripts

### `quick-start.sh` ✅ **RECOMMENDED FOR DEVELOPMENT**
- **Purpose**: Simplified one-shot deployment for development/testing
- **Features**: 
  - Automatic dependency installation
  - Database schema creation
  - CSV data import (Projects.csv & Milestones.csv)
  - Admin user creation
  - Immediate application startup
- **Use Case**: Development, testing, quick demos

**Usage:**
```bash
./deployment/quick-start.sh           # Quick start
./deployment/quick-start.sh full      # Run full deployment
./deployment/quick-start.sh help      # Show help
```

### `deploy-v1.sh` ✅ **RECOMMENDED FOR PRODUCTION**
- **Purpose**: Complete production-ready deployment
- **Features**:
  - System dependency installation
  - PostgreSQL setup and configuration
  - SSL certificate management (wildcard support)
  - Nginx configuration with security headers
  - Systemd service creation
  - Logging and monitoring setup
  - Automated backup configuration
  - Health checks and validation
- **Use Case**: Production deployments, staging environments

**Usage:**
```bash
./deployment/deploy-v1.sh local      # Local production deployment
./deployment/deploy-v1.sh validate   # Validate existing deployment
./deployment/deploy-v1.sh backup     # Create backup
./deployment/deploy-v1.sh help       # Show help
```

### `ssl-setup.sh` 🔒 **SSL CERTIFICATE HELPER**
- **Purpose**: SSL certificate detection and configuration
- **Features**:
  - Automatic wildcard certificate detection
  - Let's Encrypt certificate generation
  - Self-signed certificate creation
  - Certificate verification and validation
- **Use Case**: SSL setup, certificate management

**Usage:**
```bash
./deployment/ssl-setup.sh auto pm.mod.gov.qa    # Auto setup
./deployment/ssl-setup.sh scan                  # Scan for certificates
./deployment/ssl-setup.sh letsencrypt          # Generate Let's Encrypt cert
./deployment/ssl-setup.sh self-signed          # Generate self-signed cert
```

## 🗂️ Configuration Files

### `production.env`
Template environment configuration file with all necessary variables:
- Database configuration
- SSL settings
- Security keys
- Upload configurations
- Email/LDAP settings

Copy to project root as `.env` before deployment.

## 📋 Pre-Deployment Requirements

### System Requirements
- **OS**: Ubuntu 20.04+, CentOS 8+, macOS 10.15+
- **Memory**: 4GB RAM (minimum 2GB)
- **Disk**: 5GB free space
- **Network**: Internet connection for dependency installation

### Software Requirements
- **Node.js**: 18.0+ (automatically installed if missing)
- **PostgreSQL**: 12+ (automatically installed if missing)
- **Nginx**: Latest (automatically installed if missing)

## 🔧 Deployment Process

### Development Deployment (Quick Start)

1. **Ensure you have the required CSV files**:
   ```bash
   ls Projects.csv Milestones.csv  # Should exist in project root
   ```

2. **Run quick start**:
   ```bash
   ./deployment/quick-start.sh
   ```

3. **Access the application**:
   - URL: http://localhost:7000
   - Username: `admin`
   - Password: `Admin@123!`

### Production Deployment (Full)

1. **Prepare environment**:
   ```bash
   # Copy and customize environment file
   cp deployment/production.env .env
   nano .env  # Edit configuration
   ```

2. **Run full deployment**:
   ```bash
   ./deployment/deploy-v1.sh local
   ```

3. **Verify deployment**:
   ```bash
   ./deployment/deploy-v1.sh validate
   ```

4. **Access the application**:
   - HTTP: http://your-domain.com
   - HTTPS: https://your-domain.com (if SSL configured)

## 🔐 SSL Certificate Configuration

The deployment scripts support multiple SSL certificate sources:

### 1. Automatic Detection (Recommended)
The script automatically scans for existing wildcard certificates in common locations:
- `/etc/ssl/certs/`
- `/etc/nginx/ssl/`
- `/opt/ssl/`
- `/usr/local/ssl/`

### 2. Let's Encrypt (Free)
Automatically generates and configures Let's Encrypt certificates:
```bash
./deployment/ssl-setup.sh letsencrypt pm.mod.gov.qa
```

### 3. Self-Signed (Development)
Creates self-signed certificates for development:
```bash
./deployment/ssl-setup.sh self-signed pm.mod.gov.qa
```

### 4. Global Wildcard Certificates
The scripts look for global wildcard certificates commonly used in enterprise environments. Certificate patterns searched:
- `wildcard.*`
- `*.domain.com`
- `global.*`
- `star.*`

## 📊 Data Import

The deployment automatically imports data from CSV files:

### Required CSV Files
Place these files in the project root before deployment:

1. **Projects.csv** - Project data
2. **Milestones.csv** - Milestone and progress data

### Import Process
1. Database schema creation
2. Projects import (`import-projects.js`)
3. Milestones import (`import-milestones.js`)
4. Admin user creation (`create-admin.js`)

## 🛠️ Service Management

After deployment, manage the application using systemd:

```bash
# Service control
sudo systemctl start projectpulse
sudo systemctl stop projectpulse
sudo systemctl restart projectpulse
sudo systemctl status projectpulse

# View logs
sudo journalctl -u projectpulse -f
sudo journalctl -u projectpulse --since "1 hour ago"

# Nginx control
sudo systemctl reload nginx
sudo nginx -t  # Test configuration
```

## 📁 Directory Structure Post-Deployment

```
/opt/projectpulse/          # Application directory
├── dist/                   # Built frontend assets
├── uploads/                # User uploads
├── node_modules/           # Dependencies
└── production-server.js    # Main server file

/etc/nginx/ssl/             # SSL certificates
├── pm.mod.gov.qa.crt      # Certificate file
└── pm.mod.gov.qa.key      # Private key file

/var/log/projectpulse/      # Application logs
/opt/backups/projectpulse/  # Automated backups
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS projectpulse;"
./deployment/deploy-v1.sh local
```

#### 2. SSL Certificate Issues
```bash
# Check certificate validity
./deployment/ssl-setup.sh verify

# Regenerate certificates
./deployment/ssl-setup.sh self-signed pm.mod.gov.qa
```

#### 3. Port Already in Use
```bash
# Check what's using port 7000
sudo lsof -i :7000

# Kill process if needed
sudo kill -9 <PID>
```

#### 4. Permission Issues
```bash
# Fix application permissions
sudo chown -R $USER:$USER /opt/projectpulse
sudo chown -R www-data:www-data /opt/projectpulse/uploads
```

### Logs and Debugging

```bash
# Application logs
sudo journalctl -u projectpulse -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Stop application
sudo systemctl stop projectpulse

# Update code (pull from git, etc.)
git pull origin main

# Rebuild and restart
npm install
npm run build
sudo systemctl start projectpulse
```

### Database Backups
```bash
# Manual backup
sudo /usr/local/bin/projectpulse-backup

# Restore from backup
sudo -u postgres psql projectpulse < backup_file.sql
```

### Certificate Renewal
```bash
# Check certificate expiration
./deployment/ssl-setup.sh verify

# Renew Let's Encrypt certificates
sudo certbot renew
sudo systemctl reload nginx
```

## 📞 Support

For deployment issues:

1. **Check logs** using the commands above
2. **Validate deployment** with `./deployment/deploy-v1.sh validate`
3. **Review configuration** in `.env` file
4. **Check system resources** (disk space, memory)

## 🆚 Legacy Scripts (Archived)

The following scripts have been moved to `deployment/legacy/` and are **outdated**:

- `deploy-all.sh` ❌ **OUTDATED**
- `deploy-combined.sh` ❌ **OUTDATED** 
- `deploy-new.sh` ❌ **OUTDATED**
- `deploy-current.sh` ⚠️ **LEGACY** (kept for reference)

**Migration Path**: Use `deploy-v1.sh` or `quick-start.sh` instead.

## 🎯 Version Information

- **Current Version**: V1.0.0
- **Node.js**: 18.0+
- **Database**: PostgreSQL 12+
- **Web Server**: Nginx
- **SSL**: Automatic detection + Let's Encrypt + Self-signed fallback
- **Process Manager**: Systemd

---

**Last Updated**: $(date)  
**Deployment Scripts Version**: 1.0.0 