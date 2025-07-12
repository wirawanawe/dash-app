#!/bin/bash

echo "🚀 Setting up production environment for dash-app"
echo "================================================="

# Create logs directory
mkdir -p logs

# Create .env.production file
echo "📝 Creating .env.production file..."
cat > .env.production << 'EOF'
# Production Environment Configuration
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=phc_dashboard

# JWT Secret - MUST be set for production
JWT_SECRET=supersecretkey123456789supersecretkey123456789supersecretkey

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Session Configuration
SESSION_TIMEOUT=3600000

# Debug Configuration (set to true for troubleshooting)
DEBUG_MODE=false
EOF

# Make production-debug.js executable
chmod +x production-debug.js

echo "✅ .env.production created"
echo "⚠️  IMPORTANT: Update DB_PASSWORD in .env.production with your MySQL password!"
echo ""

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🔧 PM2 Setup Commands:"
echo "====================="
echo "1. Update ecosystem.config.js with your project path"
echo "2. Set your MySQL password in ecosystem.config.js"
echo "3. Start with PM2:"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "🔍 Debugging Commands:"
echo "====================="
echo "1. Run production debug: node production-debug.js"
echo "2. Check health: curl http://localhost:3000/api/health"
echo "3. Check PM2 logs: pm2 logs dash-app"
echo "4. Restart PM2: pm2 restart dash-app"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Edit .env.production - add your MySQL password"
echo "2. Edit ecosystem.config.js - update project path"
echo "3. Test database connection: node production-debug.js"
echo "4. Deploy: pm2 start ecosystem.config.js --env production" 