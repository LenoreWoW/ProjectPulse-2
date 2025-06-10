#!/usr/bin/env bash

# ============================================================================ #
# ProjectPulse Health Check Script
# ============================================================================ #
# This script performs comprehensive health checks on the deployed ProjectPulse
# application including services, database, SSL, and application endpoints.
# ============================================================================ #

set -euo pipefail

# Configuration
APP_NAME="projectpulse"
APP_PORT="7000"
APP_DOMAIN="${APP_DOMAIN:-pm.mod.gov.qa}"
DB_NAME="projectpulse"
CERT_DIR="/etc/nginx/ssl"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; ((PASSED_CHECKS++)); }
log_fail() { echo -e "${RED}[✗]${NC} $1"; ((FAILED_CHECKS++)); }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $1"; ((WARNING_CHECKS++)); }
log_check() { echo -e "${PURPLE}[CHECK]${NC} $1"; ((TOTAL_CHECKS++)); }

banner() {
  echo -e "\n${CYAN}==========================================${NC}"
  echo -e "${CYAN}  ProjectPulse Health Check${NC}"
  echo -e "${CYAN}  $(date)${NC}"
  echo -e "${CYAN}==========================================${NC}\n"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check service status
check_service() {
  local service_name="$1"
  log_check "Checking $service_name service status"
  
  if systemctl is-active --quiet "$service_name"; then
    local status=$(systemctl show -p ActiveState --value "$service_name")
    local uptime=$(systemctl show -p ActiveEnterTimestamp --value "$service_name")
    log_success "$service_name is active ($status) - Started: $uptime"
    return 0
  else
    local status=$(systemctl show -p ActiveState --value "$service_name")
    log_fail "$service_name is not active (Status: $status)"
    return 1
  fi
}

# Check port availability
check_port() {
  local port="$1"
  local service_name="$2"
  log_check "Checking if port $port is listening ($service_name)"
  
  if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
    local process=$(lsof -ti:$port 2>/dev/null | head -1)
    if [ -n "$process" ]; then
      local process_name=$(ps -p $process -o comm= 2>/dev/null || echo "unknown")
      log_success "Port $port is listening (Process: $process_name, PID: $process)"
    else
      log_success "Port $port is listening"
    fi
    return 0
  else
    log_fail "Port $port is not listening"
    return 1
  fi
}

# Check database connectivity
check_database() {
  log_check "Checking PostgreSQL database connectivity"
  
  # Check if PostgreSQL service is running
  if ! systemctl is-active --quiet postgresql; then
    log_fail "PostgreSQL service is not running"
    return 1
  fi
  
  # Check database connection
  if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Database connection successful"
    
    # Check table count
    local table_count=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    if [ "$table_count" -gt 0 ]; then
      log_success "Database has $table_count tables"
    else
      log_warn "Database appears to be empty (0 tables)"
    fi
    
    return 0
  else
    log_fail "Cannot connect to database '$DB_NAME'"
    return 1
  fi
}

# Check SSL certificates
check_ssl() {
  log_check "Checking SSL certificate configuration"
  
  local cert_file="$CERT_DIR/$APP_DOMAIN.crt"
  local key_file="$CERT_DIR/$APP_DOMAIN.key"
  
  if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
    log_success "SSL certificate files found"
    
    # Check certificate validity
    if openssl x509 -in "$cert_file" -checkend 86400 >/dev/null 2>&1; then
      local expiry=$(openssl x509 -in "$cert_file" -noout -dates | grep notAfter | cut -d= -f2)
      log_success "SSL certificate is valid (Expires: $expiry)"
    else
      log_warn "SSL certificate is expired or expiring within 24 hours"
    fi
    
    # Check if certificate matches key
    local cert_modulus=$(openssl x509 -noout -modulus -in "$cert_file" 2>/dev/null | openssl md5)
    local key_modulus=$(openssl rsa -noout -modulus -in "$key_file" 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" = "$key_modulus" ]; then
      log_success "SSL certificate and key match"
    else
      log_fail "SSL certificate and key do not match"
    fi
    
    return 0
  else
    log_warn "SSL certificate files not found (HTTP only mode)"
    return 1
  fi
}

# Check application endpoint
check_application() {
  log_check "Checking application HTTP endpoint"
  
  # Check health endpoint
  if curl -f -s --max-time 10 "http://localhost:$APP_PORT/health" >/dev/null 2>&1; then
    log_success "Application health endpoint responding"
  else
    log_fail "Application health endpoint not responding"
  fi
  
  # Check main application
  if curl -f -s --max-time 10 "http://localhost:$APP_PORT/" >/dev/null 2>&1; then
    log_success "Application main endpoint responding"
  else
    log_fail "Application main endpoint not responding"
  fi
  
  # Check HTTPS if SSL is configured
  if [ -f "$CERT_DIR/$APP_DOMAIN.crt" ]; then
    log_check "Checking application HTTPS endpoint"
    if curl -k -f -s --max-time 10 "https://localhost/" >/dev/null 2>&1; then
      log_success "Application HTTPS endpoint responding"
    else
      log_warn "Application HTTPS endpoint not responding (may be normal)"
    fi
  fi
}

# Check nginx configuration
check_nginx() {
  log_check "Checking Nginx configuration"
  
  if nginx -t >/dev/null 2>&1; then
    log_success "Nginx configuration is valid"
  else
    log_fail "Nginx configuration has errors"
    return 1
  fi
  
  # Check if our site is enabled
  if [ -f "/etc/nginx/sites-enabled/$APP_NAME" ]; then
    log_success "ProjectPulse Nginx site is enabled"
  else
    log_warn "ProjectPulse Nginx site not found in sites-enabled"
  fi
}

# Check disk space
check_disk_space() {
  log_check "Checking disk space"
  
  local available_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
  
  if [ "$available_space" -gt 5 ]; then
    log_success "Sufficient disk space available: ${available_space}GB"
  elif [ "$available_space" -gt 2 ]; then
    log_warn "Low disk space: ${available_space}GB (recommend 5GB+)"
  else
    log_fail "Critical disk space: ${available_space}GB (less than 2GB)"
  fi
}

# Check memory usage
check_memory() {
  log_check "Checking memory usage"
  
  if command_exists free; then
    local memory_info=$(free -h | grep "Mem:")
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local memory_percent=$(free | grep "Mem:" | awk '{printf "%.1f", $3/$2 * 100.0}')
    
    log_success "Memory usage: $used_memory / $total_memory (${memory_percent}%)"
    
    if (( $(echo "$memory_percent > 90" | bc -l) )); then
      log_warn "High memory usage: ${memory_percent}%"
    fi
  else
    log_warn "Cannot check memory usage (free command not available)"
  fi
}

# Check log files
check_logs() {
  log_check "Checking log files"
  
  # Check application logs
  if journalctl -u "$APP_NAME" --since "1 hour ago" --quiet >/dev/null 2>&1; then
    local log_lines=$(journalctl -u "$APP_NAME" --since "1 hour ago" --no-pager | wc -l)
    log_success "Application logs accessible ($log_lines entries in last hour)"
    
    # Check for errors in recent logs
    local error_count=$(journalctl -u "$APP_NAME" --since "1 hour ago" --no-pager | grep -i error | wc -l)
    if [ "$error_count" -gt 0 ]; then
      log_warn "Found $error_count error(s) in recent application logs"
    fi
  else
    log_warn "Cannot access application logs"
  fi
  
  # Check Nginx logs
  if [ -f "/var/log/nginx/error.log" ]; then
    local nginx_errors=$(tail -100 /var/log/nginx/error.log | grep "$(date +%Y/%m/%d)" | wc -l)
    if [ "$nginx_errors" -eq 0 ]; then
      log_success "No Nginx errors today"
    else
      log_warn "Found $nginx_errors Nginx error(s) today"
    fi
  else
    log_warn "Nginx error log not found"
  fi
}

# Check backup system
check_backups() {
  log_check "Checking backup system"
  
  if [ -f "/usr/local/bin/projectpulse-backup" ]; then
    log_success "Backup script is installed"
    
    # Check if backups exist
    if [ -d "/opt/backups/projectpulse" ]; then
      local backup_count=$(find "/opt/backups/projectpulse" -name "*.sql.gz" -mtime -7 | wc -l)
      if [ "$backup_count" -gt 0 ]; then
        log_success "Found $backup_count recent database backup(s)"
      else
        log_warn "No recent database backups found (last 7 days)"
      fi
    else
      log_warn "Backup directory not found"
    fi
  else
    log_warn "Backup script not installed"
  fi
}

# Check system updates
check_updates() {
  log_check "Checking for system updates"
  
  if command_exists apt-get; then
    local updates_available=$(apt list --upgradable 2>/dev/null | grep -v "WARNING" | wc -l)
    updates_available=$((updates_available - 1))  # Remove header line
    
    if [ "$updates_available" -eq 0 ]; then
      log_success "System is up to date"
    else
      log_warn "$updates_available system update(s) available"
    fi
  else
    log_info "Cannot check system updates (apt not available)"
  fi
}

# Check network connectivity
check_network() {
  log_check "Checking network connectivity"
  
  # Check internet connectivity
  if ping -c 1 -W 5 8.8.8.8 >/dev/null 2>&1; then
    log_success "Internet connectivity available"
  else
    log_warn "No internet connectivity"
  fi
  
  # Check DNS resolution
  if nslookup google.com >/dev/null 2>&1; then
    log_success "DNS resolution working"
  else
    log_warn "DNS resolution issues"
  fi
}

# Generate summary report
generate_summary() {
  echo ""
  echo -e "${CYAN}==========================================${NC}"
  echo -e "${CYAN}  Health Check Summary${NC}"
  echo -e "${CYAN}==========================================${NC}"
  echo ""
  echo -e "Total Checks: ${TOTAL_CHECKS}"
  echo -e "${GREEN}Passed: ${PASSED_CHECKS}${NC}"
  echo -e "${RED}Failed: ${FAILED_CHECKS}${NC}"
  echo -e "${YELLOW}Warnings: ${WARNING_CHECKS}${NC}"
  echo ""
  
  local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
  
  if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "${GREEN}✓ System Status: HEALTHY${NC}"
    echo -e "  Success Rate: ${success_rate}%"
  elif [ "$FAILED_CHECKS" -le 2 ]; then
    echo -e "${YELLOW}⚠ System Status: DEGRADED${NC}"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Action: Review failed checks"
  else
    echo -e "${RED}✗ System Status: UNHEALTHY${NC}"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Action: Immediate attention required"
  fi
  
  echo ""
  echo -e "For detailed logs, run:"
  echo -e "  ${BLUE}sudo journalctl -u $APP_NAME -f${NC}"
  echo -e "  ${BLUE}sudo tail -f /var/log/nginx/error.log${NC}"
  echo ""
}

# Main execution
main() {
  banner
  
  # Core service checks
  check_service "$APP_NAME"
  check_service "postgresql"
  check_service "nginx"
  
  # Port checks
  check_port "$APP_PORT" "ProjectPulse"
  check_port "80" "Nginx HTTP"
  check_port "443" "Nginx HTTPS"
  
  # Application checks
  check_database
  check_ssl
  check_nginx
  check_application
  
  # System health checks
  check_disk_space
  check_memory
  check_network
  
  # Operational checks
  check_logs
  check_backups
  check_updates
  
  # Generate summary
  generate_summary
  
  # Exit with appropriate code
  if [ "$FAILED_CHECKS" -eq 0 ]; then
    exit 0  # All good
  elif [ "$FAILED_CHECKS" -le 2 ]; then
    exit 1  # Some issues
  else
    exit 2  # Major issues
  fi
}

# Command line options
case "${1:-full}" in
  "full"|"all")
    main
    ;;
  "quick")
    banner
    check_service "$APP_NAME"
    check_port "$APP_PORT" "ProjectPulse"
    check_application
    generate_summary
    ;;
  "services")
    banner
    check_service "$APP_NAME"
    check_service "postgresql"
    check_service "nginx"
    generate_summary
    ;;
  "ssl")
    banner
    check_ssl
    generate_summary
    ;;
  "database"|"db")
    banner
    check_database
    generate_summary
    ;;
  "help"|"-h"|"--help")
    echo "ProjectPulse Health Check Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  full       Complete health check (default)"
    echo "  quick      Quick service and application check"
    echo "  services   Check only system services"
    echo "  ssl        Check SSL certificate status"
    echo "  database   Check database connectivity"
    echo "  help       Show this help"
    echo ""
    echo "Exit Codes:"
    echo "  0          All checks passed"
    echo "  1          Some checks failed (degraded)"
    echo "  2          Many checks failed (unhealthy)"
    ;;
  *)
    echo "Unknown command: $1"
    echo "Run '$0 help' for usage information"
    exit 1
    ;;
esac 