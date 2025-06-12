#!/bin/bash

# Exit on error
set -e

echo "Installing PM2 globally..."
npm install -g pm2

echo "Creating PM2 ecosystem file..."
cat > ecosystem.config.cjs << 'EOL'
module.exports = {
  apps: [{
    name: 'dash-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOL

echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs

echo "Saving PM2 process list..."
pm2 save

echo "Setting up PM2 to start on system boot..."
pm2 startup

echo "PM2 installation and configuration completed!"
echo "You can use the following commands:"
echo "  - pm2 status         # Check application status"
echo "  - pm2 logs           # View application logs"
echo "  - pm2 restart all    # Restart the application"
echo "  - pm2 stop all       # Stop the application" 