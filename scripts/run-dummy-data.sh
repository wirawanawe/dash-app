#!/bin/bash

# Script to add dummy data to PHC Dashboard database
# This script will add comprehensive dummy data to all tables

echo "🚀 Starting PHC Dashboard Dummy Data Setup..."
echo "=============================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the dash-app directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if mysql2 is installed
if ! node -e "require('mysql2')" &> /dev/null; then
    echo "📦 Installing mysql2 package..."
    npm install mysql2
fi

# Set default database configuration if not provided
export DB_HOST=${DB_HOST:-localhost}
export DB_USER=${DB_USER:-root}
export DB_PASSWORD=${DB_PASSWORD:-}
export DB_NAME=${DB_NAME:-phc_dashboard}
export DB_PORT=${DB_PORT:-3306}

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo "   Port: $DB_PORT"
echo ""

# Check if database exists
echo "🔍 Checking database connection..."
if node -e "
const mysql = require('mysql2/promise');
async function checkDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });
    await connection.execute('USE ' + process.env.DB_NAME);
    console.log('✅ Database connection successful');
    await connection.end();
  } catch (error) {
    console.log('❌ Database connection failed: ' + error.message);
    process.exit(1);
  }
}
checkDB();
"; then
    echo "✅ Database connection verified!"
else
    echo "❌ Failed to connect to database. Please check your database configuration."
    echo ""
    echo "💡 You can set database configuration using environment variables:"
    echo "   export DB_HOST=your_host"
    echo "   export DB_USER=your_user"
    echo "   export DB_PASSWORD=your_password"
    echo "   export DB_NAME=your_database"
    echo "   export DB_PORT=your_port"
    echo ""
    exit 1
fi

echo ""
echo "📥 Adding dummy data to database..."
echo "====================================="

# Run the dummy data script
node scripts/add-dummy-data.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Dummy data setup completed successfully!"
    echo ""
    echo "📋 What was added:"
    echo "   • Clinics, Doctors, Polyclinics"
    echo "   • Insurance companies and Companies"
    echo "   • Treatments and ICD codes"
    echo "   • Patients, Visits, and Examinations"
    echo "   • Food database items"
    echo "   • Missions and User missions"
    echo "   • Wellness activities and tracking data"
    echo "   • Chat and consultation data"
    echo "   • Health data and assessments"
    echo ""
    echo "🔗 You can now access the dashboard with:"
    echo "   • Super Admin: superadmin@phc.com / password"
    echo "   • Admin: admin.jakarta@phc.com / password"
    echo "   • Staff: staff.bandung@phc.com / password"
    echo ""
    echo "📱 Mobile app data is also available for user_id 1"
    echo ""
else
    echo ""
    echo "❌ Failed to add dummy data. Please check the error messages above."
    exit 1
fi 