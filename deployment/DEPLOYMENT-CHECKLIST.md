# ProjectPulse V1 Deployment Checklist

This checklist ensures a complete and successful deployment of ProjectPulse V1.

## 📋 Pre-Deployment Checklist

### ✅ System Requirements
- [ ] **Operating System**: Ubuntu 20.04+, CentOS 8+, or macOS 10.15+
- [ ] **Memory**: 4GB RAM minimum (2GB absolute minimum)
- [ ] **Disk Space**: 5GB free space available
- [ ] **Network**: Internet connection available
- [ ] **User Permissions**: Non-root user with sudo privileges

### ✅ Required Files
- [ ] `Projects.csv` exists in project root
- [ ] `Milestones.csv` exists in project root
- [ ] `package.json` exists and is valid
- [ ] All deployment scripts are executable:
  ```bash
  ls -la deployment/*.sh
  ```

### ✅ Environment Configuration
- [ ] Copy environment template:
  ```bash
  cp deployment/production.env .env
  ```
- [ ] Review and customize `.env` file:
  - [ ] Database credentials
  - [ ] Domain configuration
  - [ ] SSL settings
  - [ ] Security keys (change defaults!)
  - [ ] Admin credentials

## 🚀 Deployment Options

Choose your deployment method:

### Option A: Quick Start (Development/Testing)
**Best for**: Development, testing, demos
```bash
./deployment/quick-start.sh
```

### Option B: Full Production Deployment
**Best for**: Production, staging environments
```bash
./deployment/deploy-v1.sh local
```

## 📝 Deployment Process

### Phase 1: System Preparation
- [ ] Check system requirements
- [ ] Install system dependencies
- [ ] Install Node.js 18+
- [ ] Install PostgreSQL
- [ ] Install Nginx

### Phase 2: Application Setup
- [ ] Install npm dependencies
- [ ] Build application
- [ ] Create application directories
- [ ] Set proper permissions

### Phase 3: Database Configuration
- [ ] Start PostgreSQL service
- [ ] Create database and user
- [ ] Run schema creation scripts
- [ ] Import CSV data (Projects & Milestones)
- [ ] Create admin user

### Phase 4: SSL Certificate Setup
- [ ] Scan for existing wildcard certificates
- [ ] Generate/install SSL certificates
- [ ] Configure certificate permissions
- [ ] Verify certificate validity

### Phase 5: Web Server Configuration
- [ ] Configure Nginx with security headers
- [ ] Set up SSL termination
- [ ] Configure proxy settings
- [ ] Test Nginx configuration

### Phase 6: Application Service
- [ ] Create systemd service
- [ ] Configure service auto-start
- [ ] Set up log rotation
- [ ] Configure monitoring

### Phase 7: Backup & Monitoring
- [ ] Install backup scripts
- [ ] Configure automated backups
- [ ] Set up health monitoring
- [ ] Configure log aggregation

## 🔍 Post-Deployment Verification

### ✅ Service Status Checks
```bash
# Check all services are running
sudo systemctl status projectpulse
sudo systemctl status postgresql
sudo systemctl status nginx

# Run comprehensive health check
./deployment/health-check.sh
```

### ✅ Application Access Tests
- [ ] HTTP access: `http://localhost:7000`
- [ ] HTTPS access: `https://your-domain.com` (if SSL configured)
- [ ] Login with admin credentials
- [ ] Verify data import (check projects and milestones)
- [ ] Test file upload functionality
- [ ] Verify API endpoints work

### ✅ Database Verification
```bash
# Check database tables
sudo -u postgres psql -d projectpulse -c "\dt"

# Check record counts
sudo -u postgres psql -d projectpulse -c "
SELECT 
  'projects' as table_name, COUNT(*) as records FROM projects
UNION ALL
SELECT 
  'milestones' as table_name, COUNT(*) as records FROM milestones
UNION ALL
SELECT 
  'users' as table_name, COUNT(*) as records FROM users;
"
```

### ✅ SSL Certificate Verification
```bash
# Check certificate details
./deployment/ssl-setup.sh verify

# Test SSL endpoint
curl -I https://your-domain.com
```

### ✅ Security Verification
- [ ] Default passwords changed
- [ ] File permissions are secure
- [ ] Firewall configured (if applicable)
- [ ] Security headers present in HTTP responses
- [ ] Database access restricted

## 🛠️ Common Commands

### Service Management
```bash
# Start/stop/restart application
sudo systemctl start projectpulse
sudo systemctl stop projectpulse
sudo systemctl restart projectpulse

# View application logs
sudo journalctl -u projectpulse -f
sudo journalctl -u projectpulse --since "1 hour ago"

# Reload Nginx
sudo systemctl reload nginx
```

### Backup & Restore
```bash
# Create backup
sudo /usr/local/bin/projectpulse-backup

# List backups
ls -la /opt/backups/projectpulse/

# Restore database (example)
sudo -u postgres psql projectpulse < backup_file.sql
```

### Health Monitoring
```bash
# Full health check
./deployment/health-check.sh

# Quick health check
./deployment/health-check.sh quick

# Service-specific checks
./deployment/health-check.sh services
./deployment/health-check.sh database
./deployment/health-check.sh ssl
```

## 🚨 Troubleshooting Quick Reference

### Application Won't Start
```bash
# Check service status
sudo systemctl status projectpulse

# Check logs for errors
sudo journalctl -u projectpulse --since "10 minutes ago"

# Verify port availability
sudo lsof -i :7000
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d projectpulse -c "SELECT 1;"

# Check database configuration
cat .env | grep DB_
```

### SSL Certificate Problems
```bash
# Check certificate files
ls -la /etc/nginx/ssl/

# Verify certificate
./deployment/ssl-setup.sh verify

# Regenerate self-signed certificate
./deployment/ssl-setup.sh self-signed pm.mod.gov.qa
```

### Permission Issues
```bash
# Fix application permissions
sudo chown -R $USER:$USER /opt/projectpulse

# Fix upload directory permissions
sudo chown -R www-data:www-data /opt/projectpulse/uploads
sudo chmod 755 /opt/projectpulse/uploads
```

## 📊 Performance Optimization

### After Deployment
- [ ] Monitor memory usage: `free -h`
- [ ] Monitor disk usage: `df -h`
- [ ] Check application performance
- [ ] Review Nginx access logs
- [ ] Set up automated monitoring (optional)

### Production Recommendations
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Enable fail2ban (optional)
- [ ] Set up SSL certificate auto-renewal
- [ ] Configure email notifications
- [ ] Set up performance monitoring

## 📝 Deployment Sign-off

### Pre-Production Checklist
- [ ] All tests pass
- [ ] Performance is acceptable
- [ ] Security scan completed
- [ ] Backup/restore tested
- [ ] Documentation updated
- [ ] Team trained on new system

### Production Deployment
- [ ] Deployment window scheduled
- [ ] Rollback plan prepared
- [ ] Monitoring configured
- [ ] Support team notified
- [ ] Deployment completed successfully
- [ ] Post-deployment testing completed

---

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Environment**: ________________  
**Version**: V1.0.0  

**Signature**: ________________ 