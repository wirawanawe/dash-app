# PM2 Deployment Guide

## Overview

This guide covers deploying the dash-app application using PM2 process manager for production environments.

## Prerequisites

1. **Node.js** (version 18+ recommended)
2. **PM2** installed globally
3. **MySQL** database running
4. **Git** for version control

## Installation

### 1. Install PM2 Globally

```bash
npm install -g pm2
```

### 2. Install Project Dependencies

```bash
npm ci
```

### 3. Setup Environment Variables

Create a `.env.production` file with your production configuration:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=phc_dashboard
JWT_SECRET=your_jwt_secret
```

## Deployment Commands

### Quick Deploy

```bash
# Build and deploy in one command
./deploy.sh
```

### Manual Deploy Steps

```bash
# 1. Build the application
npm run build

# 2. Start with PM2
pm2 start ecosystem.config.cjs --env production

# 3. Save PM2 configuration
pm2 save
```

## PM2 Management Commands

### Using npm scripts:

```bash
npm run pm2:prod      # Start in production mode
npm run pm2:stop      # Stop the application
npm run pm2:restart   # Restart the application
npm run pm2:logs      # View logs
npm run pm2:status    # Check status
npm run deploy        # Build and reload
```

### Using the management script:

```bash
./pm2-commands.sh start     # Start application
./pm2-commands.sh stop      # Stop application
./pm2-commands.sh restart   # Restart application
./pm2-commands.sh reload    # Zero-downtime reload
./pm2-commands.sh logs      # View logs
./pm2-commands.sh status    # Check status
./pm2-commands.sh monitor   # Open monitoring dashboard
```

### Direct PM2 commands:

```bash
pm2 status                  # Show all processes
pm2 logs dash-app          # Show logs
pm2 restart dash-app       # Restart app
pm2 reload dash-app        # Zero-downtime restart
pm2 stop dash-app          # Stop app
pm2 delete dash-app        # Remove app from PM2
pm2 monit                  # Open monitoring dashboard
```

## Configuration Files

### ecosystem.config.cjs

Main PM2 configuration file with:

- Application settings
- Environment variables
- Logging configuration
- Resource limits
- Restart policies

### server.js

Custom server with:

- Graceful shutdown handling
- Error handling
- PM2 integration signals
- Process management

## Monitoring and Logs

### Log Files Location

- Combined logs: `./logs/pm2-combined.log`
- Error logs: `./logs/pm2-error.log`
- Output logs: `./logs/pm2-out.log`

### Monitoring Commands

```bash
pm2 status              # Quick status overview
pm2 monit              # Real-time monitoring
pm2 logs dash-app      # Follow logs
pm2 describe dash-app  # Detailed process info
```

## Production Best Practices

### 1. Environment Setup

- Use `.env.production` for production variables
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper database credentials

### 2. Process Management

- Use `pm2 reload` for zero-downtime deployments
- Monitor memory usage and set restart limits
- Enable auto-restart on crashes
- Save PM2 configuration with `pm2 save`

### 3. Security

- Run PM2 as non-root user when possible
- Use proper firewall rules
- Keep dependencies updated
- Use HTTPS in production

### 4. Performance

- Adjust memory limits based on server capacity
- Monitor CPU and memory usage
- Use clustering for high-traffic applications
- Implement proper caching strategies

## Troubleshooting

### Common Issues

1. **Application not starting:**

   ```bash
   pm2 logs dash-app --lines 50
   ```

2. **Memory issues:**

   ```bash
   pm2 describe dash-app
   ```

3. **Database connection errors:**

   - Check database credentials
   - Verify database server is running
   - Check network connectivity

4. **Port already in use:**
   ```bash
   pm2 delete dash-app
   pm2 start ecosystem.config.cjs --env production
   ```

### Health Checks

```bash
# Check if application is responding
curl http://localhost:3000

# Check PM2 process status
pm2 status

# Check logs for errors
pm2 logs dash-app --err --lines 20
```

## Backup and Recovery

### Save Current Configuration

```bash
pm2 save
```

### Restore Configuration

```bash
pm2 resurrect
```

### Startup Script (Auto-start on boot)

```bash
pm2 startup
# Follow the instructions shown
pm2 save
```

## Scripts Reference

| Script              | Description             |
| ------------------- | ----------------------- |
| `./deploy.sh`       | Full deployment script  |
| `./pm2-commands.sh` | PM2 management commands |
| `./install-pm2.sh`  | PM2 installation script |

## Support

For issues or questions:

1. Check the logs: `pm2 logs dash-app`
2. Review the configuration: `pm2 describe dash-app`
3. Check the troubleshooting section above
4. Contact the development team
