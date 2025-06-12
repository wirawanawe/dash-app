#!/bin/bash

echo "🔧 Quick Database Fix for aaPanel"
echo "=================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Creating default..."
    ./create-env.sh
fi

echo "📋 Current .env.local content:"
cat .env.local | grep -E "(DB_HOST|DB_USER|DB_NAME|DB_PASSWORD)"

echo ""
echo "🧪 Testing MySQL connection methods..."

# Method 1: Test current credentials
echo ""
echo "Method 1: Testing current credentials..."
npm run debug-db

echo ""
echo "================================================"
echo "If the above failed, try these solutions:"
echo "================================================"

echo ""
echo "🔑 SOLUTION 1: Get MySQL root password from aaPanel"
echo "   1. Login to aaPanel"
echo "   2. Database → MySQL → Root Password"
echo "   3. Copy the password"
echo "   4. Run: nano .env.local"
echo "   5. Update DB_PASSWORD line"

echo ""
echo "🔑 SOLUTION 2: Create new database user"
echo "   Run: ./fix-db-user.sh"

echo ""
echo "🔑 SOLUTION 3: Use aaPanel database manager"
echo "   1. aaPanel → Database → MySQL → Add User"
echo "   2. Username: phc_user"
echo "   3. Password: (your choice)"
echo "   4. Host: localhost"
echo "   5. Database: phc_dashboard"
echo "   6. Privileges: All"

echo ""
echo "🔑 SOLUTION 4: Reset MySQL root password"
echo "   In aaPanel: Database → MySQL → Root Password → Reset"

echo ""
read -p "Which solution do you want to try? (1/2/3/4): " CHOICE

case $CHOICE in
    1)
        echo "Opening .env.local for editing..."
        nano .env.local
        echo "Testing connection..."
        npm run debug-db
        ;;
    2)
        echo "Running database user creation script..."
        ./fix-db-user.sh
        ;;
    3)
        cat > .env.local << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=phc_user
DB_PASSWORD=your_password_here
DB_NAME=phc_dashboard

# JWT Secret
JWT_SECRET=supersecretkey123456789supersecretkey123456789

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF
        echo "✅ .env.local updated for new user 'phc_user'"
        echo "⚠️  Don't forget to:"
        echo "   1. Create user 'phc_user' in aaPanel"
        echo "   2. Update password in .env.local"
        echo "   3. Run: npm run debug-db"
        ;;
    4)
        echo "Please reset MySQL root password in aaPanel, then run:"
        echo "nano .env.local"
        ;;
    *)
        echo "Please choose option 1, 2, 3, or 4"
        ;;
esac 