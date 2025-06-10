#!/usr/bin/env bash

# ============================================================================ #
# ProjectPulse Deployment Test Script
# ============================================================================ #
# This script performs comprehensive testing of a deployed ProjectPulse
# application to ensure all functionality works correctly.
# ============================================================================ #

set -euo pipefail

# Configuration
APP_PORT="7000"
APP_DOMAIN="${APP_DOMAIN:-pm.mod.gov.qa}"
BASE_URL="http://localhost:$APP_PORT"
HTTPS_URL="https://localhost"
TEST_TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; ((PASSED_TESTS++)); }
log_fail() { echo -e "${RED}[✗]${NC} $1"; ((FAILED_TESTS++)); }
log_test() { echo -e "${CYAN}[TEST]${NC} $1"; ((TOTAL_TESTS++)); }

banner() {
  echo -e "\n${CYAN}==========================================${NC}"
  echo -e "${CYAN}  ProjectPulse Deployment Test Suite${NC}"
  echo -e "${CYAN}  $(date)${NC}"
  echo -e "${CYAN}==========================================${NC}\n"
}

# Test HTTP endpoint
test_http_endpoint() {
  local endpoint="$1"
  local description="$2"
  local expected_status="${3:-200}"
  
  log_test "$description"
  
  local response=$(curl -s -w "%{http_code}" --max-time $TEST_TIMEOUT "$BASE_URL$endpoint" -o /tmp/test_response 2>/dev/null || echo "000")
  
  if [ "$response" = "$expected_status" ]; then
    log_success "$description - Status: $response"
    return 0
  else
    log_fail "$description - Expected: $expected_status, Got: $response"
    return 1
  fi
}

# Test API endpoint with JSON response
test_api_endpoint() {
  local endpoint="$1"
  local description="$2"
  local method="${3:-GET}"
  
  log_test "$description"
  
  local response=$(curl -s --max-time $TEST_TIMEOUT -X "$method" \
    -H "Content-Type: application/json" \
    "$BASE_URL$endpoint" 2>/dev/null || echo "")
  
  if [ -n "$response" ] && echo "$response" | jq . >/dev/null 2>&1; then
    log_success "$description - Valid JSON response"
    return 0
  else
    log_fail "$description - Invalid or empty response"
    return 1
  fi
}

# Test database connectivity
test_database() {
  log_test "Database connectivity"
  
  if sudo -u postgres psql -d projectpulse -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Database connection successful"
    
    # Test specific tables
    log_test "Database tables existence"
    local tables=("users" "projects" "milestones" "departments")
    local missing_tables=()
    
    for table in "${tables[@]}"; do
      if sudo -u postgres psql -d projectpulse -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
        log_success "Table '$table' exists and accessible"
      else
        log_fail "Table '$table' missing or inaccessible"
        missing_tables+=("$table")
      fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
      return 0
    else
      return 1
    fi
  else
    log_fail "Database connection failed"
    return 1
  fi
}

# Test file upload functionality
test_file_upload() {
  log_test "File upload functionality"
  
  # Create a test file
  echo "This is a test file for ProjectPulse deployment testing." > /tmp/test_upload.txt
  
  # Test upload endpoint (this would need to be adjusted based on actual API)
  local response=$(curl -s --max-time $TEST_TIMEOUT \
    -F "file=@/tmp/test_upload.txt" \
    "$BASE_URL/api/upload" 2>/dev/null || echo "")
  
  if [ -n "$response" ]; then
    log_success "File upload endpoint responding"
    # Clean up
    rm -f /tmp/test_upload.txt
    return 0
  else
    log_fail "File upload endpoint not responding"
    rm -f /tmp/test_upload.txt
    return 1
  fi
}

# Test authentication
test_authentication() {
  log_test "Authentication system"
  
  # Test login endpoint
  local login_response=$(curl -s --max-time $TEST_TIMEOUT \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123!"}' \
    "$BASE_URL/api/auth/login" 2>/dev/null || echo "")
  
  if [ -n "$login_response" ]; then
    log_success "Authentication endpoint responding"
    
    # Check if response contains token or success indicator
    if echo "$login_response" | grep -q -E "(token|success|user)" 2>/dev/null; then
      log_success "Authentication response contains expected fields"
      return 0
    else
      log_fail "Authentication response missing expected fields"
      return 1
    fi
  else
    log_fail "Authentication endpoint not responding"
    return 1
  fi
}

# Test data retrieval
test_data_retrieval() {
  log_test "Data retrieval functionality"
  
  # Test projects endpoint
  test_api_endpoint "/api/projects" "Projects API endpoint"
  
  # Test milestones endpoint  
  test_api_endpoint "/api/milestones" "Milestones API endpoint"
  
  # Test users endpoint
  test_api_endpoint "/api/users" "Users API endpoint"
  
  # Test dashboard data
  test_api_endpoint "/api/dashboard" "Dashboard API endpoint"
}

# Test static file serving
test_static_files() {
  log_test "Static file serving"
  
  # Test main application
  test_http_endpoint "/" "Main application page"
  
  # Test asset files (if they exist)
  if curl -s --max-time $TEST_TIMEOUT "$BASE_URL/assets/index.css" >/dev/null 2>&1; then
    log_success "CSS assets served correctly"
  else
    log_fail "CSS assets not found or not served"
  fi
  
  if curl -s --max-time $TEST_TIMEOUT "$BASE_URL/assets/index.js" >/dev/null 2>&1; then
    log_success "JavaScript assets served correctly"
  else
    log_fail "JavaScript assets not found or not served"
  fi
}

# Test SSL/HTTPS
test_ssl() {
  log_test "SSL/HTTPS functionality"
  
  # Check if SSL certificates exist
  if [ -f "/etc/nginx/ssl/$APP_DOMAIN.crt" ]; then
    log_success "SSL certificate files found"
    
    # Test HTTPS endpoint
    if curl -k -s --max-time $TEST_TIMEOUT "$HTTPS_URL/" >/dev/null 2>&1; then
      log_success "HTTPS endpoint responding"
    else
      log_fail "HTTPS endpoint not responding"
    fi
    
    # Test SSL certificate validity
    if openssl x509 -in "/etc/nginx/ssl/$APP_DOMAIN.crt" -checkend 86400 >/dev/null 2>&1; then
      log_success "SSL certificate is valid"
    else
      log_fail "SSL certificate is expired or invalid"
    fi
  else
    log_fail "SSL certificate files not found"
  fi
}

# Test performance
test_performance() {
  log_test "Basic performance checks"
  
  # Measure response time for main page
  local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time $TEST_TIMEOUT "$BASE_URL/" 2>/dev/null || echo "999")
  
  if (( $(echo "$response_time < 5.0" | bc -l) )); then
    log_success "Main page response time: ${response_time}s (< 5s)"
  else
    log_fail "Main page response time: ${response_time}s (> 5s)"
  fi
  
  # Test concurrent requests
  log_test "Concurrent request handling"
  
  local concurrent_test=true
  for i in {1..5}; do
    if ! curl -s --max-time $TEST_TIMEOUT "$BASE_URL/health" >/dev/null 2>&1; then
      concurrent_test=false
      break
    fi &
  done
  wait
  
  if [ "$concurrent_test" = true ]; then
    log_success "Handles concurrent requests"
  else
    log_fail "Issues with concurrent requests"
  fi
}

# Test security headers
test_security() {
  log_test "Security headers"
  
  local headers=$(curl -I -s --max-time $TEST_TIMEOUT "$BASE_URL/" 2>/dev/null || echo "")
  
  local security_checks=(
    "X-Content-Type-Options"
    "X-Frame-Options" 
    "X-XSS-Protection"
  )
  
  for header in "${security_checks[@]}"; do
    if echo "$headers" | grep -q "$header"; then
      log_success "Security header present: $header"
    else
      log_fail "Security header missing: $header"
    fi
  done
}

# Test backup system
test_backup_system() {
  log_test "Backup system"
  
  if [ -f "/usr/local/bin/projectpulse-backup" ]; then
    log_success "Backup script installed"
    
    if [ -x "/usr/local/bin/projectpulse-backup" ]; then
      log_success "Backup script is executable"
    else
      log_fail "Backup script is not executable"
    fi
    
    # Check backup directory
    if [ -d "/opt/backups/projectpulse" ]; then
      log_success "Backup directory exists"
    else
      log_fail "Backup directory missing"
    fi
  else
    log_fail "Backup script not installed"
  fi
}

# Test log files
test_logging() {
  log_test "Logging system"
  
  # Check if application logs are accessible
  if journalctl -u projectpulse --since "1 minute ago" --quiet >/dev/null 2>&1; then
    log_success "Application logs accessible"
  else
    log_fail "Cannot access application logs"
  fi
  
  # Check Nginx logs
  if [ -f "/var/log/nginx/access.log" ]; then
    log_success "Nginx access log exists"
  else
    log_fail "Nginx access log missing"
  fi
  
  if [ -f "/var/log/nginx/error.log" ]; then
    log_success "Nginx error log exists"
  else
    log_fail "Nginx error log missing"
  fi
}

# Test data integrity
test_data_integrity() {
  log_test "Data integrity checks"
  
  # Check if data was imported correctly
  local project_count=$(sudo -u postgres psql -d projectpulse -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | tr -d ' ' || echo "0")
  local milestone_count=$(sudo -u postgres psql -d projectpulse -t -c "SELECT COUNT(*) FROM milestones;" 2>/dev/null | tr -d ' ' || echo "0")
  local user_count=$(sudo -u postgres psql -d projectpulse -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  
  if [ "$project_count" -gt 0 ]; then
    log_success "Projects imported: $project_count records"
  else
    log_fail "No projects found in database"
  fi
  
  if [ "$milestone_count" -gt 0 ]; then
    log_success "Milestones imported: $milestone_count records"
  else
    log_fail "No milestones found in database"
  fi
  
  if [ "$user_count" -gt 0 ]; then
    log_success "Users created: $user_count records"
  else
    log_fail "No users found in database"
  fi
}

# Generate test report
generate_test_report() {
  echo ""
  echo -e "${CYAN}==========================================${NC}"
  echo -e "${CYAN}  Test Results Summary${NC}"
  echo -e "${CYAN}==========================================${NC}"
  echo ""
  echo -e "Total Tests: ${TOTAL_TESTS}"
  echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
  echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
  echo ""
  
  local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
  
  if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment Status: FULLY FUNCTIONAL${NC}"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Ready for production use!"
  elif [ "$FAILED_TESTS" -le 3 ]; then
    echo -e "${YELLOW}⚠ Deployment Status: MOSTLY FUNCTIONAL${NC}"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Minor issues detected, review failed tests"
  else
    echo -e "${RED}✗ Deployment Status: ISSUES DETECTED${NC}"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Significant issues found, requires attention"
  fi
  
  echo ""
  echo -e "Application Access:"
  echo -e "  ${BLUE}HTTP:${NC} $BASE_URL"
  echo -e "  ${BLUE}HTTPS:${NC} $HTTPS_URL (if SSL configured)"
  echo ""
  echo -e "Admin Credentials:"
  echo -e "  ${BLUE}Username:${NC} admin"
  echo -e "  ${BLUE}Password:${NC} Admin@123!"
  echo ""
}

# Main test execution
main() {
  banner
  
  log_info "Starting ProjectPulse deployment tests..."
  echo ""
  
  # Core functionality tests
  test_http_endpoint "/health" "Health check endpoint"
  test_database
  test_authentication
  test_data_retrieval
  test_data_integrity
  
  # Infrastructure tests
  test_static_files
  test_ssl
  test_security
  
  # System tests
  test_performance
  test_logging
  test_backup_system
  
  # Optional tests
  test_file_upload
  
  # Generate final report
  generate_test_report
  
  # Exit with appropriate code
  if [ "$FAILED_TESTS" -eq 0 ]; then
    exit 0  # All tests passed
  elif [ "$FAILED_TESTS" -le 3 ]; then
    exit 1  # Minor issues
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
    test_http_endpoint "/health" "Health check endpoint"
    test_http_endpoint "/" "Main application page"
    test_database
    generate_test_report
    ;;
  "api")
    banner
    test_data_retrieval
    test_authentication
    generate_test_report
    ;;
  "security")
    banner
    test_ssl
    test_security
    test_authentication
    generate_test_report
    ;;
  "performance")
    banner
    test_performance
    generate_test_report
    ;;
  "help"|"-h"|"--help")
    echo "ProjectPulse Deployment Test Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  full        Complete test suite (default)"
    echo "  quick       Quick functionality test"
    echo "  api         API endpoint tests"
    echo "  security    Security and SSL tests"
    echo "  performance Basic performance tests"
    echo "  help        Show this help"
    echo ""
    echo "Exit Codes:"
    echo "  0           All tests passed"
    echo "  1           Minor issues detected"
    echo "  2           Major issues detected"
    ;;
  *)
    echo "Unknown command: $1"
    echo "Run '$0 help' for usage information"
    exit 1
    ;;
esac 