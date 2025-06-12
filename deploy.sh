#!/bin/bash

echo "Starting deployment process..."

# Build the application
echo "Building application..."
npm run build

# Stop PM2 process if running
echo "Stopping existing PM2 process..."
pm2 stop dash-app || true

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "Deployment completed successfully!"
echo "Application is running on port 3000" 