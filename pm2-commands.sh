#!/bin/bash

# PM2 Management Script for dash-app
# Usage: ./pm2-commands.sh [command]

APP_NAME="dash-app"
CONFIG_FILE="ecosystem.config.cjs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}PM2 Management Commands for $APP_NAME${NC}"
    echo ""
    echo "Usage: ./pm2-commands.sh [command]"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}start${NC}     - Start the application"
    echo -e "  ${GREEN}stop${NC}      - Stop the application"
    echo -e "  ${GREEN}restart${NC}   - Restart the application"
    echo -e "  ${GREEN}reload${NC}    - Reload the application (zero downtime)"
    echo -e "  ${GREEN}delete${NC}    - Delete the application from PM2"
    echo -e "  ${GREEN}status${NC}    - Show application status"
    echo -e "  ${GREEN}logs${NC}      - Show application logs"
    echo -e "  ${GREEN}logs-error${NC} - Show error logs only"
    echo -e "  ${GREEN}logs-out${NC}  - Show output logs only"
    echo -e "  ${GREEN}monitor${NC}   - Open PM2 monitoring dashboard"
    echo -e "  ${GREEN}save${NC}      - Save current PM2 configuration"
    echo -e "  ${GREEN}resurrect${NC} - Restore saved PM2 configuration"
    echo -e "  ${GREEN}reset${NC}     - Reset application metadata"
    echo -e "  ${GREEN}describe${NC}  - Show detailed application info"
    echo -e "  ${GREEN}env${NC}       - Show environment variables"
    echo ""
}

case "$1" in
    start)
        echo -e "${GREEN}Starting $APP_NAME...${NC}"
        pm2 start $CONFIG_FILE --env production
        ;;
    stop)
        echo -e "${YELLOW}Stopping $APP_NAME...${NC}"
        pm2 stop $APP_NAME
        ;;
    restart)
        echo -e "${YELLOW}Restarting $APP_NAME...${NC}"
        pm2 restart $APP_NAME
        ;;
    reload)
        echo -e "${GREEN}Reloading $APP_NAME (zero downtime)...${NC}"
        pm2 reload $APP_NAME
        ;;
    delete)
        echo -e "${RED}Deleting $APP_NAME from PM2...${NC}"
        pm2 delete $APP_NAME
        ;;
    status)
        echo -e "${BLUE}Status of all PM2 processes:${NC}"
        pm2 status
        ;;
    logs)
        echo -e "${BLUE}Following logs for $APP_NAME (Ctrl+C to exit):${NC}"
        pm2 logs $APP_NAME --lines 50
        ;;
    logs-error)
        echo -e "${RED}Following error logs for $APP_NAME:${NC}"
        pm2 logs $APP_NAME --err --lines 50
        ;;
    logs-out)
        echo -e "${GREEN}Following output logs for $APP_NAME:${NC}"
        pm2 logs $APP_NAME --out --lines 50
        ;;
    monitor)
        echo -e "${BLUE}Opening PM2 monitoring dashboard...${NC}"
        pm2 monit
        ;;
    save)
        echo -e "${GREEN}Saving PM2 configuration...${NC}"
        pm2 save
        ;;
    resurrect)
        echo -e "${GREEN}Restoring PM2 configuration...${NC}"
        pm2 resurrect
        ;;
    reset)
        echo -e "${YELLOW}Resetting $APP_NAME metadata...${NC}"
        pm2 reset $APP_NAME
        ;;
    describe)
        echo -e "${BLUE}Detailed information for $APP_NAME:${NC}"
        pm2 describe $APP_NAME
        ;;
    env)
        echo -e "${BLUE}Environment variables for $APP_NAME:${NC}"
        pm2 env $APP_NAME
        ;;
    *)
        show_help
        ;;
esac 