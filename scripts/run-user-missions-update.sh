#!/bin/bash

# Script to update user missions status
# This script automatically changes active user_missions to completed when the date changes from created_at

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting User Missions Status Update Script${NC}"
echo "================================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the dash-app directory${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Using default database configuration.${NC}"
fi

# Run the update script
echo -e "${YELLOW}Running user missions status update...${NC}"
node scripts/update-user-missions-status.js

# Check the exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}User missions status update completed successfully!${NC}"
else
    echo -e "${RED}User missions status update failed!${NC}"
    exit 1
fi 