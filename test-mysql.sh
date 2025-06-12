#!/bin/bash

echo "🔍 MySQL Connection Tester"
echo "=========================="

echo "📋 Checking MySQL service status..."
systemctl status mysql 2>/dev/null || systemctl status mysqld 2>/dev/null || echo "Could not check MySQL service status"

echo ""
echo "📋 Checking MySQL processes..."
ps aux | grep mysql | grep -v grep || echo "No MySQL processes found"

echo ""
echo "📋 Testing different MySQL connection methods..."

echo ""
echo "1️⃣ Testing MySQL socket connection..."
mysql -u root -p -e "SELECT 1;" 2>/dev/null && echo "✅ Socket connection works" || echo "❌ Socket connection failed"

echo ""
echo "2️⃣ Testing MySQL TCP connection..."
mysql -u root -p -h 127.0.0.1 -e "SELECT 1;" 2>/dev/null && echo "✅ TCP connection works" || echo "❌ TCP connection failed"

echo ""
echo "3️⃣ Testing if MySQL is listening on port 3306..."
netstat -ln | grep :3306 || ss -ln | grep :3306 || echo "❌ MySQL not listening on port 3306"

echo ""
echo "4️⃣ Checking MySQL configuration files..."
if [ -f /etc/mysql/my.cnf ]; then
    echo "✅ Found /etc/mysql/my.cnf"
elif [ -f /etc/my.cnf ]; then
    echo "✅ Found /etc/my.cnf"
else
    echo "❓ MySQL config file not found in standard locations"
fi

echo ""
echo "5️⃣ Testing different MySQL users..."
echo "Trying to connect with various users..."

# Test with empty password
echo "Testing root with empty password..."
mysql -u root -e "SELECT 1;" 2>/dev/null && echo "✅ Root with empty password works" || echo "❌ Root with empty password failed"

echo ""
echo "6️⃣ Current .env.local database settings:"
if [ -f .env.local ]; then
    grep -E "^DB_" .env.local
else
    echo "❌ .env.local file not found"
fi

echo ""
echo "📝 Next steps to try:"
echo "===================="
echo "1. Check aaPanel MySQL root password"
echo "2. Try creating a new MySQL user in aaPanel"
echo "3. Check if MySQL service is running properly"
echo "4. Verify .env.local has correct credentials"

echo ""
echo "🔧 Quick fixes to try:"
echo "====================="
echo "# Reset MySQL root password in aaPanel"
echo "# Or create new user:"
echo "CREATE USER 'dashapp'@'localhost' IDENTIFIED BY 'password123';"
echo "GRANT ALL PRIVILEGES ON phc_dashboard.* TO 'dashapp'@'localhost';"
echo "FLUSH PRIVILEGES;" 