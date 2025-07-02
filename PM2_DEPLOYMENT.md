# PM2 Deployment Guide for Dash App

This guide covers deploying the Next.js dash-app using PM2 (Process Manager 2).

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PM2 installed globally

## Quick Setup

### 1. Install PM2 and Setup Application

```bash
# Make the installation script executable
chmod +x install-pm2.sh

# Run the installation script
./install-pm2.sh
```

### 2. Manual Setup (Alternative)

```bash
# Install PM2 globally
npm install -g pm2

# Install project dependencies
npm install

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Management Commands

### Using npm scripts:

```bash
# Start the application
npm run pm2:start

# Stop the application
npm run pm2:stop

# Restart the application
npm run pm2:restart

# Reload the application (zero downtime)
npm run pm2:reload

# Check application status
npm run pm2:status

# View logs
npm run pm2:logs

# Deploy (build and reload)
npm run deploy
```

### Using the PM2 commands script:

```bash
# Make the script executable
chmod +x pm2-commands.sh

# Use the commands
./pm2-commands.sh start
./pm2-commands.sh stop
./pm2-commands.sh restart
./pm2-commands.sh reload
./pm2-commands.sh logs
./pm2-commands.sh status
./pm2-commands.sh update
```

## PM2 Configuration

The `ecosystem.config.js` file contains the PM2 configuration:

- **Application Name**: dash-app
- **Script**: npm start (Next.js production server)
- **Instances**: 1 (can be increased for load balancing)
- **Memory Limit**: 1GB
- **Auto Restart**: Enabled
- **Logs**: Saved to `./logs/` directory

## Environment Variables

Make sure to set up your environment variables:

```bash
# Create .env.production file
NODE_ENV=production
PORT=3000
JWT_SECRET=your-jwt-secret
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

## Monitoring

### View Application Status

```bash
pm2 list
```

### View Logs

```bash
pm2 logs dash-app
pm2 logs dash-app --lines 50
```

### Monitor Resources

```bash
pm2 monit
```

### Flush Logs

```bash
pm2 flush
```

## Auto-Deployment

The ecosystem.config.js includes deployment configuration. Update the deploy section with your server details:

```javascript
deploy: {
  production: {
    user: 'your-username',
    host: 'your-server-ip',
    ref: 'origin/master',
    repo: 'your-git-repository',
    path: '/path/to/deployment',
    'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
  }
}
```

Then deploy with:

```bash
pm2 deploy production setup
pm2 deploy production
```

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs dash-app`
2. Verify build completed: `npm run build`
3. Check environment variables
4. Ensure database is accessible

### High Memory Usage

1. Monitor with: `pm2 monit`
2. Adjust `max_memory_restart` in ecosystem.config.js
3. Consider enabling clustering (increase instances)

### Process Keeps Restarting

1. Check error logs: `pm2 logs dash-app --err`
2. Verify all dependencies are installed
3. Check database connection
4. Review application code for uncaught exceptions

## Best Practices

1. **Always build before deployment**: `npm run build`
2. **Use reload instead of restart** for zero downtime: `pm2 reload dash-app`
3. **Monitor logs regularly**: `pm2 logs dash-app`
4. **Save PM2 configuration**: `pm2 save`
5. **Setup startup script** for auto-start on server reboot: `pm2 startup`
6. **Regular backups** of your PM2 configuration and application data

## Commands Reference

| Command                         | Description                        |
| ------------------------------- | ---------------------------------- |
| `pm2 start ecosystem.config.js` | Start application                  |
| `pm2 stop dash-app`             | Stop application                   |
| `pm2 restart dash-app`          | Restart application                |
| `pm2 reload dash-app`           | Reload application (zero downtime) |
| `pm2 delete dash-app`           | Remove application from PM2        |
| `pm2 list`                      | Show all running applications      |
| `pm2 logs dash-app`             | Show application logs              |
| `pm2 monit`                     | Open monitoring dashboard          |
| `pm2 save`                      | Save current PM2 configuration     |
| `pm2 resurrect`                 | Restore saved PM2 configuration    |
| `pm2 startup`                   | Setup PM2 to start on system boot  |
