#!/bin/bash

# Script to set up cron job for user missions status update
# This will run the update script daily at 1:00 AM

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}User Missions Status Update - Cron Job Setup${NC}"
echo "=================================================="

# Get the absolute path to the dash-app directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASH_APP_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}Detected dash-app directory: ${DASH_APP_DIR}${NC}"

# Check if we're in the correct directory
if [ ! -f "$DASH_APP_DIR/package.json" ]; then
    echo -e "${RED}Error: Could not find package.json in dash-app directory${NC}"
    exit 1
fi

# Create the cron job entry
CRON_JOB="0 1 * * * cd $DASH_APP_DIR && ./scripts/run-user-missions-update.sh >> /var/log/user-missions-update.log 2>&1"

echo -e "${YELLOW}This will add the following cron job:${NC}"
echo "$CRON_JOB"
echo ""
echo -e "${YELLOW}This will run the user missions status update daily at 1:00 AM${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with adding this cron job? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "run-user-missions-update.sh"; then
        echo -e "${YELLOW}Warning: A cron job for user missions update already exists.${NC}"
        echo "Current cron jobs:"
        crontab -l 2>/dev/null | grep "run-user-missions-update.sh" || true
        echo ""
        read -p "Do you want to replace the existing cron job? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Remove existing cron job
            (crontab -l 2>/dev/null | grep -v "run-user-missions-update.sh") | crontab -
            echo -e "${GREEN}Removed existing cron job${NC}"
        else
            echo -e "${YELLOW}Cron job setup cancelled${NC}"
            exit 0
        fi
    fi
    
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Cron job added successfully!${NC}"
        echo ""
        echo -e "${BLUE}The script will now run daily at 1:00 AM${NC}"
        echo -e "${BLUE}Logs will be written to: /var/log/user-missions-update.log${NC}"
        echo ""
        echo -e "${YELLOW}To view current cron jobs:${NC}"
        echo "crontab -l"
        echo ""
        echo -e "${YELLOW}To remove this cron job:${NC}"
        echo "crontab -e"
        echo "Then delete the line with 'run-user-missions-update.sh'"
        echo ""
        echo -e "${YELLOW}To test the script manually:${NC}"
        echo "cd $DASH_APP_DIR && ./scripts/run-user-missions-update.sh"
    else
        echo -e "${RED}Failed to add cron job${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Cron job setup cancelled${NC}"
fi 