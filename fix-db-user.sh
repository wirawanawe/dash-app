#!/bin/bash

echo "🔧 Setting up dedicated database user..."

echo "This script will:"
echo "1. Create a dedicated database user"
echo "2. Update .env.local with new credentials"
echo ""

read -p "Enter MySQL root password: " -s ROOT_PASSWORD
echo ""

read -p "Enter new database username [dashapp_user]: " DB_USER
DB_USER=${DB_USER:-dashapp_user}

read -p "Enter new database password [dashapp123]: " -s DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-dashapp123}
echo ""

echo "Creating database and user..."

# Create database and user
mysql -u root -p"$ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS phc_dashboard;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON phc_dashboard.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully!"
    
    # Update .env.local
    cat > .env.local << EOF
# Database Configuration
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=phc_dashboard

# JWT Secret
JWT_SECRET=supersecretkey123456789supersecretkey123456789

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF

    chmod 600 .env.local
    
    echo "✅ .env.local updated with new credentials!"
    echo "📋 New database configuration:"
    echo "  User: $DB_USER"
    echo "  Database: phc_dashboard"
    
    echo "🧪 Testing connection..."
    npm run debug-db
    
else
    echo "❌ Failed to create database/user. Check your root password."
fi 