#!/bin/bash

# Wellness Program Reset Cron Job Script
# This script resets expired wellness programs automatically

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Set environment variables (adjust these according to your setup)
export DB_HOST=${DB_HOST:-"localhost"}
export DB_USER=${DB_USER:-"root"}
export DB_PASSWORD=${DB_PASSWORD:-"pr1k1t1w"}
export DB_NAME=${DB_NAME:-"phc_dashboard"}
export DB_PORT=${DB_PORT:-"3306"}

# Log file for cron job output
LOG_FILE="$PROJECT_DIR/logs/wellness-reset-cron.log"
LOG_DIR="$(dirname "$LOG_FILE")"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start logging
log_message "🔄 Starting wellness program reset cron job..."

# Change to project directory
cd "$PROJECT_DIR" || {
    log_message "❌ Failed to change to project directory: $PROJECT_DIR"
    exit 1
}

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log_message "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the reset script exists
RESET_SCRIPT="$SCRIPT_DIR/reset-expired-wellness-programs.js"
if [ ! -f "$RESET_SCRIPT" ]; then
    log_message "❌ Reset script not found: $RESET_SCRIPT"
    exit 1
fi

# Run the reset script
log_message "📋 Executing wellness program reset..."
node "$RESET_SCRIPT" 2>&1 | tee -a "$LOG_FILE"

# Check exit status
EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -eq 0 ]; then
    log_message "✅ Wellness program reset completed successfully"
else
    log_message "❌ Wellness program reset failed with exit code: $EXIT_CODE"
fi

# Clean up old log files (keep last 30 days)
find "$LOG_DIR" -name "wellness-reset-cron.log" -type f -mtime +30 -delete 2>/dev/null

log_message "🏁 Wellness program reset cron job finished"
exit $EXIT_CODE
