#!/bin/bash

# Set error handling
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}       ProjectPulse Deployment Script        ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to print status messages
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to print error messages
print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to print warning messages
print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
check_node() {
  print_status "Checking if Node.js is installed..."
  
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js and try again."
    exit 1
  fi
  
  NODE_VERSION=$(node -v)
  print_success "Node.js is installed: $NODE_VERSION"
}

# Install dependencies
install_dependencies() {
  print_status "Installing dependencies..."
  
  cd "$PROJECT_ROOT"
  npm install
  
  print_success "Dependencies installed successfully"
}

# Build the project
build_project() {
  print_status "Building the project..."
  
  cd "$PROJECT_ROOT"
  npm run build
  
  print_success "Project built successfully"
}

# Run the PostgreSQL setup script
setup_postgres() {
  print_status "Setting up PostgreSQL..."
  
  cd "$PROJECT_ROOT"
  # Make the check-postgres.js script executable
  chmod +x "$SCRIPT_DIR/check-postgres.js"
  node "$SCRIPT_DIR/check-postgres.js"
  
  if [ $? -ne 0 ]; then
    print_error "Failed to set up PostgreSQL. Please check the error message above."
    exit 1
  fi
  
  print_success "PostgreSQL setup completed successfully"
}

# Main function
main() {
  print_status "Starting deployment process..."
  
  # Check if Node.js is installed
  check_node
  
  # Install dependencies
  install_dependencies
  
  # Build the project
  build_project
  
  # Setup PostgreSQL
  setup_postgres
  
  print_success "Deployment completed successfully!"
  print_status "You can now run the application using: npm start"
}

# Run the main function
main 