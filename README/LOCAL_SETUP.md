# Local Setup Guide (No Docker)

This guide will help you set up the PHC Dashboard application using local MySQL instead of Docker.

## Prerequisites

### 1. Install MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
- Download MySQL installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Follow the installation wizard

### 2. Verify MySQL Installation

Test your MySQL connection:
```bash
mysql -u root -p
```

If you don't have a password set, just press Enter when prompted.

## Setup Steps

### 1. Clone and Install Dependencies

```bash
cd dash-app
npm install
```

### 2. Create Environment File

Create a `.env` file in the dash-app directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=phc_dashboard

# JWT Secret
JWT_SECRET=supersecretkey123456789supersecretkey123456789

# Application Configuration
NODE_ENV=development
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Note:** If your MySQL has a password, add it to `DB_PASSWORD`.

### 3. Setup Database

Run the complete setup:
```bash
npm run full-setup
```

This will:
- Connect to your local MySQL
- Create the database
- Create all necessary tables
- Add sample data

### 4. Verify Setup

Check if everything is working:
```bash
npm run check-db
```

### 5. Start Application

```bash
npm run dev
```

### 6. Test API

Test the meal tracking API:
```bash
npm run test-meal-tracking
```

## Available Scripts

- `npm run full-setup` - Complete database setup
- `npm run check-db` - Check database connection
- `npm run setup-complete-db` - Setup database tables only
- `npm run test-meal-tracking` - Test meal tracking API
- `npm run dev` - Start development server

## Troubleshooting

### MySQL Connection Issues

1. **MySQL not running:**
   ```bash
   # macOS
   brew services start mysql
   
   # Ubuntu
   sudo systemctl start mysql
   ```

2. **Wrong credentials:**
   - Check your `.env` file
   - Try connecting manually: `mysql -u root -p`

3. **Permission denied:**
   ```bash
   # Create a new MySQL user
   mysql -u root -p
   CREATE USER 'phc_user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON phc_dashboard.* TO 'phc_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Database Issues

1. **Tables not created:**
   ```bash
   npm run setup-complete-db
   ```

2. **Database doesn't exist:**
   ```bash
   npm run full-setup
   ```

### Application Issues

1. **Port 3000 in use:**
   - Change PORT in `.env` file
   - Or kill the process using port 3000

2. **Module not found:**
   ```bash
   npm install
   ```

## Default Login

After setup, you can login with:
- **Email:** superadmin@phc.com
- **Password:** superadmin123

## API Testing

Test the meal tracking API:
```bash
curl "http://localhost:3000/api/mobile/tracking/meal/today?user_id=1"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "totals": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "meal_count": 0,
      "food_count": 0
    },
    "meals_by_type": {},
    "recommended": {
      "calories": 2000,
      "protein": 50,
      "carbs": 250,
      "fat": 65
    },
    "percentages": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    },
    "meal_types": []
  }
}
```

## Next Steps

1. Explore the dashboard at http://localhost:3000
2. Test all mobile app features
3. Add more sample data if needed
4. Configure production settings 