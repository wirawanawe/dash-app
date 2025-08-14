#!/bin/bash

echo "🔧 Fixing database connection issues..."

# Stop the Next.js development server if it's running
echo "📱 Stopping development server..."
pkill -f "next dev" || echo "No development server found"

# Restart MySQL service
echo "🗄️  Restarting MySQL service..."
brew services restart mysql

# Wait for MySQL to fully start
echo "⏳ Waiting for MySQL to start..."
sleep 5

# Test database connection
echo "🧪 Testing database connection..."
mysql -h localhost -u root -ppr1k1t1w -e "SELECT 1 as test;" phc_dashboard > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection restored!"
    echo "🚀 You can now restart your development server with: npm run dev"
else
    echo "❌ Database connection still failed. Please check MySQL configuration."
fi
