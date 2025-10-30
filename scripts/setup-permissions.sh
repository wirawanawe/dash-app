#!/bin/bash

# Setup User Permissions System
# This script will:
# 1. Create user_permissions table
# 2. Migrate default permissions for existing users

echo "================================================"
echo "  Setup User Permissions System"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env or docker.env exists
if [ -f "docker.env" ]; then
    source docker.env
    echo -e "${GREEN}✓${NC} Loaded configuration from docker.env"
elif [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✓${NC} Loaded configuration from .env"
else
    echo -e "${YELLOW}⚠${NC} No .env file found, using defaults"
    export DB_HOST=localhost
    export DB_USER=root
    export DB_PASSWORD=root
    export DB_NAME=phc_dashboard
fi

echo ""
echo "Database Configuration:"
echo "  Host: ${DB_HOST:-localhost}"
echo "  User: ${DB_USER:-root}"
echo "  Database: ${DB_NAME:-phc_dashboard}"
echo ""

# Prompt for confirmation
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}✗${NC} Aborted by user"
    exit 1
fi

echo ""
echo "================================================"
echo "  Step 1: Create user_permissions table"
echo "================================================"
echo ""

# Check if Docker is being used
if docker ps | grep -q "mysql"; then
    echo "Detected Docker MySQL container..."
    CONTAINER_NAME=$(docker ps | grep mysql | awk '{print $NF}')
    echo "Container name: $CONTAINER_NAME"
    
    docker exec -i $CONTAINER_NAME mysql -u${DB_USER:-root} -p${DB_PASSWORD:-root} ${DB_NAME:-phc_dashboard} < init-scripts/15-create-user-permissions.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Table created successfully"
    else
        echo -e "${RED}✗${NC} Failed to create table"
        exit 1
    fi
else
    echo "Using local MySQL..."
    mysql -h${DB_HOST:-localhost} -u${DB_USER:-root} -p${DB_PASSWORD:-root} ${DB_NAME:-phc_dashboard} < init-scripts/15-create-user-permissions.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Table created successfully"
    else
        echo -e "${RED}✗${NC} Failed to create table"
        exit 1
    fi
fi

echo ""
echo "================================================"
echo "  Step 2: Migrate default permissions"
echo "================================================"
echo ""

# Run Node.js migration script
if [ -f "scripts/migrate-default-permissions.cjs" ]; then
    node scripts/migrate-default-permissions.cjs
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} Permissions migrated successfully"
    else
        echo ""
        echo -e "${RED}✗${NC} Failed to migrate permissions"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Migration script not found: scripts/migrate-default-permissions.cjs"
    exit 1
fi

echo ""
echo "================================================"
echo "  Setup Completed!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Restart your application: npm run dev"
echo "  2. Login as admin"
echo "  3. Go to Users page (/users)"
echo "  4. Click Lock icon to manage user permissions"
echo ""
echo "For more info, read: QUICK_START_PERMISSIONS.md"
echo ""

