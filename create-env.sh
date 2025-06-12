#!/bin/bash

echo "🔧 Creating .env.local file..."

# Backup existing .env.local if exists
if [ -f .env.local ]; then
    echo "Backing up existing .env.local..."
    cp .env.local .env.local.backup
fi

# Create new .env.local
cat > .env.local << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=phc_dashboard

# JWT Secret
JWT_SECRET=supersecretkey123456789supersecretkey123456789

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF

echo "✅ .env.local created successfully!"

# Set proper permissions
chmod 600 .env.local

echo "📋 Current .env.local content:"
cat .env.local

echo ""
echo "⚠️  IMPORTANT: Update DB_PASSWORD with your MySQL root password!"
echo "   You can find it in aaPanel -> Database -> MySQL -> Root Password"
echo ""
echo "To edit: nano .env.local" 