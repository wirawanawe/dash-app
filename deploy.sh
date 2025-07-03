#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

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

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}To start the application, run: npm start${NC}"
echo -e "${YELLOW}Application will be available on port 3000${NC}" 