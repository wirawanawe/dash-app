#!/bin/bash

echo "🔧 Fixing production login issue"
echo "================================"

# Check if application is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ Application is not running on localhost:3000"
    echo "Start the application first: pm2 start ecosystem.config.js --env production"
    exit 1
fi

echo "✅ Application is running"

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"

# Test login endpoint
echo ""
echo "🔐 Testing login endpoint..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@phc.com","password":"admin123"}' \
  -c cookies.txt)

echo "Login response: $response"

# Test /api/auth/me endpoint
echo ""
echo "👤 Testing /api/auth/me endpoint..."
me_response=$(curl -s http://localhost:3000/api/auth/me -b cookies.txt)
echo "Me response: $me_response"

# Clean up cookies file
rm -f cookies.txt

echo ""
echo "📊 Common Issues & Solutions:"
echo "============================="
echo "1. If health check fails:"
echo "   - Check PM2 logs: pm2 logs dash-app"
echo "   - Restart PM2: pm2 restart dash-app"
echo ""
echo "2. If login fails:"
echo "   - Check database connection in .env.production"
echo "   - Verify JWT_SECRET is set"
echo "   - Check MySQL credentials"
echo ""
echo "3. If /api/auth/me returns null:"
echo "   - Check cookie settings in production"
echo "   - Verify JWT_SECRET matches between login and me endpoints"
echo "   - Check PM2 environment variables"
echo ""
echo "🔍 Debug with: node production-debug.js" 