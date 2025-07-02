#!/bin/bash

echo "Installing PM2 and setting up dash-app..."

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
else
    echo "PM2 is already installed"
fi

# Install dependencies
echo "Installing project dependencies..."
npm install

# Build the Next.js application
echo "Building the application..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "Setting up PM2 startup script..."
pm2 startup

echo "Installation complete!"
echo "Use 'pm2 list' to check application status"
echo "Use 'pm2 logs dash-app' to view logs"
echo "Use 'pm2 restart dash-app' to restart the application" 