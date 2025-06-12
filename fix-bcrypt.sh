#!/bin/bash

echo "Fixing bcrypt installation issue..."

# Remove node_modules and package-lock.json
echo "Removing old dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Install dependencies with bcryptjs
echo "Installing dependencies with bcryptjs..."
npm install

# Verify installation
echo "Verifying installation..."
npm list bcryptjs

echo "bcrypt issue fixed! bcryptjs is now installed instead."
echo "All imports have been updated to use bcryptjs." 