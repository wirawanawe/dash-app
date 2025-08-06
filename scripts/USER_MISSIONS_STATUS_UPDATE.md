# User Missions Status Update

This system automatically updates the status of active `user_missions` to `completed` when the date changes from the `created_at` date.

## Overview

When a user mission is created, it starts with status `active`. The system automatically changes this status to `completed` when the current date is different from the date when the mission was created (`created_at`).

## Files

### 1. `update-user-missions-status.js`
Main script that performs the status update logic.

**Features:**
- Connects to the database using environment variables
- Finds all active user_missions where the created_at date is different from current date
- Updates status to 'completed' and sets completed_at timestamp
- Provides detailed logging of updated missions
- Shows summary statistics

### 2. `run-user-missions-update.sh`
Shell script wrapper to run the update script with proper error handling.

### 3. `setup-cron-job.sh`
Script to set up automatic daily execution via cron job.

## Usage

### Manual Execution

To run the update manually:

```bash
cd dash-app
./scripts/run-user-missions-update.sh
```

Or run the Node.js script directly:

```bash
cd dash-app
node scripts/update-user-missions-status.js
```

### Automatic Execution (Recommended)

Set up a cron job to run daily at 1:00 AM:

```bash
cd dash-app
./scripts/setup-cron-job.sh
```

This will:
- Add a cron job that runs daily at 1:00 AM
- Log output to `/var/log/user-missions-update.log`
- Handle existing cron jobs gracefully

### Viewing Logs

Check the cron job logs:

```bash
tail -f /var/log/user-missions-update.log
```

## Database Changes

The script updates the following fields in the `user_missions` table:

- `status`: Changed from 'active' to 'completed'
- `completed_at`: Set to current timestamp
- `updated_at`: Updated to current timestamp

## Query Logic

The update query finds missions that meet these criteria:
- `status = 'active'`
- `DATE(created_at) != current_date`
- `DATE(created_at) < current_date`

## Environment Variables

The script uses these environment variables (with defaults):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=phc_mobile
DB_PORT=3306
```

## Monitoring

The script provides detailed output including:

1. **Update Summary**: Number of missions updated
2. **Detailed Log**: List of updated missions with user and mission details
3. **Statistics**: Current count of missions by status

Example output:
```
Starting user missions status update...
Database connected successfully
Current date: 2024-01-15
Updated 5 user missions from active to completed

Updated missions details:
1. User: John Doe (ID: 123)
   Mission: Daily Exercise (ID: 456)
   Created: 2024-01-14 10:30:00
   Completed: 2024-01-15 01:00:00
---

Current user missions status summary:
active: 15
completed: 25
expired: 3
cancelled: 2
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check `.env` file exists and has correct database credentials
   - Verify database server is running

2. **Permission Denied**
   - Make sure scripts are executable: `chmod +x scripts/*.sh`

3. **Cron Job Not Running**
   - Check cron service is running: `sudo service cron status`
   - Verify cron job exists: `crontab -l`
   - Check logs: `tail -f /var/log/user-missions-update.log`

### Testing

To test the script with sample data:

```bash
# Create test missions with old dates
mysql -u root -p phc_mobile -e "
INSERT INTO user_missions (user_id, mission_id, status, created_at) 
VALUES (1, 1, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY));
"

# Run the update script
./scripts/run-user-missions-update.sh

# Verify the update
mysql -u root -p phc_mobile -e "
SELECT id, status, created_at, completed_at 
FROM user_missions 
WHERE status = 'completed' 
ORDER BY completed_at DESC 
LIMIT 5;
"
```

## Security Considerations

1. **Database Access**: The script requires database read/write access
2. **Log Files**: Ensure log files are properly secured
3. **Environment Variables**: Keep database credentials secure
4. **Cron Permissions**: Ensure cron has proper permissions to execute the script

## Maintenance

### Regular Tasks

1. **Monitor Logs**: Check for errors in `/var/log/user-missions-update.log`
2. **Review Statistics**: Monitor the distribution of mission statuses
3. **Database Cleanup**: Consider archiving old completed missions periodically

### Performance

The script is optimized for:
- Minimal database load
- Efficient date comparisons
- Detailed logging for monitoring
- Graceful error handling

## Support

For issues or questions:
1. Check the logs first
2. Verify database connectivity
3. Test with manual execution
4. Review the troubleshooting section above 