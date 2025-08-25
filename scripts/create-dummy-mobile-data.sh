#!/bin/bash

# Create Dummy Mobile Data Script
# This script creates comprehensive dummy data for 5 mobile users

echo "🚀 Creating Dummy Mobile Data for PHC Mobile App"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the dash-app directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✅ Environment check passed"

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Run the dummy data creation script
echo "🔧 Creating dummy mobile data..."
npm run create-dummy-mobile

echo ""
echo "🎉 Dummy mobile data creation completed!"
echo ""
echo "📋 Summary of created data:"
echo "- 5 mobile users with different program participation levels"
echo "- User 1: Following program for 7 days with tracking data"
echo "- User 2: Following program for 20 days with tracking data (10 days of data)"
echo "- User 3: Following program for 30 days with tracking data (5 days of data)"
echo "- User 4: Completed 7 days program with satisfactory results"
echo "- User 5: Not following any program"
echo ""
echo "🔑 Login credentials for testing:"
echo "User 1: dummy1@example.com / password123"
echo "User 2: dummy2@example.com / password123"
echo "User 3: dummy3@example.com / password123"
echo "User 4: dummy4@example.com / password123"
echo "User 5: dummy5@example.com / password123"
