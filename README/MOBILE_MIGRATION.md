# Mobile Database Migration Guide

## Overview

This guide explains how to migrate all mobile app tables from the `phc_mobile` database to the `phc_dashboard` database. This consolidation allows for better data management and eliminates the need for separate databases.

## Migration Process

### Prerequisites

1. **MySQL Server**: Ensure MySQL is running and accessible
2. **Database Access**: User must have CREATE, INSERT, and SELECT privileges
3. **Environment Variables**: Set up database connection variables

### Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phc_dashboard
```

### Running the Migration

#### Option 1: Using npm script (Recommended)

```bash
npm run migrate:mobile
```

#### Option 2: Direct execution

```bash
node scripts/migrate-mobile-to-dashboard.js
```

#### Option 3: Manual SQL execution

```bash
mysql -u root -p < init-scripts/12-migrate-mobile-to-dashboard.sql
```

## What Gets Migrated

The migration script will create and populate the following tables in `phc_dashboard`:

### Core Tables
1. **`food_database`** - Food items and nutritional information
2. **`mobile_users`** - Mobile app users (migrated from `users` table)
3. **`missions`** - Wellness missions and challenges
4. **`user_missions`** - User progress on missions
5. **`wellness_activities`** - Wellness activities and exercises

### Tracking Tables
6. **`health_data`** - Health metrics and measurements
7. **`sleep_tracking`** - Sleep data and quality metrics
8. **`mood_tracking`** - Mood and stress level tracking
9. **`water_tracking`** - Water intake tracking
10. **`user_water_settings`** - User water consumption goals
11. **`meal_logging`** - Food consumption logging
12. **`fitness_tracking`** - Exercise and fitness activities
13. **`user_quick_foods`** - User's favorite foods for quick logging

### Communication Tables
14. **`chats`** - Chat sessions between users and doctors
15. **`chat_messages`** - Individual chat messages
16. **`consultations`** - Medical consultation records
17. **`assessments`** - Health assessment results

## Migration Features

### Safe Migration
- **`CREATE TABLE IF NOT EXISTS`**: Tables are only created if they don't exist
- **`INSERT IGNORE`**: Data is only inserted if it doesn't already exist
- **Foreign Key Constraints**: Proper relationships are maintained
- **Indexes**: Performance indexes are created for optimal query performance

### Data Integrity
- **Primary Keys**: All tables maintain their original primary keys
- **Foreign Keys**: Relationships between tables are preserved
- **Data Types**: Original data types and constraints are maintained
- **Timestamps**: Created and updated timestamps are properly set

### Error Handling
- **Graceful Failures**: Individual statement failures don't stop the entire migration
- **Error Reporting**: Detailed error messages for troubleshooting
- **Progress Tracking**: Shows which statements executed successfully

## Migration Output

The script provides detailed output including:

```
🚀 Starting migration from phc_mobile to phc_dashboard...
✅ Connected to MySQL server
✅ phc_mobile database found
✅ phc_dashboard database already exists
📋 Executing migration script...
✅ Migration completed!
📊 Executed 45 statements successfully

📈 Migration Results:
   Food Database: 342 records
   Mobile Users: 1247 records
   Missions: 156 records
   User Missions: 892 records
   Wellness Activities: 24 records
   Health Data: 2156 records
   Sleep Tracking: 1893 records
   Mood Tracking: 1247 records
   Water Tracking: 2156 records
   User Water Settings: 1247 records
   Meal Logging: 3421 records
   Fitness Tracking: 1893 records
   User Quick Foods: 1247 records
   Chats: 156 records
   Chat Messages: 892 records
   Consultations: 156 records
   Assessments: 1247 records

🎉 Migration completed successfully!
```

## Post-Migration Steps

### 1. Update Application Configuration

Update your application to use the `phc_dashboard` database:

```javascript
// In your database configuration
const config = {
  database: 'phc_dashboard', // Changed from 'phc_mobile'
  // ... other config
};
```

### 2. Test Functionality

Verify that all mobile app features work correctly:

- User authentication
- Food database queries
- Mission tracking
- Health data recording
- Chat functionality
- Consultation booking

### 3. Update API Routes

Ensure all mobile API routes are pointing to the correct database tables:

```javascript
// Example: Update mobile users API
const users = await query('SELECT * FROM mobile_users WHERE is_active = ?', [true]);
```

### 4. Backup and Cleanup

After successful migration and testing:

1. **Backup**: Create a backup of the original `phc_mobile` database
2. **Verify**: Ensure all data is accessible in the new location
3. **Remove**: Consider removing the old `phc_mobile` database

```sql
-- Create backup (optional)
CREATE DATABASE phc_mobile_backup AS SELECT * FROM phc_mobile;

-- Remove old database (after verification)
DROP DATABASE phc_mobile;
```

## Troubleshooting

### Common Issues

#### 1. Connection Errors
```
❌ Migration failed: connect ECONNREFUSED
```
**Solution**: Check MySQL server status and connection credentials

#### 2. Permission Errors
```
❌ Error executing statement: ER_ACCESS_DENIED_ERROR
```
**Solution**: Ensure database user has sufficient privileges

#### 3. Table Already Exists
```
⚠️  Some statements had errors (likely due to existing data)
```
**Solution**: This is normal if tables already exist. Data will be preserved.

#### 4. Foreign Key Constraints
```
❌ Error executing statement: ER_NO_REFERENCED_ROW_2
```
**Solution**: Ensure referenced tables exist before creating dependent tables

### Recovery Options

If migration fails:

1. **Rollback**: Drop the `phc_dashboard` database and start over
2. **Partial Migration**: Run individual table migrations manually
3. **Data Verification**: Check data integrity after migration

## Performance Considerations

### Indexes
The migration creates indexes for optimal performance:
- User lookups by email and phone
- Date-based queries for tracking data
- Foreign key relationships

### Data Volume
For large datasets:
- Consider running migration during low-traffic periods
- Monitor database performance during migration
- Use `LIMIT` clauses for large table migrations

## Support

If you encounter issues during migration:

1. Check the error logs for specific error messages
2. Verify database connectivity and permissions
3. Ensure all prerequisites are met
4. Review the migration script for any syntax errors

## Files

- **Migration Script**: `init-scripts/12-migrate-mobile-to-dashboard.sql`
- **Node.js Runner**: `scripts/migrate-mobile-to-dashboard.js`
- **Package Script**: `npm run migrate:mobile`
- **Documentation**: `README/MOBILE_MIGRATION.md` 