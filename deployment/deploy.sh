#!/usr/bin/env bash

# ============================================================================ #
# Project Pulse / مشاريعنا Deployment Script
# ============================================================================ #
# This script deploys the complete Project Management System stack to two
# Ubuntu 24.04 servers, configuring Traefik, PostgreSQL replication, and
# the API and web application components.
#
# The script is idempotent and can be run multiple times without side effects.
# ============================================================================ #

# Strict error handling
set -euo pipefail

# ============================================================================ #
# CONFIGURATION VARIABLES - MODIFY THESE AS NEEDED
# ============================================================================ #

# Server configuration
NODE01="172.28.17.95"             # Primary node
NODE02="172.28.17.96"             # Secondary node
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

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================ #
# HELPER FUNCTIONS
# ============================================================================ #

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

banner() {
  echo -e "\n${BLUE}=====================================================${NC}"
  echo -e "${BLUE}= $1${NC}"
  echo -e "${BLUE}=====================================================${NC}\n"
}

run_remote_command() {
  local host=$1
  local command=$2
  log_info "Running on $host: $command"
  ssh -p "$SSH_PORT" "$SSH_USER@$host" "$command"
  if [ $? -eq 0 ]; then
    log_success "Command executed successfully on $host"
    return 0
  else
    log_error "Command failed on $host"
    return 1
  fi
}

run_remote_sudo_command() {
  local host=$1
  local command=$2
  log_info "Running on $host with sudo: $command"
  ssh -p "$SSH_PORT" "$SSH_USER@$host" "sudo bash -c '$command'"
  if [ $? -eq 0 ]; then
    log_success "Sudo command executed successfully on $host"
    return 0
  else
    log_error "Sudo command failed on $host"
    return 1
  fi
}

run_remote_script() {
  local host=$1
  local script=$2
  log_info "Running script on $host"
  ssh -p "$SSH_PORT" "$SSH_USER@$host" "bash -s" < "$script"
  if [ $? -eq 0 ]; then
    log_success "Script executed successfully on $host"
    return 0
  else
    log_error "Script execution failed on $host"
    return 1
  fi
}

# Function to check if service is already installed/configured
check_installed() {
  local host=$1
  local command=$2
  local check=$3
  
  ssh -p "$SSH_PORT" "$SSH_USER@$host" "$command" 2>/dev/null | grep -q "$check"
  return $?
}

# Clean up on exit or error
cleanup() {
  log_info "Cleaning up temporary files"
  rm -f tmp_*.sql tmp_*.sh 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# ============================================================================ #
# DEPLOYMENT FUNCTIONS
# ============================================================================ #

install_dependencies() {
  banner "Installing dependencies on $1"
  
  # Create script to install dependencies
  cat > tmp_deps.sh << 'EOL'
#!/bin/bash
set -euo pipefail

# Function to check if a package is installed
is_installed() {
  dpkg -l "$1" 2>/dev/null | grep -q "^ii"
  return $?
}

# Update package lists
sudo apt-get update

# Install common dependencies if not already installed
for pkg in curl gnupg nginx-light jq; do
  if ! is_installed $pkg; then
    echo "Installing $pkg..."
    sudo apt-get install -y $pkg
  else
    echo "$pkg already installed"
  fi
done

# Add PostgreSQL repository if not already added
if [ ! -f /etc/apt/sources.list.d/pgdg.list ]; then
  echo "Adding PostgreSQL repository..."
  sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
  sudo apt-get update
fi

# Add .NET repository if not already added
if [ ! -f /etc/apt/sources.list.d/microsoft-prod.list ]; then
  echo "Adding .NET repository..."
  wget https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
  sudo dpkg -i packages-microsoft-prod.deb
  rm packages-microsoft-prod.deb
  sudo apt-get update
fi

# Add NodeJS repository if not already added
if [ ! -f /etc/apt/sources.list.d/nodesource.list ]; then
  echo "Adding NodeJS repository..."
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
  sudo apt-get update
fi

# Install PostgreSQL if not already installed
if ! is_installed postgresql-16; then
  echo "Installing PostgreSQL 16..."
  sudo apt-get install -y postgresql-16 postgresql-client-16
else
  echo "PostgreSQL 16 already installed"
fi

# Install .NET Runtime if not already installed
if ! is_installed dotnet-runtime-8.0; then
  echo "Installing .NET Runtime 8.0..."
  sudo apt-get install -y dotnet-runtime-8.0
else
  echo ".NET Runtime 8.0 already installed"
fi

# Install NodeJS if not already installed
if ! is_installed nodejs; then
  echo "Installing NodeJS 20..."
  sudo apt-get install -y nodejs
else
  echo "NodeJS already installed"
fi

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  sudo npm install -g pnpm
else
  echo "pnpm already installed"
fi

# Install Traefik if not already installed
if [ ! -f /usr/local/bin/traefik ]; then
  echo "Installing Traefik..."
  sudo curl -L https://github.com/traefik/traefik/releases/download/v3.3.0/traefik_v3.3.0_linux_amd64.tar.gz -o traefik.tar.gz
  sudo tar -zxvf traefik.tar.gz -C /tmp
  sudo mv /tmp/traefik /usr/local/bin/
  sudo chmod +x /usr/local/bin/traefik
  rm -f traefik.tar.gz
else
  echo "Traefik already installed"
fi

# Create necessary directories
sudo mkdir -p /etc/traefik
sudo mkdir -p /etc/traefik/dynamic
sudo mkdir -p /opt/apps/api
sudo mkdir -p /opt/apps/web
sudo mkdir -p /opt/certs

# Set proper ownership
sudo chown -R $(whoami):$(whoami) /opt/apps
EOL

  # Run the script on the remote server
  run_remote_script "$1" "tmp_deps.sh"
  
  # Remove temporary script
  rm -f tmp_deps.sh
}

configure_traefik() {
  banner "Configuring Traefik on $1"
  
  # Create Traefik static configuration
  cat > tmp_traefik.yml << EOL
# /etc/traefik/traefik.yml
global:
  checkNewVersion: false
  sendAnonymousUsage: false

log:
  level: INFO

api:
  dashboard: false
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true

serversTransport:
  insecureSkipVerify: false
EOL

  # Create Traefik dynamic configuration for TLS and routes
  cat > tmp_dynamic_conf.yml << EOL
# /etc/traefik/dynamic/conf.yml
http:
  routers:
    api:
      rule: "Host(\`${APP_DOMAIN}\`) && PathPrefix(\`/api\`)"
      service: api
      tls: {}
      entryPoints:
        - websecure
    web:
      rule: "Host(\`${APP_DOMAIN}\`)"
      service: web
      tls: {}
      entryPoints:
        - websecure
      priority: 1

  services:
    api:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:${API_PORT}"
    web:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:${WEB_PORT}"

tls:
  certificates:
    - certFile: "${CERT_DEST_DIR}/mod-gov-qa.crt"
      keyFile: "${CERT_DEST_DIR}/mod-gov-qa.key"
EOL

  # Create systemd service file
  cat > tmp_traefik.service << EOL
[Unit]
Description=Traefik Edge Router
After=network.target

[Service]
Type=simple
User=root
Group=root
ExecStart=/usr/local/bin/traefik --configfile=/etc/traefik/traefik.yml
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOL

  # Copy configurations to the server
  scp -P "$SSH_PORT" tmp_traefik.yml "$SSH_USER@$1:/tmp/traefik.yml"
  scp -P "$SSH_PORT" tmp_dynamic_conf.yml "$SSH_USER@$1:/tmp/conf.yml"
  scp -P "$SSH_PORT" tmp_traefik.service "$SSH_USER@$1:/tmp/traefik.service"
  
  # Move configurations to the correct locations
  run_remote_sudo_command "$1" "mv /tmp/traefik.yml /etc/traefik/traefik.yml"
  run_remote_sudo_command "$1" "mkdir -p /etc/traefik/dynamic && mv /tmp/conf.yml /etc/traefik/dynamic/conf.yml"
  run_remote_sudo_command "$1" "mv /tmp/traefik.service /etc/systemd/system/traefik.service"
  
  # Clean up temporary files
  rm -f tmp_traefik.yml tmp_dynamic_conf.yml tmp_traefik.service
}

copy_certificates() {
  banner "Copying TLS certificates to $1"
  
  # Create destination directory if it doesn't exist
  run_remote_sudo_command "$1" "mkdir -p $CERT_DEST_DIR"
  
  # Copy certificates
  scp -P "$SSH_PORT" "$CERT_SRC_DIR/mod-gov-qa.crt" "$SSH_USER@$1:/tmp/mod-gov-qa.crt"
  scp -P "$SSH_PORT" "$CERT_SRC_DIR/mod-gov-qa.key" "$SSH_USER@$1:/tmp/mod-gov-qa.key"
  
  # Move certificates to destination and set proper permissions
  run_remote_sudo_command "$1" "mv /tmp/mod-gov-qa.crt $CERT_DEST_DIR/mod-gov-qa.crt"
  run_remote_sudo_command "$1" "mv /tmp/mod-gov-qa.key $CERT_DEST_DIR/mod-gov-qa.key"
  run_remote_sudo_command "$1" "chmod 600 $CERT_DEST_DIR/mod-gov-qa.crt $CERT_DEST_DIR/mod-gov-qa.key"
}

configure_postgres_primary() {
  banner "Configuring PostgreSQL primary on $NODE01"
  
  # Create script to configure PostgreSQL primary
  cat > tmp_pg_primary.sh << EOF
#!/bin/bash
set -euo pipefail

# Check if PostgreSQL is already configured for replication
if grep -q "wal_level = logical" /etc/postgresql/16/main/postgresql.conf; then
  echo "PostgreSQL is already configured for replication"
else
  echo "Configuring PostgreSQL for replication..."
  
  # Configure postgresql.conf
  sudo sed -i "s/#wal_level = replica/wal_level = logical/" /etc/postgresql/16/main/postgresql.conf
  sudo sed -i "s/#max_wal_senders = 10/max_wal_senders = 10/" /etc/postgresql/16/main/postgresql.conf
  sudo sed -i "s/#wal_keep_size = 0/wal_keep_size = 1024/" /etc/postgresql/16/main/postgresql.conf
  sudo sed -i "s/#max_replication_slots = 10/max_replication_slots = 10/" /etc/postgresql/16/main/postgresql.conf
  
  # Configure pg_hba.conf to allow replication
  echo "host replication ${REPLICATION_USER} ${NODE02}/32 md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
  
  # Restart PostgreSQL
  sudo systemctl restart postgresql
fi

# Check if database user exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  echo "Database user ${DB_USER} already exists"
else
  echo "Creating database user ${DB_USER}..."
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
fi

# Check if replication user exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${REPLICATION_USER}'" | grep -q 1; then
  echo "Replication user ${REPLICATION_USER} already exists"
else
  echo "Creating replication user ${REPLICATION_USER}..."
  sudo -u postgres psql -c "CREATE USER ${REPLICATION_USER} WITH REPLICATION PASSWORD '${REPLICATION_PASSWORD}';"
fi

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
  echo "Database ${DB_NAME} already exists"
else
  echo "Creating database ${DB_NAME}..."
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
fi

# Configure database for app
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};"
EOF

  # Replace variables in the script
  sed -i "s/\${REPLICATION_USER}/$REPLICATION_USER/g" tmp_pg_primary.sh
  sed -i "s/\${NODE02}/$NODE02/g" tmp_pg_primary.sh
  sed -i "s/\${DB_USER}/$DB_USER/g" tmp_pg_primary.sh
  sed -i "s/\${DB_PASSWORD}/$DB_PASSWORD/g" tmp_pg_primary.sh
  sed -i "s/\${REPLICATION_PASSWORD}/$REPLICATION_PASSWORD/g" tmp_pg_primary.sh
  sed -i "s/\${DB_NAME}/$DB_NAME/g" tmp_pg_primary.sh
  
  # Run the script on the primary node
  run_remote_script "$NODE01" "tmp_pg_primary.sh"
  
  # Remove temporary script
  rm -f tmp_pg_primary.sh
}

configure_postgres_standby() {
  banner "Configuring PostgreSQL standby on $NODE02"
  
  # Create script to configure PostgreSQL standby
  cat > tmp_pg_standby.sh << EOF
#!/bin/bash
set -euo pipefail

# Check if PostgreSQL is already configured as a standby
if grep -q "primary_conninfo" /etc/postgresql/16/main/postgresql.conf && [ -f /var/lib/postgresql/16/main/standby.signal ]; then
  echo "PostgreSQL is already configured as a standby"
else
  echo "Configuring PostgreSQL as a standby..."
  
  # Stop PostgreSQL
  sudo systemctl stop postgresql
  
  # Remove existing data directory
  sudo rm -rf /var/lib/postgresql/16/main
  
  # Create base backup from primary
  sudo -u postgres pg_basebackup -h ${NODE01} -U ${REPLICATION_USER} -p 5432 -D /var/lib/postgresql/16/main -P -X stream
  
  # Create standby.signal file
  sudo -u postgres touch /var/lib/postgresql/16/main/standby.signal
  
  # Configure postgresql.conf for standby
  echo "primary_conninfo = 'host=${NODE01} port=5432 user=${REPLICATION_USER} password=${REPLICATION_PASSWORD} application_name=${NODE02}'" | sudo tee -a /var/lib/postgresql/16/main/postgresql.conf
  
  # Start PostgreSQL
  sudo systemctl start postgresql
fi
EOF

  # Replace variables in the script
  sed -i "s/\${NODE01}/$NODE01/g" tmp_pg_standby.sh
  sed -i "s/\${REPLICATION_USER}/$REPLICATION_USER/g" tmp_pg_standby.sh
  sed -i "s/\${REPLICATION_PASSWORD}/$REPLICATION_PASSWORD/g" tmp_pg_standby.sh
  sed -i "s/\${NODE02}/$NODE02/g" tmp_pg_standby.sh
  
  # Run the script on the standby node
  run_remote_script "$NODE02" "tmp_pg_standby.sh"
  
  # Remove temporary script
  rm -f tmp_pg_standby.sh
}

build_deploy_api() {
  banner "Building and deploying API"
  
  # Build the API
  log_info "Building API"
  dotnet publish -c Release ./apps/api -o ./out/api
  
  # Create directories on both nodes
  run_remote_sudo_command "$NODE01" "mkdir -p $APPS_DIR/api"
  run_remote_sudo_command "$NODE02" "mkdir -p $APPS_DIR/api"
  
  # Create systemd service file
  cat > tmp_api.service << EOL
[Unit]
Description=Project Pulse API
After=network.target postgresql.service

[Service]
WorkingDirectory=${APPS_DIR}/api
ExecStart=/usr/bin/dotnet ${APPS_DIR}/api/ProjectManagement.Api.dll --urls=http://0.0.0.0:${API_PORT}
Restart=always
RestartSec=10
SyslogIdentifier=projectpulse-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ConnectionStrings__DefaultConnection=Host=localhost;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASSWORD}

[Install]
WantedBy=multi-user.target
EOL
  
  # Copy API files to both nodes
  log_info "Copying API files to $NODE01"
  rsync -avz -e "ssh -p $SSH_PORT" ./out/api/ "$SSH_USER@$NODE01:/tmp/api/"
  run_remote_sudo_command "$NODE01" "cp -r /tmp/api/* $APPS_DIR/api/ && chown -R www-data:www-data $APPS_DIR/api"
  
  log_info "Copying API files to $NODE02"
  rsync -avz -e "ssh -p $SSH_PORT" ./out/api/ "$SSH_USER@$NODE02:/tmp/api/"
  run_remote_sudo_command "$NODE02" "cp -r /tmp/api/* $APPS_DIR/api/ && chown -R www-data:www-data $APPS_DIR/api"
  
  # Copy and enable systemd service on both nodes
  scp -P "$SSH_PORT" tmp_api.service "$SSH_USER@$NODE01:/tmp/api.service"
  run_remote_sudo_command "$NODE01" "mv /tmp/api.service /etc/systemd/system/api.service"
  run_remote_sudo_command "$NODE01" "systemctl daemon-reload && systemctl enable api.service"
  
  scp -P "$SSH_PORT" tmp_api.service "$SSH_USER@$NODE02:/tmp/api.service"
  run_remote_sudo_command "$NODE02" "mv /tmp/api.service /etc/systemd/system/api.service"
  run_remote_sudo_command "$NODE02" "systemctl daemon-reload && systemctl enable api.service"
  
  # Clean up temporary files
  rm -f tmp_api.service
}

run_database_migrations() {
  banner "Running database migrations"
  
  # Check if dotnet-ef is installed
  if ! command -v dotnet-ef &> /dev/null; then
    log_info "Installing dotnet-ef tool"
    dotnet tool install --global dotnet-ef
  fi
  
  # Run migrations
  log_info "Running migrations on the primary database"
  cd ./apps/api
  dotnet ef database update --connection "Host=$NODE01;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD"
  cd ../..
  
  # Create script to seed initial data
  cat > tmp_seed.sql << EOF
-- Check if Signal Corps department exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Signal Corps') THEN
    INSERT INTO departments (name, description, code, created_at, updated_at)
    VALUES ('Signal Corps', 'Signal Corps Department', 'SIG', NOW(), NOW());
  END IF;
END
\$\$;

-- Check if admin user exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = '${ADMIN_USER}') THEN
    INSERT INTO users (name, username, email, password_hash, role, created_at, updated_at)
    VALUES ('Super Admin', '${ADMIN_USER}', 'admin@mod.gov.qa', crypt('${ADMIN_PASSWORD}', gen_salt('bf')), 'Administrator', NOW(), NOW());
  END IF;
END
\$\$;
EOF

  # Copy seed script to primary node
  scp -P "$SSH_PORT" tmp_seed.sql "$SSH_USER@$NODE01:/tmp/seed.sql"
  
  # Run seed script
  run_remote_sudo_command "$NODE01" "sudo -u postgres psql -d $DB_NAME -f /tmp/seed.sql"
  
  # Remove temporary script
  rm -f tmp_seed.sql
}

build_deploy_web() {
  banner "Building and deploying web application"
  
  # Build the web application
  log_info "Building web application"
  cd ./apps/web
  pnpm install
  NEXT_PUBLIC_API_URL=https://$APP_DOMAIN/api pnpm build
  cd ../..
  
  # Create directory on both nodes
  run_remote_sudo_command "$NODE01" "mkdir -p $APPS_DIR/web"
  run_remote_sudo_command "$NODE02" "mkdir -p $APPS_DIR/web"
  
  # Create systemd service file
  cat > tmp_web.service << EOL
[Unit]
Description=Project Pulse Web
After=network.target

[Service]
WorkingDirectory=${APPS_DIR}/web
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
SyslogIdentifier=projectpulse-web
User=www-data
Environment=PORT=${WEB_PORT}
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL
  
  # Copy web files to both nodes
  log_info "Copying web files to $NODE01"
  rsync -avz -e "ssh -p $SSH_PORT" ./apps/web/.next/standalone/ "$SSH_USER@$NODE01:/tmp/web/"
  run_remote_sudo_command "$NODE01" "cp -r /tmp/web/* $APPS_DIR/web/ && chown -R www-data:www-data $APPS_DIR/web"
  
  log_info "Copying web files to $NODE02"
  rsync -avz -e "ssh -p $SSH_PORT" ./apps/web/.next/standalone/ "$SSH_USER@$NODE02:/tmp/web/"
  run_remote_sudo_command "$NODE02" "cp -r /tmp/web/* $APPS_DIR/web/ && chown -R www-data:www-data $APPS_DIR/web"
  
  # Copy and enable systemd service on both nodes
  scp -P "$SSH_PORT" tmp_web.service "$SSH_USER@$NODE01:/tmp/web.service"
  run_remote_sudo_command "$NODE01" "mv /tmp/web.service /etc/systemd/system/web.service"
  run_remote_sudo_command "$NODE01" "systemctl daemon-reload && systemctl enable web.service"
  
  scp -P "$SSH_PORT" tmp_web.service "$SSH_USER@$NODE02:/tmp/web.service"
  run_remote_sudo_command "$NODE02" "mv /tmp/web.service /etc/systemd/system/web.service"
  run_remote_sudo_command "$NODE02" "systemctl daemon-reload && systemctl enable web.service"
  
  # Clean up temporary files
  rm -f tmp_web.service
}

configure_firewall() {
  banner "Configuring firewall"
  
  # Create script to configure UFW
  cat > tmp_firewall.sh << 'EOL'
#!/bin/bash
set -euo pipefail

# Check if UFW is already enabled
if sudo ufw status | grep -q "Status: active"; then
  echo "UFW is already enabled"
else
  echo "Configuring UFW..."
  
  # Reset UFW to default
  sudo ufw --force reset
  
  # Allow SSH
  sudo ufw allow 22/tcp
  
  # Allow HTTP and HTTPS
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  
  # Enable UFW
  sudo ufw --force enable
fi
EOL
  
  # Run the script on both nodes
  run_remote_script "$NODE01" "tmp_firewall.sh"
  run_remote_script "$NODE02" "tmp_firewall.sh"
  
  # Remove temporary script
  rm -f tmp_firewall.sh
}

start_services() {
  banner "Starting services"
  
  # Start services on primary node
  log_info "Starting services on $NODE01"
  run_remote_sudo_command "$NODE01" "systemctl restart postgresql traefik api web"
  
  # Start services on secondary node
  log_info "Starting services on $NODE02"
  run_remote_sudo_command "$NODE02" "systemctl restart postgresql traefik api web"
}

configure_log_rotation() {
  banner "Configuring log rotation"
  
  # Create logrotate configuration
  cat > tmp_logrotate.conf << EOL
${APPS_DIR}/api/logs/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload api >/dev/null 2>&1 || true
  endscript
}

${APPS_DIR}/web/logs/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload web >/dev/null 2>&1 || true
  endscript
}

/var/log/traefik/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 root root
  sharedscripts
  postrotate
    systemctl reload traefik >/dev/null 2>&1 || true
  endscript
}
EOL

  # Copy logrotate configuration to both nodes
  scp -P "$SSH_PORT" tmp_logrotate.conf "$SSH_USER@$NODE01:/tmp/projectpulse.conf"
  run_remote_sudo_command "$NODE01" "mv /tmp/projectpulse.conf /etc/logrotate.d/projectpulse"
  
  scp -P "$SSH_PORT" tmp_logrotate.conf "$SSH_USER@$NODE02:/tmp/projectpulse.conf"
  run_remote_sudo_command "$NODE02" "mv /tmp/projectpulse.conf /etc/logrotate.d/projectpulse"
  
  # Create log directories
  run_remote_sudo_command "$NODE01" "mkdir -p ${APPS_DIR}/api/logs ${APPS_DIR}/web/logs /var/log/traefik"
  run_remote_sudo_command "$NODE01" "chown -R www-data:www-data ${APPS_DIR}/api/logs ${APPS_DIR}/web/logs"
  run_remote_sudo_command "$NODE01" "chown -R root:root /var/log/traefik"
  
  run_remote_sudo_command "$NODE02" "mkdir -p ${APPS_DIR}/api/logs ${APPS_DIR}/web/logs /var/log/traefik"
  run_remote_sudo_command "$NODE02" "chown -R www-data:www-data ${APPS_DIR}/api/logs ${APPS_DIR}/web/logs"
  run_remote_sudo_command "$NODE02" "chown -R root:root /var/log/traefik"
  
  # Remove temporary file
  rm -f tmp_logrotate.conf
}

verify_deployment() {
  banner "Verifying deployment"
  
  # Wait for services to start
  log_info "Waiting for services to start..."
  sleep 10
  
  # Check service status on both nodes
  log_info "Checking service status on $NODE01"
  run_remote_sudo_command "$NODE01" "systemctl is-active traefik api web"
  
  log_info "Checking service status on $NODE02"
  run_remote_sudo_command "$NODE02" "systemctl is-active traefik api web"
  
  # Check database replication
  log_info "Checking database replication on $NODE02"
  run_remote_sudo_command "$NODE02" "sudo -u postgres psql -c \"SELECT pg_is_in_recovery();\""
  
  # Check API health
  log_info "Checking API health"
  curl -k "https://$APP_DOMAIN/api/healthz" || echo "API health check failed"
  
  # Check TLS certificate
  log_info "Checking TLS certificate"
  echo | openssl s_client -servername $APP_DOMAIN -connect $APP_DOMAIN:443 2>/dev/null | grep -A 1 "DNS:" || echo "TLS certificate check failed"
}

# ============================================================================ #
# MAIN SCRIPT
# ============================================================================ #

main() {
  banner "Starting Project Pulse deployment"
  
  # Check prerequisites
  for cmd in ssh scp rsync jq dotnet; do
    if ! command -v $cmd &> /dev/null; then
      log_error "$cmd is not installed. Please install it and try again."
      exit 1
    fi
  done
  
  # Check if certificates exist
  if [ ! -f "$CERT_SRC_DIR/mod-gov-qa.crt" ] || [ ! -f "$CERT_SRC_DIR/mod-gov-qa.key" ]; then
    log_error "Certificates not found in $CERT_SRC_DIR"
    exit 1
  fi
  
  # Check if source code exists
  if [ ! -d "./apps/api" ] || [ ! -d "./apps/web" ]; then
    log_error "Source code directories not found"
    exit 1
  fi
  
  # Install dependencies on both nodes
  install_dependencies "$NODE01"
  install_dependencies "$NODE02"
  
  # Copy certificates to both nodes
  copy_certificates "$NODE01"
  copy_certificates "$NODE02"
  
  # Configure Traefik on both nodes
  configure_traefik "$NODE01"
  configure_traefik "$NODE02"
  
  # Configure PostgreSQL
  configure_postgres_primary
  configure_postgres_standby
  
  # Build and deploy API
  build_deploy_api
  
  # Run database migrations
  run_database_migrations
  
  # Build and deploy web application
  build_deploy_web
  
  # Configure firewall
  configure_firewall
  
  # Configure log rotation
  configure_log_rotation
  
  # Start services
  start_services
  
  # Verify deployment
  verify_deployment
  
  banner "Deployment completed successfully"
}

# Run the main function
main 