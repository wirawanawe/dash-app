#!/bin/bash

# Password Migration Script for PHC Mobile
# This script migrates existing plain text passwords to bcrypt hashed passwords

echo "🔐 PHC Mobile Password Migration Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the dash-app directory"
    exit 1
fi

# Check if bcryptjs is installed
if ! npm list bcryptjs > /dev/null 2>&1; then
    echo "📦 Installing bcryptjs..."
    npm install bcryptjs
fi

echo "🔄 Starting password migration..."
echo ""

# Run the migration script
node scripts/migrate-mobile-passwords.js

echo ""
echo "✅ Migration completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Test login with existing users to ensure passwords work"
echo "2. Monitor the application for any login issues"
echo "3. Check the migration summary above for any errors"
echo ""
echo "🔒 Security Note: All passwords are now securely hashed using bcrypt"
