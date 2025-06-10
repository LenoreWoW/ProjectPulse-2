#!/usr/bin/env bash

# ============================================================================ #
# ProjectPulse V1 One-Shot Deployment Script
# ============================================================================ #
# This script provides a complete one-shot deployment for ProjectPulse V1
# including database setup, schema creation, CSV data import, SSL configuration,
# and application startup.
# ============================================================================ #

# Strict error handling
set -euo pipefail

# ============================================================================ #
# CONFIGURATION VARIABLES
# ============================================================================ #

# Version information
VERSION="1.0.0"
DEPLOY_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Server configuration
NODE01="${NODE01:-172.28.17.95}"           # Primary node
NODE02="${NODE02:-172.28.17.96}"           # Secondary node
SSH_USER="${SSH_USER:-admin}"              # SSH user with sudo privileges
SSH_PORT="${SSH_PORT:-22}"                 # SSH port

# Application configuration
APP_NAME="projectpulse"
APP_DOMAIN="${APP_DOMAIN:-pm.mod.gov.qa}"  # Application domain
APP_PORT="7000"                            # Application port (matches production-server.js)
DB_NAME="projectpulse"                     # Database name
DB_USER="${DB_USER:-postgres}"             # Database user
DB_PASSWORD="${DB_PASSWORD:-postgres}"     # Database password
DB_HOST="${DB_HOST:-localhost}"            # Database host
DB_PORT="${DB_PORT:-5432}"                 # Database port

# SSL Configuration
SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/ssl/certs}"
SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/ssl/private}"
SSL_ENABLED="${SSL_ENABLED:-true}"

# Paths and directories
APP_DIR="/opt/projectpulse"                # Application directory
CERT_DIR="/etc/nginx/ssl"                  # SSL certificates directory
LOG_DIR="/var/log/projectpulse"            # Log directory
BACKUP_DIR="/opt/backups/projectpulse"     # Backup directory

# Admin configuration
ADMIN_USER="${ADMIN_USER:-admin}"          # Admin username
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123!}" # Admin password
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${APP_DOMAIN}}" # Admin email

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_debug() {
  echo -e "${PURPLE}[DEBUG]${NC} $1"
}

banner() {
  echo -e "\n${CYAN}=====================================================${NC}"
  echo -e "${CYAN}= $1${NC}"
  echo -e "${CYAN}=====================================================${NC}\n"
}

# Clean up on exit or error
cleanup() {
  log_info "Cleaning up temporary files"
  rm -f tmp_*.sql tmp_*.sh tmp_*.service tmp_*.yml tmp_*.conf 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# Check if running as root
check_root() {
  if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root for security reasons"
    exit 1
  fi
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Retry function for network operations
retry() {
  local retries=$1
  shift
  local count=0
  until "$@"; do
    exit=$?
    wait=$((2 ** count))
    count=$((count + 1))
    if [ $count -lt $retries ]; then
      log_warn "Command failed. Attempt $count/$retries:"
      sleep $wait
    else
      log_error "Command failed after $count attempts."
      return $exit
    fi
  done
  return 0
}

# ============================================================================ #
# SYSTEM PREPARATION FUNCTIONS
# ============================================================================ #

check_system_requirements() {
  banner "Checking System Requirements"
  
  log_info "Checking operating system..."
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    log_success "Linux detected"
    DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    VERSION_ID=$(lsb_release -sr 2>/dev/null || echo "Unknown")
    log_info "Distribution: $DISTRO $VERSION_ID"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    log_success "macOS detected"
    DISTRO="macOS"
  else
    log_error "Unsupported operating system: $OSTYPE"
    exit 1
  fi
  
  log_info "Checking available disk space..."
  AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
  if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    log_error "Insufficient disk space. At least 5GB required, only ${AVAILABLE_SPACE}GB available"
    exit 1
  else
    log_success "Sufficient disk space available: ${AVAILABLE_SPACE}GB"
  fi
  
  log_info "Checking memory..."
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
  else
    MEMORY_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
  fi
  
  if [ "$MEMORY_GB" -lt 2 ]; then
    log_warn "Low memory detected: ${MEMORY_GB}GB. Recommended: 4GB+"
  else
    log_success "Memory check passed: ${MEMORY_GB}GB"
  fi
}

install_system_dependencies() {
  banner "Installing System Dependencies"
  
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    log_info "Updating package lists..."
    sudo apt-get update
    
    log_info "Installing system dependencies..."
    sudo apt-get install -y \
      curl \
      wget \
      gnupg \
      lsb-release \
      software-properties-common \
      apt-transport-https \
      ca-certificates \
      nginx \
      postgresql \
      postgresql-contrib \
      postgresql-client \
      build-essential \
      git \
      unzip \
      htop \
      jq \
      tree \
      certbot \
      python3-certbot-nginx
      
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command_exists brew; then
      log_info "Installing Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    log_info "Installing dependencies via Homebrew..."
    brew update
    brew install postgresql nginx node jq tree
    brew services start postgresql
  fi
  
  log_success "System dependencies installed"
}

install_node() {
  banner "Installing Node.js"
  
  if command_exists node; then
    NODE_VERSION=$(node -v)
    log_info "Node.js already installed: $NODE_VERSION"
    
    # Check if version is acceptable (v18+)
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 18 ]; then
      log_warn "Node.js version $NODE_VERSION is outdated. Upgrading..."
    else
      log_success "Node.js version is acceptable"
      return 0
    fi
  fi
  
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    log_info "Installing Node.js via NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    log_info "Installing Node.js via Homebrew..."
    brew install node
  fi
  
  # Verify installation
  if command_exists node && command_exists npm; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    log_success "Node.js installed successfully: $NODE_VERSION"
    log_success "npm installed successfully: $NPM_VERSION"
  else
    log_error "Failed to install Node.js"
    exit 1
  fi
}

# ============================================================================ #
# DATABASE SETUP FUNCTIONS
# ============================================================================ #

setup_postgresql() {
  banner "Setting up PostgreSQL"
  
  log_info "Checking PostgreSQL installation..."
  if ! command_exists psql; then
    log_error "PostgreSQL not found. Please install it first."
    exit 1
  fi
  
  # Check if PostgreSQL is running
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! sudo systemctl is-active --quiet postgresql; then
      log_info "Starting PostgreSQL service..."
      sudo systemctl start postgresql
      sudo systemctl enable postgresql
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    if ! brew services list | grep postgresql | grep started > /dev/null; then
      log_info "Starting PostgreSQL service..."
      brew services start postgresql
    fi
  fi
  
  log_success "PostgreSQL is running"
  
  # Create database and user if they don't exist
  log_info "Setting up database and user..."
  
  # Create database
  if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log_info "Creating database: $DB_NAME"
    sudo -u postgres createdb "$DB_NAME"
  else
    log_info "Database $DB_NAME already exists"
  fi
  
  # Create user and grant privileges
  sudo -u postgres psql << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

  log_success "Database setup completed"
}

create_database_schema() {
  banner "Creating Database Schema"
  
  log_info "Running schema creation script..."
  cd "$PROJECT_ROOT"
  
  # Set environment variables for database connection
  export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
  export DB_HOST="$DB_HOST"
  export DB_PORT="$DB_PORT"
  export DB_NAME="$DB_NAME"
  export DB_USER="$DB_USER"
  export DB_PASSWORD="$DB_PASSWORD"
  
  # Run schema creation
  if [ -f "create-db-schema.js" ]; then
    log_info "Running create-db-schema.js..."
    node create-db-schema.js
  else
    log_error "Schema creation script not found: create-db-schema.js"
    exit 1
  fi
  
  log_success "Database schema created successfully"
}

import_csv_data() {
  banner "Importing CSV Data"
  
  cd "$PROJECT_ROOT"
  
  # Set environment variables
  export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
  
  # Import Projects.csv
  if [ -f "Projects.csv" ]; then
    log_info "Importing Projects.csv..."
    if [ -f "import-projects.js" ]; then
      node import-projects.js Projects.csv
      log_success "Projects imported successfully"
    else
      log_error "Project import script not found: import-projects.js"
    fi
  else
    log_warn "Projects.csv not found, skipping project import"
  fi
  
  # Import Milestones.csv
  if [ -f "Milestones.csv" ]; then
    log_info "Importing Milestones.csv..."
    if [ -f "import-milestones.js" ]; then
      node import-milestones.js Milestones.csv
      log_success "Milestones imported successfully"
    else
      log_error "Milestone import script not found: import-milestones.js"
    fi
  else
    log_warn "Milestones.csv not found, skipping milestone import"
  fi
  
  log_success "CSV data import completed"
}

create_admin_user() {
  banner "Creating Admin User"
  
  cd "$PROJECT_ROOT"
  
  # Set environment variables
  export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
  
  if [ -f "create-admin.js" ]; then
    log_info "Creating admin user: $ADMIN_USER"
    node create-admin.js
    log_success "Admin user created successfully"
  else
    log_warn "Admin creation script not found: create-admin.js"
  fi
}

# ============================================================================ #
# SSL CERTIFICATE FUNCTIONS
# ============================================================================ #

setup_ssl_certificates() {
  banner "Setting up SSL Certificates"
  
  if [ "$SSL_ENABLED" != "true" ]; then
    log_info "SSL disabled, skipping certificate setup"
    return 0
  fi
  
  log_info "Creating SSL certificate directories..."
  sudo mkdir -p "$CERT_DIR"
  sudo chown -R www-data:www-data "$CERT_DIR" 2>/dev/null || sudo chown -R nginx:nginx "$CERT_DIR" 2>/dev/null || true
  
  # Check for existing certificates
  if [ -f "$CERT_DIR/${APP_DOMAIN}.crt" ] && [ -f "$CERT_DIR/${APP_DOMAIN}.key" ]; then
    log_success "SSL certificates already exist for $APP_DOMAIN"
    return 0
  fi
  
  # Look for global wildcard certificates
  log_info "Checking for global wildcard certificates..."
  
  # Common locations for global certificates
  GLOBAL_CERT_LOCATIONS=(
    "/etc/ssl/certs/wildcard.crt"
    "/etc/ssl/certs/*.crt"
    "/opt/ssl/wildcard.crt"
    "/usr/local/ssl/wildcard.crt"
    "/etc/nginx/ssl/wildcard.crt"
  )
  
  CERT_FOUND=false
  for cert_path in "${GLOBAL_CERT_LOCATIONS[@]}"; do
    if [ -f "$cert_path" ]; then
      log_info "Found certificate at: $cert_path"
      # Check if it's a wildcard certificate
      if openssl x509 -in "$cert_path" -text -noout | grep -q "DNS:\*\."; then
        log_success "Wildcard certificate found: $cert_path"
        
        # Copy to our certificate directory
        sudo cp "$cert_path" "$CERT_DIR/${APP_DOMAIN}.crt"
        
        # Find corresponding key
        key_path="${cert_path%.*}.key"
        if [ -f "$key_path" ]; then
          sudo cp "$key_path" "$CERT_DIR/${APP_DOMAIN}.key"
          CERT_FOUND=true
          break
        fi
      fi
    fi
  done
  
  if [ "$CERT_FOUND" = false ]; then
    log_warn "No global wildcard certificates found"
    
    # Try Let's Encrypt
    if command_exists certbot; then
      log_info "Attempting to generate Let's Encrypt certificate..."
      
      # Create temporary nginx config for domain verification
      create_temp_nginx_config
      
      # Generate certificate
      if sudo certbot certonly --nginx -d "$APP_DOMAIN" -d "www.$APP_DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL"; then
        log_success "Let's Encrypt certificate generated"
        
        # Copy certificates to our directory
        sudo cp "/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" "$CERT_DIR/${APP_DOMAIN}.crt"
        sudo cp "/etc/letsencrypt/live/$APP_DOMAIN/privkey.pem" "$CERT_DIR/${APP_DOMAIN}.key"
        CERT_FOUND=true
      else
        log_warn "Let's Encrypt certificate generation failed"
      fi
    fi
  fi
  
  if [ "$CERT_FOUND" = false ]; then
    log_warn "No SSL certificates found. Generating self-signed certificate for development..."
    generate_self_signed_certificate
  fi
  
  # Set proper permissions
  sudo chmod 644 "$CERT_DIR/${APP_DOMAIN}.crt"
  sudo chmod 600 "$CERT_DIR/${APP_DOMAIN}.key"
  
  log_success "SSL certificate setup completed"
}

generate_self_signed_certificate() {
  log_info "Generating self-signed certificate..."
  
  # Create self-signed certificate
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/${APP_DOMAIN}.key" \
    -out "$CERT_DIR/${APP_DOMAIN}.crt" \
    -subj "/C=QA/ST=Doha/L=Doha/O=MOD/OU=IT/CN=*.${APP_DOMAIN}/emailAddress=${ADMIN_EMAIL}"
  
  log_warn "Self-signed certificate generated. Not suitable for production!"
}

create_temp_nginx_config() {
  log_info "Creating temporary nginx configuration..."
  
  cat > tmp_nginx_temp.conf << EOF
server {
    listen 80;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    location / {
        return 200 'Temporary config for certificate generation';
        add_header Content-Type text/plain;
    }
}
EOF

  sudo cp tmp_nginx_temp.conf /etc/nginx/sites-available/temp-$APP_DOMAIN
  sudo ln -sf /etc/nginx/sites-available/temp-$APP_DOMAIN /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
}

# ============================================================================ #
# NGINX CONFIGURATION FUNCTIONS
# ============================================================================ #

configure_nginx() {
  banner "Configuring Nginx"
  
  log_info "Creating nginx configuration for $APP_DOMAIN..."
  
  # Remove temporary config if it exists
  sudo rm -f /etc/nginx/sites-enabled/temp-$APP_DOMAIN
  
  cat > tmp_nginx.conf << EOF
# ProjectPulse Nginx Configuration
# Generated on $(date)

upstream projectpulse_backend {
    server 127.0.0.1:$APP_PORT fail_timeout=5s max_fails=3;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=projectpulse_limit:10m rate=10r/s;

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    # SSL Configuration
    ssl_certificate $CERT_DIR/${APP_DOMAIN}.crt;
    ssl_certificate_key $CERT_DIR/${APP_DOMAIN}.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req zone=projectpulse_limit burst=20 nodelay;
    
    # Static files (uploads, assets)
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security for upload directory
        location ~* \.(php|php5|phtml|pl|py|jsp|asp|sh|cgi)\$ {
            deny all;
        }
    }
    
    location /assets/ {
        alias $APP_DIR/dist/public/assets/;
        # Cache assets for shorter time to prevent outdated UI issues
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
        # Add cache-busting for development
        add_header Last-Modified \$date_gmt;
        add_header ETag "\"$app_version-\$date_gmt\"";
        if_modified_since off;
    }
    
    # Specific no-cache for HTML files
    location ~* \.html\$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files \$uri \$uri/ @proxy;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://projectpulse_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Main application
    location / {
        try_files \$uri \$uri/ @proxy;
    }
    
    location @proxy {
        proxy_pass http://projectpulse_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://projectpulse_backend/health;
        proxy_set_header Host \$host;
    }
    
    # Deny access to sensitive files
    location ~ /\.(ht|git|env) {
        deny all;
    }
    
    location ~ \.(sql|log|conf)\$ {
        deny all;
    }
}
EOF

  # Install the configuration
  sudo cp tmp_nginx.conf "/etc/nginx/sites-available/$APP_NAME"
  sudo ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
  
  # Remove default nginx site if it exists
  sudo rm -f /etc/nginx/sites-enabled/default
  
  # Test nginx configuration
  if sudo nginx -t; then
    log_success "Nginx configuration is valid"
    sudo systemctl reload nginx
    log_success "Nginx reloaded successfully"
  else
    log_error "Nginx configuration test failed"
    exit 1
  fi
}

# ============================================================================ #
# APPLICATION SETUP FUNCTIONS
# ============================================================================ #

setup_application_directories() {
  banner "Setting up Application Directories"
  
  log_info "Creating application directories..."
  sudo mkdir -p "$APP_DIR"
  sudo mkdir -p "$LOG_DIR"
  sudo mkdir -p "$BACKUP_DIR"
  sudo mkdir -p "$APP_DIR/uploads"
  
  # Set ownership
  sudo chown -R $USER:$USER "$APP_DIR" 2>/dev/null || true
  sudo chown -R www-data:www-data "$LOG_DIR" 2>/dev/null || true
  
  log_success "Application directories created"
}

deploy_application() {
  banner "Deploying Application"
  
  log_info "Copying application files to $APP_DIR..."
  
  # Copy application files
  sudo cp -r "$PROJECT_ROOT"/* "$APP_DIR/" 2>/dev/null || {
    log_info "Fallback: using rsync for file copy..."
    sudo rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' "$PROJECT_ROOT/" "$APP_DIR/"
  }
  
  # Set proper ownership
  sudo chown -R $USER:$USER "$APP_DIR"
  
  cd "$APP_DIR"
  
  log_info "Installing npm dependencies..."
  npm install --production
  
  log_info "Building application..."
  # Clear build cache to ensure fresh build
  rm -rf dist/ 2>/dev/null || true
  rm -rf node_modules/.vite 2>/dev/null || true
  npm run build
  
  # Create uploads directory with proper permissions
  sudo mkdir -p "$APP_DIR/uploads"
  sudo chown -R www-data:www-data "$APP_DIR/uploads" 2>/dev/null || sudo chown -R $USER:$USER "$APP_DIR/uploads"
  sudo chmod 755 "$APP_DIR/uploads"
  
  log_success "Application deployed successfully"
}

create_systemd_service() {
  banner "Creating Systemd Service"
  
  log_info "Creating systemd service file..."
  
  cat > tmp_service.service << EOF
[Unit]
Description=ProjectPulse Application
Documentation=https://github.com/your-org/projectpulse
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
Environment=DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
Environment=DB_HOST=$DB_HOST
Environment=DB_PORT=$DB_PORT
Environment=DB_NAME=$DB_NAME
Environment=DB_USER=$DB_USER
Environment=DB_PASSWORD=$DB_PASSWORD
Environment=SSL_ENABLED=$SSL_ENABLED
ExecStart=/usr/bin/node production-server.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=projectpulse

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR $LOG_DIR

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

  sudo cp tmp_service.service "/etc/systemd/system/$APP_NAME.service"
  sudo systemctl daemon-reload
  sudo systemctl enable "$APP_NAME.service"
  
  log_success "Systemd service created and enabled"
}

# ============================================================================ #
# MONITORING AND LOGGING FUNCTIONS
# ============================================================================ #

setup_logging() {
  banner "Setting up Logging"
  
  log_info "Configuring log rotation..."
  
  cat > tmp_logrotate << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload $APP_NAME || true
    endscript
}
EOF

  sudo cp tmp_logrotate "/etc/logrotate.d/$APP_NAME"
  
  log_success "Log rotation configured"
}

create_backup_script() {
  banner "Creating Backup Script"
  
  cat > tmp_backup.sh << 'EOF'
#!/bin/bash
# ProjectPulse Backup Script

BACKUP_DIR="/opt/backups/projectpulse"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
APP_BACKUP_FILE="$BACKUP_DIR/app_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Creating database backup..."
sudo -u postgres pg_dump projectpulse > "$DB_BACKUP_FILE"
gzip "$DB_BACKUP_FILE"

# Application backup (excluding node_modules and uploads)
echo "Creating application backup..."
tar -czf "$APP_BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='uploads' \
    --exclude='.git' \
    --exclude='dist' \
    -C /opt projectpulse

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

  sudo cp tmp_backup.sh "/usr/local/bin/projectpulse-backup"
  sudo chmod +x "/usr/local/bin/projectpulse-backup"
  
  # Create daily backup cron job
  echo "0 2 * * * /usr/local/bin/projectpulse-backup" | sudo tee /etc/cron.d/projectpulse-backup
  
  log_success "Backup script and cron job created"
}

# ============================================================================ #
# HEALTH CHECK AND VALIDATION FUNCTIONS
# ============================================================================ #

validate_deployment() {
  banner "Validating Deployment"
  
  log_info "Starting health checks..."
  
  # Check if service is running
  if sudo systemctl is-active --quiet "$APP_NAME.service"; then
    log_success "ProjectPulse service is running"
  else
    log_error "ProjectPulse service is not running"
    sudo systemctl status "$APP_NAME.service" --no-pager
    return 1
  fi
  
  # Check if nginx is running
  if sudo systemctl is-active --quiet nginx; then
    log_success "Nginx is running"
  else
    log_error "Nginx is not running"
    return 1
  fi
  
  # Check if PostgreSQL is running
  if sudo systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL is running"
  else
    log_error "PostgreSQL is not running"
    return 1
  fi
  
  # Test database connection
  log_info "Testing database connection..."
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Database connection successful"
  else
    log_error "Database connection failed"
    return 1
  fi
  
  # Test application endpoint
  log_info "Testing application endpoint..."
  sleep 5  # Give the service a moment to start
  
  if curl -f -s "http://localhost:$APP_PORT/health" >/dev/null; then
    log_success "Application health check passed"
  else
    log_warn "Application health check failed, checking if app is starting..."
    sleep 10
    if curl -f -s "http://localhost:$APP_PORT/health" >/dev/null; then
      log_success "Application health check passed (after delay)"
    else
      log_error "Application health check failed"
      return 1
    fi
  fi
  
  # Test HTTPS if enabled
  if [ "$SSL_ENABLED" = "true" ]; then
    log_info "Testing HTTPS endpoint..."
    if curl -k -f -s "https://localhost/health" >/dev/null; then
      log_success "HTTPS endpoint test passed"
    else
      log_warn "HTTPS endpoint test failed (may be normal for self-signed certificates)"
    fi
  fi
  
  log_success "All health checks passed!"
  return 0
}

show_deployment_summary() {
  banner "Deployment Summary"
  
  echo -e "${GREEN}ProjectPulse V$VERSION deployed successfully!${NC}\n"
  
  echo -e "${BLUE}Application Details:${NC}"
  echo -e "  • Application: ProjectPulse V$VERSION"
  echo -e "  • Domain: $APP_DOMAIN"
  echo -e "  • Port: $APP_PORT"
  echo -e "  • Directory: $APP_DIR"
  echo -e "  • Logs: $LOG_DIR"
  
  echo -e "\n${BLUE}Database Details:${NC}"
  echo -e "  • Database: $DB_NAME"
  echo -e "  • User: $DB_USER"
  echo -e "  • Host: $DB_HOST:$DB_PORT"
  
  echo -e "\n${BLUE}Admin Access:${NC}"
  echo -e "  • Username: $ADMIN_USER"
  echo -e "  • Email: $ADMIN_EMAIL"
  
  echo -e "\n${BLUE}Access URLs:${NC}"
  echo -e "  • HTTP: http://$APP_DOMAIN"
  if [ "$SSL_ENABLED" = "true" ]; then
    echo -e "  • HTTPS: https://$APP_DOMAIN"
  fi
  echo -e "  • Local: http://localhost:$APP_PORT"
  
  echo -e "\n${BLUE}Service Management:${NC}"
  echo -e "  • Start: sudo systemctl start $APP_NAME"
  echo -e "  • Stop: sudo systemctl stop $APP_NAME"
  echo -e "  • Restart: sudo systemctl restart $APP_NAME"
  echo -e "  • Status: sudo systemctl status $APP_NAME"
  echo -e "  • Logs: sudo journalctl -u $APP_NAME -f"
  
  echo -e "\n${BLUE}Useful Commands:${NC}"
  echo -e "  • Backup: sudo /usr/local/bin/projectpulse-backup"
  echo -e "  • Nginx test: sudo nginx -t"
  echo -e "  • Nginx reload: sudo systemctl reload nginx"
  
  if [ "$SSL_ENABLED" = "true" ]; then
    echo -e "\n${YELLOW}SSL Certificate:${NC}"
    echo -e "  • Certificate: $CERT_DIR/${APP_DOMAIN}.crt"
    echo -e "  • Private Key: $CERT_DIR/${APP_DOMAIN}.key"
    
    # Show certificate info if available
    if [ -f "$CERT_DIR/${APP_DOMAIN}.crt" ]; then
      echo -e "  • Certificate Info:"
      openssl x509 -in "$CERT_DIR/${APP_DOMAIN}.crt" -noout -subject -dates 2>/dev/null | sed 's/^/    /'
    fi
  fi
  
  echo -e "\n${GREEN}Deployment completed at: $(date)${NC}"
  echo -e "${GREEN}Deployment took: $((SECONDS / 60)) minutes and $((SECONDS % 60)) seconds${NC}\n"
}

# ============================================================================ #
# MAIN DEPLOYMENT FUNCTIONS
# ============================================================================ #

deploy_local() {
  banner "Starting Local Deployment"
  
  check_root
  check_system_requirements
  install_system_dependencies
  install_node
  setup_application_directories
  
  # Database setup
  setup_postgresql
  create_database_schema
  import_csv_data
  create_admin_user
  
  # Application deployment
  deploy_application
  
  # SSL and Nginx setup
  setup_ssl_certificates
  configure_nginx
  
  # System services
  create_systemd_service
  setup_logging
  create_backup_script
  
  # Start services
  log_info "Starting ProjectPulse service..."
  sudo systemctl start "$APP_NAME.service"
  
  # Validate deployment
  if validate_deployment; then
    show_deployment_summary
    log_success "Local deployment completed successfully!"
  else
    log_error "Deployment validation failed"
    exit 1
  fi
}

deploy_remote() {
  banner "Starting Remote Deployment"
  
  log_error "Remote deployment not implemented in this version"
  log_info "Please use the local deployment and then sync to remote servers"
  exit 1
}

show_usage() {
  echo "ProjectPulse V1 One-Shot Deployment Script"
  echo
  echo "Usage: $0 [COMMAND] [OPTIONS]"
  echo
  echo "Commands:"
  echo "  local     Deploy locally"
  echo "  remote    Deploy to remote servers"
  echo "  validate  Validate existing deployment"
  echo "  backup    Create backup"
  echo "  help      Show this help message"
  echo
  echo "Options:"
  echo "  --domain DOMAIN        Set application domain (default: pm.mod.gov.qa)"
  echo "  --ssl-enabled BOOL     Enable SSL (default: true)"
  echo "  --db-password PASS     Set database password"
  echo "  --admin-password PASS  Set admin password"
  echo
  echo "Environment Variables:"
  echo "  APP_DOMAIN            Application domain"
  echo "  DB_PASSWORD           Database password"
  echo "  ADMIN_PASSWORD        Admin password"
  echo "  SSL_ENABLED           Enable SSL (true/false)"
  echo
  echo "Examples:"
  echo "  $0 local"
  echo "  $0 local --domain myapp.example.com"
  echo "  $0 validate"
}

# ============================================================================ #
# COMMAND LINE ARGUMENT PARSING
# ============================================================================ #

COMMAND=""

while [[ $# -gt 0 ]]; do
  case $1 in
    local|remote|validate|backup|help)
      COMMAND="$1"
      shift
      ;;
    --domain)
      APP_DOMAIN="$2"
      shift 2
      ;;
    --ssl-enabled)
      SSL_ENABLED="$2"
      shift 2
      ;;
    --db-password)
      DB_PASSWORD="$2"
      shift 2
      ;;
    --admin-password)
      ADMIN_PASSWORD="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# ============================================================================ #
# MAIN EXECUTION
# ============================================================================ #

# Show banner
echo -e "${CYAN}"
echo "  ____            _           _   ____        _            "
echo " |  _ \ _ __ ___ (_) ___  ___| |_|  _ \ _   _| |___  ___   "
echo " | |_) | '__/ _ \| |/ _ \/ __| __| |_) | | | | / __|/ _ \  "
echo " |  __/| | | (_) | |  __/ (__| |_|  __/| |_| | \__ \  __/  "
echo " |_|   |_|  \___// |\___|\___|\__|_|    \__,_|_|___/\___|  "
echo "                |__/                                       "
echo "                                                           "
echo "              Version $VERSION Deployment Script"
echo -e "${NC}\n"

# Execute command
case "$COMMAND" in
  "local")
    deploy_local
    ;;
  "remote")
    deploy_remote
    ;;
  "validate")
    validate_deployment
    ;;
  "backup")
    /usr/local/bin/projectpulse-backup 2>/dev/null || {
      log_error "Backup script not found. Run deployment first."
      exit 1
    }
    ;;
  "help"|"")
    show_usage
    exit 0
    ;;
  *)
    log_error "Unknown command: $COMMAND"
    show_usage
    exit 1
    ;;
esac

exit 0 