# PHC Dashboard Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MySQL** (v8.0 or higher)
3. **Git**

## Quick Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd dash-app
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=phc_dashboard

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Configuration
NODE_ENV=development
```

### 3. Database Setup
```bash
# Initialize database and create tables
npm run db:setup

# Create superadmin user and sample data
npm run create-superadmin
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
Open your browser and go to: `http://localhost:3000`

## Login Credentials

### Superadmin (Full Access)
- **Email**: `superadmin@phc.com`
- **Password**: `superadmin123`

### Admin Users (Clinic-Specific Access)
- **Email**: `admin.klinikphcjakartapusat@phc.com`
- **Password**: `admin123`

Other admin emails:
- `admin.klinikphcbandung@phc.com`
- `admin.klinikphcsurabaya@phc.com`
- `admin.klinikphcmedan@phc.com`

## Troubleshooting

### Database Connection Issues
1. **Check MySQL Service**
   ```bash
   # On macOS/Linux
   sudo service mysql status
   # or
   brew services list | grep mysql
   ```

2. **Verify Database Credentials**
   ```bash
   mysql -u root -p
   ```

3. **Create Database Manually**
   ```sql
   CREATE DATABASE IF NOT EXISTS phc_dashboard;
   ```

### Permission Issues
1. **Check File Permissions**
   ```bash
   chmod +x scripts/*.js
   ```

2. **Verify Environment Variables**
   ```bash
   echo $DB_HOST
   echo $DB_USER
   echo $DB_PASSWORD
   ```

### Common Errors

#### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### "Access denied for user"
- Check MySQL user permissions
- Verify password in `.env` file
- Try creating a new MySQL user:
  ```sql
  CREATE USER 'phc_user'@'localhost' IDENTIFIED BY 'your_password';
  GRANT ALL PRIVILEGES ON phc_dashboard.* TO 'phc_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

#### "Table doesn't exist"
```bash
# Re-run database setup
npm run db:setup
```

## Development Workflow

### 1. Database Changes
When making database schema changes:
1. Update `init-scripts/01-create-tables.sql`
2. Run `npm run db:setup`
3. Test the changes

### 2. Adding New Features
1. Create API routes in `app/api/`
2. Add frontend components
3. Update sidebar navigation
4. Test with different user roles

### 3. User Management
- Superadmin can create/edit/delete all users
- Admin users can manage users within their scope
- Use the Users page to manage accounts

## Production Deployment

### 1. Environment Variables
Update `.env` for production:
```env
NODE_ENV=production
JWT_SECRET=your-very-secure-jwt-secret
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=phc_dashboard
```

### 2. Build Application
```bash
npm run build
npm start
```

### 3. Security Checklist
- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Set up proper firewall rules
- [ ] Regular database backups
- [ ] Monitor application logs

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Clinic Management
- `GET /api/clinics` - List clinics (filtered by role)
- `POST /api/clinics` - Create clinic (superadmin only)
- `PUT /api/clinics/[id]` - Update clinic
- `DELETE /api/clinics/[id]` - Delete clinic (superadmin only)

### User Management
- `GET /api/users` - List users (admin/superadmin only)
- `POST /api/users` - Create user (admin/superadmin only)
- `PUT /api/users/[id]` - Update user (admin/superadmin only)
- `DELETE /api/users/[id]` - Delete user (admin/superadmin only)

## Support

For technical support:
1. Check the troubleshooting section above
2. Review the logs in the console
3. Verify database connectivity
4. Check user permissions and roles

## File Structure

```
dash-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── clinics/           # Clinic management pages
│   ├── mobile/            # Mobile app management
│   └── ...
├── components/             # React components
├── lib/                   # Utility libraries
├── scripts/               # Setup scripts
├── init-scripts/          # Database initialization
└── README/                # Documentation
```

## Role-Based Access Control

### Superadmin
- Full system access
- Can manage all clinics and users
- Access to all features

### Admin
- Clinic-specific access
- Can manage their assigned clinic
- Access to mobile app management

### Doctor
- Medical staff access
- Patient and visit management
- Chat functionality

### Staff
- Basic access
- Limited feature access
- Patient information viewing 