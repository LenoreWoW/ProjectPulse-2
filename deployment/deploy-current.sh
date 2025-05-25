#!/usr/bin/env bash

# ============================================================================ #
# Project Pulse Current Architecture Deployment Script
# ============================================================================ #
# This script deploys the current Node.js/Express + Vite/React architecture
# Updated to match the actual project structure and technology stack
# ============================================================================ #

# Strict error handling
set -euo pipefail

# ============================================================================ #
# CONFIGURATION VARIABLES
# ============================================================================ #

# Server configuration for remote deployment
NODE01="172.28.17.95"             # Primary node
NODE02="172.28.17.96"             # Secondary node
SSH_USER="admin"                  # SSH user with sudo privileges
SSH_PORT="22"                     # SSH port

# Application configuration
APP_NAME="projectpulse"           # Application name
APP_DOMAIN="pm.mod.gov.qa"        # Application domain
APP_PORT="7000"                   # Application port (matches production-server.js)
DB_NAME="projectpulse"            # Database name
DB_USER="postgres"                # Database user (matches current setup)
DB_PASSWORD="postgres"            # Database password
REPLICATION_USER="replicator"     # Replication user
REPLICATION_PASSWORD="Repl!c@t3"  # Replication password

# Paths and directories
CERT_SRC_DIR="/local/certs"       # Source directory for certificates
CERT_DEST_DIR="/opt/certs"        # Destination directory for certificates
APP_DIR="/opt/projectpulse"       # Application directory
ADMIN_USER="admin"                # Admin username (matches current setup)
ADMIN_PASSWORD="admin123"         # Admin password

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Clean up on exit or error
cleanup() {
  log_info "Cleaning up temporary files"
  rm -f tmp_*.sql tmp_*.sh tmp_*.service tmp_*.yml 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# ============================================================================ #
# REMOTE DEPLOYMENT HELPER FUNCTIONS
# ============================================================================ #

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

# ============================================================================ #
# LOCAL DEPLOYMENT FUNCTIONS
# ============================================================================ #

check_node() {
  log_info "Checking if Node.js is installed..."
  
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js and try again."
    exit 1
  fi
  
  NODE_VERSION=$(node -v)
  log_success "Node.js is installed: $NODE_VERSION"
}

install_local_dependencies() {
  log_info "Installing dependencies..."
  
  cd "$PROJECT_ROOT"
  npm install
  
  log_success "Dependencies installed successfully"
}

build_local_project() {
  log_info "Building the project..."
  
  cd "$PROJECT_ROOT"
  npm run build
  
  log_success "Project built successfully"
}

setup_local_postgres() {
  log_info "Setting up PostgreSQL..."
  
  cd "$PROJECT_ROOT"
  
  # Check if database check script exists
  if [ -f "$PROJECT_ROOT/check-database.js" ]; then
    log_info "Running database check script..."
    node "$PROJECT_ROOT/check-database.js"
  else
    log_warn "Database check script not found. Please ensure PostgreSQL is set up manually."
  fi
  
  log_success "PostgreSQL setup completed"
}

start_local_server() {
  log_info "Starting local server..."
  
  cd "$PROJECT_ROOT"
  
  # Check if production server exists
  if [ -f "$PROJECT_ROOT/production-server.js" ]; then
    log_info "Starting production server..."
    node production-server.js &
    SERVER_PID=$!
    log_success "Server started with PID: $SERVER_PID"
    log_info "Server should be available at http://localhost:7000"
  else
    log_error "production-server.js not found"
    exit 1
  fi
}

deploy_local() {
  banner "Starting local deployment process"
  
  check_node
  install_local_dependencies
  build_local_project
  setup_local_postgres
  start_local_server
  
  log_success "Local deployment completed successfully!"
  log_info "Application is running at http://localhost:7000"
}

# ============================================================================ #
# RENDER DEPLOYMENT FUNCTIONS
# ============================================================================ #

deploy_render() {
  banner "Starting deployment for Render"
  
  # Copy the render-specific environment file
  log_info "Copying Render environment file..."
  if [ -f "$PROJECT_ROOT/.env.render" ]; then
    cp "$PROJECT_ROOT/.env.render" "$PROJECT_ROOT/.env"
    log_success "Environment file copied successfully"
  else
    log_warn "Render environment file (.env.render) not found, using default .env if available"
  fi

  # Install dependencies
  log_info "Installing dependencies..."
  cd "$PROJECT_ROOT"
  npm install
  
  # Build the application
  log_info "Building the application..."
  npm run build
  
  log_success "Render deployment build completed successfully!"
}

# ============================================================================ #
# REMOTE DEPLOYMENT FUNCTIONS
# ============================================================================ #

install_remote_dependencies() {
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

# Install common dependencies
for pkg in curl gnupg nginx-light jq git; do
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

# Install NodeJS if not already installed
if ! is_installed nodejs; then
  echo "Installing NodeJS 20..."
  sudo apt-get install -y nodejs
else
  echo "NodeJS already installed"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  sudo npm install -g pm2
else
  echo "PM2 already installed"
fi

# Create necessary directories
sudo mkdir -p /opt/projectpulse
sudo mkdir -p /opt/certs
sudo mkdir -p /var/log/projectpulse

# Set proper ownership
sudo chown -R $(whoami):$(whoami) /opt/projectpulse
EOL

  # Run the script on the remote server
  run_remote_script "$1" "tmp_deps.sh"
  rm -f tmp_deps.sh
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

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
  echo "Database ${DB_NAME} already exists"
else
  echo "Creating database ${DB_NAME}..."
  sudo -u postgres createdb ${DB_NAME}
fi

# Check if replication user exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${REPLICATION_USER}'" | grep -q 1; then
  echo "Replication user ${REPLICATION_USER} already exists"
else
  echo "Creating replication user ${REPLICATION_USER}..."
  sudo -u postgres psql -c "CREATE USER ${REPLICATION_USER} WITH REPLICATION PASSWORD '${REPLICATION_PASSWORD}';"
fi

# Create session table for express-session
sudo -u postgres psql -d ${DB_NAME} -c "
CREATE TABLE IF NOT EXISTS user_sessions (
  sid varchar NOT NULL COLLATE \"default\",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON user_sessions (expire);
"

echo "PostgreSQL primary configuration completed"
EOF

  # Replace variables in the script
  sed -i "s/\${REPLICATION_USER}/$REPLICATION_USER/g" tmp_pg_primary.sh
  sed -i "s/\${NODE02}/$NODE02/g" tmp_pg_primary.sh
  sed -i "s/\${DB_NAME}/$DB_NAME/g" tmp_pg_primary.sh
  sed -i "s/\${REPLICATION_PASSWORD}/$REPLICATION_PASSWORD/g" tmp_pg_primary.sh
  
  # Run the script on the primary node
  run_remote_script "$NODE01" "tmp_pg_primary.sh"
  rm -f tmp_pg_primary.sh
}

deploy_application() {
  banner "Deploying application to $1"
  
  # Create application directory
  run_remote_sudo_command "$1" "mkdir -p $APP_DIR"
  run_remote_sudo_command "$1" "chown -R $(whoami):$(whoami) $APP_DIR"
  
  # Copy application files
  log_info "Copying application files to $1"
  rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
    -e "ssh -p $SSH_PORT" "$PROJECT_ROOT/" "$SSH_USER@$1:$APP_DIR/"
  
  # Install dependencies on remote server
  log_info "Installing dependencies on $1"
  run_remote_command "$1" "cd $APP_DIR && npm install --production"
  
  # Build the application on remote server
  log_info "Building application on $1"
  run_remote_command "$1" "cd $APP_DIR && npm run build"
  
  # Create environment file
  cat > tmp_env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# PostgreSQL Configuration (legacy support)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}

# Application Configuration
PORT=${APP_PORT}
NODE_ENV=production
SESSION_SECRET=production-secret-key-change-this

# LDAP Configuration (if needed)
LDAP_URL=ldap://localhost:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin
LDAP_SEARCH_BASE=ou=users,dc=example,dc=com
LDAP_SEARCH_FILTER=(uid={{username}})
EOF

  # Copy environment file
  scp -P "$SSH_PORT" tmp_env "$SSH_USER@$1:$APP_DIR/.env"
  rm -f tmp_env
  
  # Create PM2 ecosystem file
  cat > tmp_ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'projectpulse',
    script: 'production-server.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    error_file: '/var/log/projectpulse/error.log',
    out_file: '/var/log/projectpulse/out.log',
    log_file: '/var/log/projectpulse/combined.log',
    time: true
  }]
};
EOF

  # Copy PM2 config
  scp -P "$SSH_PORT" tmp_ecosystem.config.js "$SSH_USER@$1:$APP_DIR/ecosystem.config.js"
  rm -f tmp_ecosystem.config.js
  
  # Start application with PM2
  log_info "Starting application with PM2 on $1"
  run_remote_command "$1" "cd $APP_DIR && pm2 start ecosystem.config.js"
  run_remote_command "$1" "pm2 save"
  run_remote_command "$1" "pm2 startup"
}

configure_nginx() {
  banner "Configuring Nginx on $1"
  
  # Create Nginx configuration
  cat > tmp_nginx.conf << EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${APP_DOMAIN};
    
    # SSL Configuration
    ssl_certificate ${CERT_DEST_DIR}/mod-gov-qa.crt;
    ssl_certificate_key ${CERT_DEST_DIR}/mod-gov-qa.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /static/ {
        alias ${APP_DIR}/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

  # Copy Nginx configuration
  scp -P "$SSH_PORT" tmp_nginx.conf "$SSH_USER@$1:/tmp/projectpulse.conf"
  run_remote_sudo_command "$1" "mv /tmp/projectpulse.conf /etc/nginx/sites-available/projectpulse"
  run_remote_sudo_command "$1" "ln -sf /etc/nginx/sites-available/projectpulse /etc/nginx/sites-enabled/"
  run_remote_sudo_command "$1" "nginx -t && systemctl reload nginx"
  
  rm -f tmp_nginx.conf
}

copy_certificates() {
  banner "Copying TLS certificates to $1"
  
  if [ -f "$CERT_SRC_DIR/mod-gov-qa.crt" ] && [ -f "$CERT_SRC_DIR/mod-gov-qa.key" ]; then
    # Create destination directory
    run_remote_sudo_command "$1" "mkdir -p $CERT_DEST_DIR"
    
    # Copy certificates
    scp -P "$SSH_PORT" "$CERT_SRC_DIR/mod-gov-qa.crt" "$SSH_USER@$1:/tmp/mod-gov-qa.crt"
    scp -P "$SSH_PORT" "$CERT_SRC_DIR/mod-gov-qa.key" "$SSH_USER@$1:/tmp/mod-gov-qa.key"
    
    # Move certificates and set permissions
    run_remote_sudo_command "$1" "mv /tmp/mod-gov-qa.crt $CERT_DEST_DIR/"
    run_remote_sudo_command "$1" "mv /tmp/mod-gov-qa.key $CERT_DEST_DIR/"
    run_remote_sudo_command "$1" "chmod 600 $CERT_DEST_DIR/mod-gov-qa.crt $CERT_DEST_DIR/mod-gov-qa.key"
  else
    log_warn "Certificates not found in $CERT_SRC_DIR, skipping SSL configuration"
  fi
}

run_database_migrations() {
  banner "Running database setup"
  
  # Copy database setup script
  if [ -f "$PROJECT_ROOT/create-db-schema.js" ]; then
    scp -P "$SSH_PORT" "$PROJECT_ROOT/create-db-schema.js" "$SSH_USER@$NODE01:/tmp/"
    run_remote_command "$NODE01" "cd $APP_DIR && node /tmp/create-db-schema.js"
  fi
  
  # Create admin user if script exists
  if [ -f "$PROJECT_ROOT/create-admin.js" ]; then
    scp -P "$SSH_PORT" "$PROJECT_ROOT/create-admin.js" "$SSH_USER@$NODE01:/tmp/"
    run_remote_command "$NODE01" "cd $APP_DIR && node /tmp/create-admin.js"
  fi
}

verify_deployment() {
  banner "Verifying deployment"
  
  # Wait for services to start
  log_info "Waiting for services to start..."
  sleep 10
  
  # Check PM2 status
  log_info "Checking PM2 status on $NODE01"
  run_remote_command "$NODE01" "pm2 status"
  
  # Check application health
  log_info "Checking application health"
  if curl -k "http://$NODE01:$APP_PORT" >/dev/null 2>&1; then
    log_success "Application is responding on $NODE01"
  else
    log_warn "Application health check failed on $NODE01"
  fi
  
  # Check database connection
  log_info "Checking database connection"
  run_remote_command "$NODE01" "cd $APP_DIR && node check-database.js" || log_warn "Database check failed"
}

deploy_remote() {
  banner "Starting remote deployment process"
  
  # Check prerequisites
  for cmd in ssh scp rsync; do
    if ! command -v $cmd &> /dev/null; then
      log_error "$cmd is not installed. Please install it and try again."
      exit 1
    fi
  done
  
  # Install dependencies on primary node
  install_remote_dependencies "$NODE01"
  
  # Configure PostgreSQL
  configure_postgres_primary
  
  # Copy certificates
  copy_certificates "$NODE01"
  
  # Deploy application
  deploy_application "$NODE01"
  
  # Configure Nginx
  configure_nginx "$NODE01"
  
  # Run database setup
  run_database_migrations
  
  # Verify deployment
  verify_deployment
  
  log_success "Remote deployment completed successfully!"
  log_info "Application should be available at: http://$NODE01:$APP_PORT"
  if [ -f "$CERT_SRC_DIR/mod-gov-qa.crt" ]; then
    log_info "HTTPS should be available at: https://$APP_DOMAIN"
  fi
}

# ============================================================================ #
# MAIN FUNCTION
# ============================================================================ #

# Display usage if no arguments are provided
if [ $# -eq 0 ]; then
  banner "Project Pulse Current Architecture Deployment Script"
  echo "Usage: $0 [local|remote|render]"
  echo ""
  echo "Options:"
  echo "  local   - Deploy locally for development/testing"
  echo "  remote  - Deploy to remote servers (requires SSH access)"
  echo "  render  - Build for Render platform deployment"
  echo ""
  exit 1
fi

# Execute the appropriate deployment based on argument
case "$1" in
  local)
    deploy_local
    ;;
  remote)
    deploy_remote
    ;;
  render)
    deploy_render
    ;;
  *)
    log_error "Invalid option: $1"
    echo "Usage: $0 [local|remote|render]"
    exit 1
    ;;
esac 