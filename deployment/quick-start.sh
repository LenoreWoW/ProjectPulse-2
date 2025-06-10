#!/usr/bin/env bash

# ============================================================================ #
# ProjectPulse V1 Quick Start Script
# ============================================================================ #
# This script provides a simplified deployment process for ProjectPulse V1
# ============================================================================ #

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

banner() {
  echo -e "${CYAN}"
  echo "  ____            _           _   ____        _            "
  echo " |  _ \ _ __ ___ (_) ___  ___| |_|  _ \ _   _| |___  ___   "
  echo " | |_) | '__/ _ \| |/ _ \/ __| __| |_) | | | | / __|/ _ \  "
  echo " |  __/| | | (_) | |  __/ (__| |_|  __/| |_| | \__ \  __/  "
  echo " |_|   |_|  \___// |\___|\___|\__|_|    \__,_|_|___/\___|  "
  echo "                |__/                                       "
  echo "                                                           "
  echo "              V1.0 Quick Start Deployment"
  echo -e "${NC}\n"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Show banner
banner

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  log_error "package.json not found. Please run this script from the ProjectPulse root directory."
  exit 1
fi

log_info "Starting ProjectPulse V1 Quick Deployment..."
log_info "Project root: $PROJECT_ROOT"

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
  fi
  
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18+ and try again."
    exit 1
  fi
  
  log_success "Node.js $(node -v) detected"
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm and try again."
    exit 1
  fi
  
  log_success "npm $(npm -v) detected"
  
  # Check PostgreSQL
  if ! command -v psql &> /dev/null; then
    log_warn "PostgreSQL not found. The deployment script will attempt to install it."
  else
    log_success "PostgreSQL detected"
  fi
}

# Install dependencies
install_dependencies() {
  log_info "Installing npm dependencies..."
  cd "$PROJECT_ROOT"
  npm install
  log_success "Dependencies installed"
}

# Build application
build_application() {
  log_info "Building application..."
  cd "$PROJECT_ROOT"
  # Clear build cache to ensure fresh build
  rm -rf dist/ 2>/dev/null || true
  rm -rf node_modules/.vite 2>/dev/null || true
  npm run build
  log_success "Application built successfully"
}

# Set up environment
setup_environment() {
  log_info "Setting up environment configuration..."
  
  if [ ! -f "$PROJECT_ROOT/.env" ]; then
    log_info "Creating .env file from template..."
    cp "$SCRIPT_DIR/production.env" "$PROJECT_ROOT/.env"
    log_warn "Please review and update the .env file with your specific configuration"
  else
    log_info ".env file already exists"
  fi
  
  # Export environment variables
  export NODE_ENV=production
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/projectpulse"
  export DB_HOST=localhost
  export DB_PORT=5432
  export DB_NAME=projectpulse
  export DB_USER=postgres
  export DB_PASSWORD=postgres
}

# Database setup
setup_database() {
  log_info "Setting up database..."
  
  cd "$PROJECT_ROOT"
  
  # Check if schema creation script exists
  if [ -f "create-db-schema.js" ]; then
    log_info "Creating database schema..."
    node create-db-schema.js
    log_success "Database schema created"
  else
    log_warn "Database schema script not found"
  fi
}

# Import data
import_data() {
  log_info "Importing CSV data..."
  
  cd "$PROJECT_ROOT"
  
  # Import Projects.csv
  if [ -f "Projects.csv" ]; then
    if [ -f "import-projects.js" ]; then
      log_info "Importing Projects.csv..."
      node import-projects.js Projects.csv
      log_success "Projects imported"
    else
      log_warn "Project import script not found"
    fi
  else
    log_warn "Projects.csv not found"
  fi
  
  # Import Milestones.csv
  if [ -f "Milestones.csv" ]; then
    if [ -f "import-milestones.js" ]; then
      log_info "Importing Milestones.csv..."
      node import-milestones.js Milestones.csv
      log_success "Milestones imported"
    else
      log_warn "Milestone import script not found"
    fi
  else
    log_warn "Milestones.csv not found"
  fi
}

# Create admin user
create_admin() {
  log_info "Creating admin user..."
  
  cd "$PROJECT_ROOT"
  
  if [ -f "create-admin.js" ]; then
    node create-admin.js
    log_success "Admin user created"
  else
    log_warn "Admin creation script not found"
  fi
}

# Start application
start_application() {
  log_info "Starting application..."
  
  cd "$PROJECT_ROOT"
  
  # Check if production server exists
  if [ -f "production-server.js" ]; then
    log_info "Starting production server on port 7000..."
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ProjectPulse V1 is starting...${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${CYAN}Application will be available at:${NC}"
    echo -e "  • Local: ${YELLOW}http://localhost:7000${NC}"
    echo -e "  • Network: ${YELLOW}http://$(hostname -I | awk '{print $1}'):7000${NC}" 2>/dev/null || echo -e "  • Network: ${YELLOW}http://$(ipconfig getifaddr en0):7000${NC}" 2>/dev/null || true
    echo ""
    echo -e "${CYAN}Default admin credentials:${NC}"
    echo -e "  • Username: ${YELLOW}admin${NC}"
    echo -e "  • Password: ${YELLOW}Admin@123!${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    node production-server.js
  else
    log_error "production-server.js not found"
    exit 1
  fi
}

# Main execution
main() {
  check_prerequisites
  install_dependencies
  build_application
  setup_environment
  setup_database
  import_data
  create_admin
  start_application
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Shutting down ProjectPulse...${NC}"; exit 0' INT

# Check command line arguments
case "${1:-quick}" in
  "quick"|"start")
    main
    ;;
  "full")
    log_info "Running full deployment script..."
    exec "$SCRIPT_DIR/deploy-v1.sh" local
    ;;
  "help"|"-h"|"--help")
    echo "ProjectPulse V1 Quick Start"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  quick     Quick start deployment (default)"
    echo "  start     Same as quick"
    echo "  full      Run full deployment script"
    echo "  help      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0           # Quick start"
    echo "  $0 quick     # Quick start"
    echo "  $0 full      # Full deployment"
    ;;
  *)
    log_error "Unknown command: $1"
    echo "Run '$0 help' for usage information"
    exit 1
    ;;
esac 