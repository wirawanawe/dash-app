#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}PM2 is not installed. Installing PM2...${NC}"
    npm install -g pm2
fi

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}Creating logs directory...${NC}"
    mkdir -p logs
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm ci

# Build the application
echo -e "${GREEN}Building application...${NC}"
npm run build

# Stop existing PM2 process if running
echo -e "${YELLOW}Stopping existing PM2 process...${NC}"
pm2 stop dash-app 2>/dev/null || echo "No existing process to stop"

# Delete existing PM2 process
echo -e "${YELLOW}Cleaning up existing PM2 process...${NC}"
pm2 delete dash-app 2>/dev/null || echo "No existing process to delete"

# Start the application with PM2
echo -e "${GREEN}Starting application with PM2...${NC}"
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
echo -e "${GREEN}Saving PM2 configuration...${NC}"
pm2 save

# Show PM2 status
echo -e "${GREEN}Current PM2 status:${NC}"
pm2 status

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Application is running on port 3000${NC}"
echo -e "${YELLOW}Use 'pm2 logs dash-app' to view logs${NC}"
echo -e "${YELLOW}Use 'pm2 status' to check status${NC}" 