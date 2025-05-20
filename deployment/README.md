# Project Pulse / مشاريعنا - Deployment Guide

This document provides comprehensive instructions for deploying the Project Pulse system, a modern project management platform for the Ministry of Defense. The system uses a high-availability architecture with redundant components, PostgreSQL replication, and TLS-secured communication.

## System Architecture

Project Pulse uses a distributed architecture with the following components:

- **Web Frontend**: React-based web application with Next.js
- **API Backend**: ASP.NET Core 8.0 RESTful API
- **Database**: PostgreSQL 16 with replication for high availability
- **Proxy**: Traefik as an edge router for TLS termination and routing

The system is deployed on two Ubuntu 24.04 servers with load balancing and failover capabilities.

## Prerequisites

Before deployment, ensure you have:

1. Two Ubuntu 24.04 LTS servers with:
   - Minimum 4GB RAM, 2 CPU cores, 40GB storage
   - Network connectivity between servers
   - Public IP addresses or DNS entries
   - SSH access with sudo privileges

2. On your local machine:
   - SSH client
   - Git
   - .NET SDK 8.0
   - Node.js 20+ and pnpm
   - TLS certificates for the target domain

3. TLS certificates for your domain in PEM format (fullchain.pem and privkey.pem)

## Deployment Process

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/projectpulse.git
cd projectpulse
```

### 2. Configure Deployment Settings

Edit the configuration section in `deployment/deploy.sh`:

```bash
# Server configuration
NODE01="172.28.17.95"             # Primary node IP
NODE02="172.28.17.96"             # Secondary node IP
SSH_USER="admin"                  # SSH user with sudo privileges
SSH_PORT="22"                     # SSH port

# Application configuration
APP_NAME="projectpulse"           # Application name
APP_DOMAIN="pm.mod.gov.qa"        # Application domain
API_PORT="5000"                   # API port
WEB_PORT="3000"                   # Web app port
DB_NAME="projectpulse"            # Database name
DB_USER="projectpulse_user"       # Database user
DB_PASSWORD="StrongP@ssw0rd123"   # Database password (change this!)
REPLICATION_USER="replicator"     # Replication user
REPLICATION_PASSWORD="Repl!c@t3"  # Replication password (change this!)

# Paths and directories
CERT_SRC_DIR="/local/certs"       # Source directory for certificates
CERT_DEST_DIR="/opt/certs"        # Destination directory for certificates
APPS_DIR="/opt/apps"              # Application directory
TRAEFIK_DIR="/etc/traefik"        # Traefik configuration directory
ADMIN_USER="Hadmin"               # Super admin username
ADMIN_PASSWORD="Admin@123!"       # Super admin password (change this!)
```

> **Important**: Change all default passwords to strong, unique passwords!

### 3. Prepare TLS Certificates

Place your TLS certificates in the directory specified in `CERT_SRC_DIR`:

```bash
# Create certificates directory if it doesn't exist
mkdir -p /local/certs

# Copy your certificates
cp /path/to/your/certificates/fullchain.pem /local/certs/mod-gov-qa.crt
cp /path/to/your/certificates/privkey.pem /local/certs/mod-gov-qa.key
```

### 4. Run the Deployment Script

Make the script executable and run it:

```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

The script performs the following actions:
- Installs necessary dependencies on both servers
- Configures PostgreSQL replication
- Builds and deploys the API and web application
- Sets up Traefik for TLS termination and routing
- Configures firewalls and system services
- Runs database migrations and seeds initial data
- Verifies the deployment

## Deployment Verification

After deployment, the script performs automatic verification checks, but you should also:

1. Access the web application at `https://pm.mod.gov.qa`
2. Log in with the admin credentials: `Hadmin` and the password set in the config
3. Verify that all features are working correctly
4. Test failover by stopping services on the primary node

## Post-Deployment Tasks

After successful deployment:

1. **Change default passwords**:
   - Log in to the admin panel and change the default admin password
   - Update database passwords in the configuration

2. **Configure backups**:
   - Set up regular database backups
   - Configure file system backups for the application

3. **Set up monitoring**:
   - Configure system monitoring (Prometheus, Grafana, etc.)
   - Set up log aggregation and analysis

## Maintenance

### Updating the Application

To update the application:

1. Pull the latest changes from the repository
2. Run the deployment script again (it's idempotent)

```bash
git pull
./deployment/deploy.sh
```

### Database Management

To back up the database:

```bash
# On the primary node
sudo -u postgres pg_dump -C -F c projectpulse > projectpulse_backup_$(date +%Y%m%d).dump
```

To restore a database backup:

```bash
# On the primary node
sudo -u postgres pg_restore -C -d postgres projectpulse_backup_YYYYMMDD.dump
```

### Logs and Troubleshooting

Application logs are located at:
- API logs: `/opt/apps/api/logs/`
- Web logs: `/opt/apps/web/logs/`
- Traefik logs: `/var/log/traefik/`
- PostgreSQL logs: `/var/log/postgresql/`

To view service status:

```bash
# Check service status
sudo systemctl status api
sudo systemctl status web
sudo systemctl status traefik
sudo systemctl status postgresql
```

## Security Considerations

The deployment script implements various security best practices:

1. TLS encryption for all web traffic
2. Database password authentication
3. Firewall configuration (UFW)
4. Service isolation (each component runs as its own user)
5. Regular log rotation and secure permissions

## Support and Troubleshooting

For support or troubleshooting, please contact:

- Technical Support: it-support@mod.gov.qa
- Project Manager: pm@mod.gov.qa
- Emergency Support: +974-XXXX-XXXX

## License

This software is proprietary and confidential. Unauthorized copying or distribution is prohibited. 