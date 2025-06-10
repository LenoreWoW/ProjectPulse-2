#!/usr/bin/env bash

# ============================================================================ #
# ProjectPulse SSL Certificate Setup Script
# ============================================================================ #
# This script helps detect, install, and configure SSL certificates
# including wildcard certificates for ProjectPulse deployment
# ============================================================================ #

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DOMAIN="${1:-pm.mod.gov.qa}"
CERT_DIR="/etc/nginx/ssl"
APP_DOMAIN="$DOMAIN"

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

banner() {
  echo -e "\n${CYAN}================================${NC}"
  echo -e "${CYAN}  SSL Certificate Setup${NC}"
  echo -e "${CYAN}  Domain: $DOMAIN${NC}"
  echo -e "${CYAN}================================${NC}\n"
}

# Check if running as root
check_root() {
  if [[ $EUID -eq 0 ]]; then
    log_warn "Running as root. This is acceptable for SSL setup."
  fi
}

# Scan for existing certificates
scan_certificates() {
  banner
  log_info "Scanning for existing SSL certificates..."
  
  # Common certificate locations
  CERT_LOCATIONS=(
    "/etc/ssl/certs"
    "/etc/pki/tls/certs"
    "/usr/local/ssl/certs"
    "/opt/ssl/certs"
    "/etc/nginx/ssl"
    "/etc/apache2/ssl"
    "/etc/letsencrypt/live"
    "/etc/certificates"
    "/var/ssl"
  )
  
  FOUND_CERTS=()
  
  for location in "${CERT_LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
      log_info "Checking $location..."
      
      # Look for certificate files
      while IFS= read -r -d '' cert_file; do
        if [ -f "$cert_file" ]; then
          # Check if it's a valid certificate
          if openssl x509 -in "$cert_file" -text -noout >/dev/null 2>&1; then
            SUBJECT=$(openssl x509 -in "$cert_file" -noout -subject 2>/dev/null || echo "Unknown")
            ISSUER=$(openssl x509 -in "$cert_file" -noout -issuer 2>/dev/null || echo "Unknown")
            DATES=$(openssl x509 -in "$cert_file" -noout -dates 2>/dev/null || echo "Unknown")
            
            echo -e "  ${GREEN}Found certificate:${NC} $cert_file"
            echo -e "    Subject: $SUBJECT"
            echo -e "    Issuer: $ISSUER"
            echo -e "    $DATES"
            
            # Check if it's a wildcard certificate
            if openssl x509 -in "$cert_file" -text -noout 2>/dev/null | grep -q "DNS:\*\."; then
              echo -e "    ${GREEN}✓ Wildcard certificate detected${NC}"
              FOUND_CERTS+=("$cert_file")
            elif openssl x509 -in "$cert_file" -text -noout 2>/dev/null | grep -q "DNS:$DOMAIN"; then
              echo -e "    ${GREEN}✓ Domain match detected${NC}"
              FOUND_CERTS+=("$cert_file")
            fi
            echo ""
          fi
        fi
      done < <(find "$location" -name "*.crt" -o -name "*.pem" -o -name "*.cert" 2>/dev/null | head -20 | tr '\n' '\0')
    fi
  done
  
  if [ ${#FOUND_CERTS[@]} -eq 0 ]; then
    log_warn "No suitable certificates found"
    return 1
  else
    log_success "Found ${#FOUND_CERTS[@]} potential certificate(s)"
    return 0
  fi
}

# Look for global wildcard certificates
find_wildcard_certificates() {
  log_info "Searching for global wildcard certificates..."
  
  # Common patterns for wildcard certificates
  WILDCARD_PATTERNS=(
    "wildcard"
    "star"
    "global"
    "*."
    "multi"
  )
  
  for location in "/etc/ssl/certs" "/etc/nginx/ssl" "/opt/ssl" "/usr/local/ssl"; do
    if [ -d "$location" ]; then
      for pattern in "${WILDCARD_PATTERNS[@]}"; do
        while IFS= read -r -d '' cert_file; do
          if [ -f "$cert_file" ] && openssl x509 -in "$cert_file" -text -noout 2>/dev/null | grep -q "DNS:\*\."; then
            log_success "Found wildcard certificate: $cert_file"
            
            # Check validity dates
            if openssl x509 -in "$cert_file" -checkend 86400 >/dev/null 2>&1; then
              log_success "Certificate is valid"
              return 0
            else
              log_warn "Certificate is expired or expiring soon"
            fi
          fi
        done < <(find "$location" -iname "*${pattern}*" \( -name "*.crt" -o -name "*.pem" -o -name "*.cert" \) 2>/dev/null | tr '\n' '\0')
      done
    fi
  done
  
  return 1
}

# Generate Let's Encrypt certificate
generate_letsencrypt() {
  log_info "Attempting to generate Let's Encrypt certificate..."
  
  if ! command -v certbot >/dev/null 2>&1; then
    log_error "Certbot not found. Installing..."
    
    # Install certbot based on OS
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum >/dev/null 2>&1; then
      sudo yum install -y certbot python3-certbot-nginx
    elif command -v brew >/dev/null 2>&1; then
      brew install certbot
    else
      log_error "Unable to install certbot automatically"
      return 1
    fi
  fi
  
  log_info "Generating certificate for $DOMAIN"
  
  # Create temporary nginx config if needed
  if [ ! -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    create_temp_nginx_config
  fi
  
  # Generate certificate
  if sudo certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"; then
    log_success "Let's Encrypt certificate generated successfully"
    
    # Copy to standard location
    sudo mkdir -p "$CERT_DIR"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/$DOMAIN.crt"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/$DOMAIN.key"
    
    return 0
  else
    log_error "Failed to generate Let's Encrypt certificate"
    return 1
  fi
}

# Generate self-signed certificate
generate_self_signed() {
  log_warn "Generating self-signed certificate for development..."
  
  sudo mkdir -p "$CERT_DIR"
  
  # Create configuration file for certificate
  cat > /tmp/ssl.conf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=QA
ST=Doha
L=Doha
O=Ministry of Development Planning and Statistics
OU=IT Department
CN=*.$DOMAIN
emailAddress=admin@$DOMAIN

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = *.$DOMAIN
DNS.3 = www.$DOMAIN
EOF

  # Generate private key and certificate
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/$DOMAIN.key" \
    -out "$CERT_DIR/$DOMAIN.crt" \
    -config /tmp/ssl.conf \
    -extensions v3_req
  
  # Clean up
  rm -f /tmp/ssl.conf
  
  # Set permissions
  sudo chmod 644 "$CERT_DIR/$DOMAIN.crt"
  sudo chmod 600 "$CERT_DIR/$DOMAIN.key"
  
  log_success "Self-signed certificate generated"
  log_warn "Self-signed certificates are not suitable for production use"
  
  return 0
}

# Create temporary nginx config
create_temp_nginx_config() {
  log_info "Creating temporary nginx configuration..."
  
  cat > /tmp/temp_nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 200 'Temporary configuration for SSL setup';
        add_header Content-Type text/plain;
    }
}
EOF

  sudo mkdir -p /var/www/html
  sudo cp /tmp/temp_nginx.conf "/etc/nginx/sites-available/temp-$DOMAIN"
  sudo ln -sf "/etc/nginx/sites-available/temp-$DOMAIN" "/etc/nginx/sites-enabled/"
  
  # Test and reload nginx
  if sudo nginx -t; then
    sudo systemctl reload nginx
    log_success "Temporary nginx configuration created"
  else
    log_error "Nginx configuration test failed"
    return 1
  fi
  
  rm -f /tmp/temp_nginx.conf
}

# Install certificate
install_certificate() {
  local cert_file="$1"
  local key_file="$2"
  
  log_info "Installing certificate..."
  
  if [ ! -f "$cert_file" ]; then
    log_error "Certificate file not found: $cert_file"
    return 1
  fi
  
  if [ ! -f "$key_file" ]; then
    log_error "Key file not found: $key_file"
    return 1
  fi
  
  # Create certificate directory
  sudo mkdir -p "$CERT_DIR"
  
  # Copy certificate and key
  sudo cp "$cert_file" "$CERT_DIR/$DOMAIN.crt"
  sudo cp "$key_file" "$CERT_DIR/$DOMAIN.key"
  
  # Set permissions
  sudo chmod 644 "$CERT_DIR/$DOMAIN.crt"
  sudo chmod 600 "$CERT_DIR/$DOMAIN.key"
  
  # Verify certificate
  if openssl verify "$CERT_DIR/$DOMAIN.crt" >/dev/null 2>&1; then
    log_success "Certificate installed and verified"
  else
    log_warn "Certificate installed but verification failed (may be self-signed)"
  fi
  
  return 0
}

# Verify certificate installation
verify_certificate() {
  log_info "Verifying certificate installation..."
  
  if [ ! -f "$CERT_DIR/$DOMAIN.crt" ] || [ ! -f "$CERT_DIR/$DOMAIN.key" ]; then
    log_error "Certificate files not found in $CERT_DIR"
    return 1
  fi
  
  # Check certificate details
  log_info "Certificate details:"
  openssl x509 -in "$CERT_DIR/$DOMAIN.crt" -noout -subject -dates -issuer
  
  # Check if certificate matches key
  cert_modulus=$(openssl x509 -noout -modulus -in "$CERT_DIR/$DOMAIN.crt" 2>/dev/null | openssl md5)
  key_modulus=$(openssl rsa -noout -modulus -in "$CERT_DIR/$DOMAIN.key" 2>/dev/null | openssl md5)
  
  if [ "$cert_modulus" = "$key_modulus" ]; then
    log_success "Certificate and key match"
  else
    log_error "Certificate and key do not match"
    return 1
  fi
  
  # Check expiration
  if openssl x509 -in "$CERT_DIR/$DOMAIN.crt" -checkend 86400 >/dev/null 2>&1; then
    log_success "Certificate is valid"
  else
    log_warn "Certificate is expired or expiring within 24 hours"
  fi
  
  return 0
}

# Main execution
main() {
  check_root
  
  log_info "SSL Certificate Setup for $DOMAIN"
  
  # Check if certificates already exist
  if [ -f "$CERT_DIR/$DOMAIN.crt" ] && [ -f "$CERT_DIR/$DOMAIN.key" ]; then
    log_info "Certificates already exist for $DOMAIN"
    if verify_certificate; then
      log_success "Existing certificates are valid"
      exit 0
    else
      log_warn "Existing certificates have issues, proceeding with setup..."
    fi
  fi
  
  # Try to find existing certificates
  if scan_certificates; then
    log_info "Found existing certificates. Would you like to use one? (y/n)"
    # In automated mode, we'll proceed with automatic detection
    if find_wildcard_certificates; then
      log_success "Using detected wildcard certificate"
      exit 0
    fi
  fi
  
  # Try Let's Encrypt
  log_info "Attempting Let's Encrypt certificate generation..."
  if generate_letsencrypt; then
    verify_certificate
    exit 0
  fi
  
  # Fallback to self-signed
  log_warn "Falling back to self-signed certificate..."
  if generate_self_signed; then
    verify_certificate
    exit 0
  fi
  
  log_error "Failed to set up SSL certificate"
  exit 1
}

# Command line options
case "${1:-auto}" in
  "auto")
    main
    ;;
  "scan")
    scan_certificates
    ;;
  "letsencrypt")
    generate_letsencrypt
    verify_certificate
    ;;
  "self-signed")
    generate_self_signed
    verify_certificate
    ;;
  "verify")
    verify_certificate
    ;;
  "help"|"-h"|"--help")
    echo "SSL Certificate Setup Script"
    echo ""
    echo "Usage: $0 [COMMAND] [DOMAIN]"
    echo ""
    echo "Commands:"
    echo "  auto        Automatically detect and configure SSL (default)"
    echo "  scan        Scan for existing certificates"
    echo "  letsencrypt Generate Let's Encrypt certificate"
    echo "  self-signed Generate self-signed certificate"
    echo "  verify      Verify existing certificate"
    echo "  help        Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 auto pm.mod.gov.qa"
    echo "  $0 scan"
    echo "  $0 letsencrypt myapp.example.com"
    ;;
  *)
    DOMAIN="$1"
    main
    ;;
esac 