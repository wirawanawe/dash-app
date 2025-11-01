#!/bin/bash

# ============================================
# Deploy Script untuk dash.doctorphc.id
# ============================================

set -e  # Exit on error

echo "🚀 Starting deployment to production..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/www/wwwroot/dash-app"
BACKUP_DIR="/www/wwwroot/backups"
APP_NAME="dash-app"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📦 Step 1: Creating backup...${NC}"
BACKUP_FILE="$BACKUP_DIR/dash-app-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf $BACKUP_FILE -C /www/wwwroot dash-app
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

echo -e "${YELLOW}📥 Step 2: Pulling latest code...${NC}"
cd $APP_DIR
git fetch origin master
git pull origin master
echo -e "${GREEN}✅ Code updated${NC}"

echo -e "${YELLOW}📦 Step 3: Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}🔨 Step 4: Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

echo -e "${YELLOW}🔄 Step 5: Restarting PM2...${NC}"
pm2 restart $APP_NAME
pm2 save
echo -e "${GREEN}✅ Application restarted${NC}"

echo -e "${YELLOW}🏥 Step 6: Health check...${NC}"
sleep 5  # Wait for app to start
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed! HTTP Status: $HEALTH_CHECK${NC}"
    echo -e "${YELLOW}🔄 Rolling back to backup...${NC}"
    pm2 stop $APP_NAME
    cd /www/wwwroot
    rm -rf dash-app
    tar -xzf $BACKUP_FILE -C /www/wwwroot
    cd $APP_DIR
    pm2 restart $APP_NAME
    echo -e "${RED}❌ Deployment failed, rolled back to previous version${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📊 Application Status:"
pm2 status $APP_NAME

echo ""
echo "📝 Next Steps:"
echo "1. Test the application: https://dash.doctorphc.id"
echo "2. Monitor logs: pm2 logs $APP_NAME"
echo "3. Check health: curl http://localhost:3000/api/health"
echo ""
echo "🔙 Rollback if needed: tar -xzf $BACKUP_FILE -C /www/wwwroot && pm2 restart $APP_NAME"

