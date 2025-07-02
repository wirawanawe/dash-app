#!/bin/bash

# PM2 Commands for dash-app management

echo "Available PM2 commands for dash-app:"
echo "=================================="

case $1 in
  "start")
    echo "Starting dash-app..."
    pm2 start ecosystem.config.js --env production
    ;;
  "stop")
    echo "Stopping dash-app..."
    pm2 stop dash-app
    ;;
  "restart")
    echo "Restarting dash-app..."
    pm2 restart dash-app
    ;;
  "reload")
    echo "Reloading dash-app (zero downtime)..."
    pm2 reload dash-app
    ;;
  "delete")
    echo "Deleting dash-app from PM2..."
    pm2 delete dash-app
    ;;
  "logs")
    echo "Showing logs for dash-app..."
    pm2 logs dash-app
    ;;
  "status")
    echo "Showing PM2 status..."
    pm2 list
    ;;
  "monitor")
    echo "Opening PM2 monitor..."
    pm2 monit
    ;;
  "save")
    echo "Saving PM2 configuration..."
    pm2 save
    ;;
  "flush")
    echo "Flushing logs..."
    pm2 flush
    ;;
  "update")
    echo "Updating application..."
    git pull origin master
    npm install
    npm run build
    pm2 reload dash-app
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|reload|delete|logs|status|monitor|save|flush|update}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the application"
    echo "  stop     - Stop the application"
    echo "  restart  - Restart the application"
    echo "  reload   - Reload the application (zero downtime)"
    echo "  delete   - Remove the application from PM2"
    echo "  logs     - Show application logs"
    echo "  status   - Show PM2 status"
    echo "  monitor  - Open PM2 monitor"
    echo "  save     - Save PM2 configuration"
    echo "  flush    - Flush logs"
    echo "  update   - Pull latest code and reload"
    ;;
esac 