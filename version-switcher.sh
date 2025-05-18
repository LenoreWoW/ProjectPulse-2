#!/bin/bash

# ProjectPulse Version Switcher
# This script allows you to easily switch between the three versions of ProjectPulse:
# - Version 0: In-Memory Storage (Default)
# - Version 1: Clean Database
# - Version 2: Populated Database

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to display header
show_header() {
  echo -e "${BOLD}${BLUE}"
  echo "=================================================="
  echo "   ProjectPulse Version Switcher"
  echo "=================================================="
  echo -e "${NC}"
}

# Function to show the menu
show_menu() {
  echo -e "${BOLD}Please select a version:${NC}"
  echo -e "  ${GREEN}0${NC}) Version 0: In-Memory Storage (Default)"
  echo -e "  ${GREEN}1${NC}) Version 1: Clean Database"
  echo -e "  ${GREEN}2${NC}) Version 2: Populated Database"
  echo -e "  ${RED}q${NC}) Quit"
  echo ""
}

# Function to switch versions
switch_version() {
  local version=$1
  case $version in
    0)
      echo -e "${YELLOW}Switching to Version 0: In-Memory Storage...${NC}"
      git checkout version-0-memory
      echo -e "${GREEN}Successfully switched to Version 0!${NC}"
      echo "To start the application, run: npm run dev"
      ;;
    1)
      echo -e "${YELLOW}Switching to Version 1: Clean Database...${NC}"
      git checkout version-1-clean
      echo -e "${GREEN}Successfully switched to Version 1!${NC}"
      echo "Before starting, ensure your PostgreSQL database is set up and configured in .env"
      echo "To start the application, run: npm run dev"
      ;;
    2)
      echo -e "${YELLOW}Switching to Version 2: Populated Database...${NC}"
      git checkout version-2-populated
      echo -e "${GREEN}Successfully switched to Version 2!${NC}"
      echo "Before starting, ensure your PostgreSQL database is set up and configured in .env"
      echo "To start the application with mock data, run: ./start-populated.sh"
      ;;
    *)
      echo -e "${RED}Invalid option. Please try again.${NC}"
      return 1
      ;;
  esac
  return 0
}

# Main function
main() {
  show_header
  
  # Check if a version was provided as an argument
  if [ $# -eq 1 ]; then
    switch_version $1
    exit $?
  fi
  
  # Interactive mode if no arguments provided
  while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    if [ "$choice" = "q" ]; then
      echo "Exiting version switcher. Goodbye!"
      exit 0
    fi
    
    switch_version $choice
    echo ""
  done
}

# Run main function with all arguments
main "$@" 