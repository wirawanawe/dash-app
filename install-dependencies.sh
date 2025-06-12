#!/bin/bash

echo "Installing build dependencies for bcrypt..."

# Update package manager
yum update -y

# Install build essentials
yum groupinstall -y "Development Tools"

# Install Python (required for node-gyp)
yum install -y python3 python3-pip

# Install node-gyp globally
npm install -g node-gyp

# Clear npm cache
npm cache clean --force

echo "Build dependencies installed successfully!"
echo "Now try running: npm install" 