# Superadmin System Documentation

## Overview

The PHC Dashboard now includes a comprehensive role-based access control system with Superadmin functionality. This system allows for different levels of access based on user roles and clinic assignments.

## User Roles

### 1. Superadmin
- **Access Level**: Full system access
- **Capabilities**:
  - Access all features and data across all clinics
  - Create, edit, and delete clinics
  - Manage all users (create, edit, delete)
  - Access all mobile app management features
  - View all patient data, visits, and medical records
  - Manage system settings and configurations

### 2. Admin
- **Access Level**: Clinic-specific access
- **Capabilities**:
  - Access features related to their assigned clinic only
  - View and manage patients within their clinic
  - Manage doctors and staff within their clinic
  - Access mobile app management features
  - Cannot create or delete clinics
  - Cannot access other clinics' data

### 3. Doctor
- **Access Level**: Medical staff access
- **Capabilities**:
  - View and manage patient visits
  - Access patient medical records
  - Use doctor chat functionality
  - View laboratory results
  - Cannot access administrative features

### 4. Staff
- **Access Level**: Basic access
- **Capabilities**:
  - View patient information
  - Basic data entry
  - Limited access to features

## Database Schema Updates

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'doctor', 'staff') NOT NULL DEFAULT 'staff',
  clinic_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_clinic_id (clinic_id)
);
```

### Clinics Table (Updated)
```sql
CREATE TABLE clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  operating_hours JSON,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_city (city),
  INDEX idx_is_active (is_active)
);
```

## Setup Instructions

### 1. Database Setup
Run the updated database initialization script:
```bash
npm run db:setup
```

### 2. Create Superadmin and Sample Data
```bash
npm run create-superadmin
```

This will create:
- Superadmin user with credentials
- Sample clinics
- Admin users for each clinic

### 3. Login Credentials

#### Superadmin
- **Email**: `superadmin@phc.com`
- **Password**: `superadmin123`

#### Admin Users (for each clinic)
- **Email**: `admin.[clinicname]@phc.com`
- **Password**: `admin123`

Example admin emails:
- `admin.klinikphcjakartapusat@phc.com`
- `admin.klinikphcbandung@phc.com`
- `admin.klinikphcsurabaya@phc.com`
- `admin.klinikphcmedan@phc.com`

## Access Control Implementation

### 1. Authentication Middleware
The system uses JWT-based authentication with role-based access control:

```javascript
// Middleware checks user role and clinic assignment
if (userRole === "SUPERADMIN") {
  // Full access
} else if (userRole === "ADMIN" && userClinicId) {
  // Clinic-specific access
}
```

### 2. API Route Protection
API routes check user permissions before allowing access:

```javascript
// Example: Clinics API
if (userPayload.role === "SUPERADMIN") {
  // Can see all clinics
} else if (userPayload.role === "ADMIN" && userPayload.clinic_id) {
  // Can only see their assigned clinic
}
```

### 3. Frontend Route Protection
The middleware redirects users based on their role:

```javascript
// Settings access - only superadmin and admin
if (pathname.startsWith("/settings") && userRole !== "ADMIN") {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

## Clinic Management

### Superadmin Capabilities
- Create new clinics with full details
- Edit any clinic information
- Delete clinics
- View all clinics in the system
- Assign admins to clinics

### Admin Capabilities
- View only their assigned clinic
- Edit their clinic's information
- Cannot create or delete clinics
- Cannot access other clinics' data

## Mobile App Management

### Superadmin Access
- Full access to all mobile app features
- Manage all mobile users
- View all food database entries
- Manage all missions and wellness activities
- Access all health data

### Admin Access
- Access to mobile app management features
- Limited to their clinic's scope (if applicable)

## Security Features

### 1. Role-Based Access Control
- Each user has a specific role
- Access is restricted based on role
- Clinic-specific access for admins

### 2. Session Management
- JWT-based authentication
- Session timeout after 24 hours
- Automatic logout on inactivity

### 3. Data Isolation
- Admin users can only access their assigned clinic
- Patient data is filtered by clinic
- Visit records are clinic-specific

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Clinics
- `GET /api/clinics` - Get clinics (filtered by role)
- `POST /api/clinics` - Create clinic (superadmin only)
- `PUT /api/clinics/[id]` - Update clinic
- `DELETE /api/clinics/[id]` - Delete clinic (superadmin only)

### Users
- `GET /api/users` - Get users (admin/superadmin only)
- `POST /api/users` - Create user (admin/superadmin only)
- `PUT /api/users/[id]` - Update user (admin/superadmin only)
- `DELETE /api/users/[id]` - Delete user (admin/superadmin only)

## Troubleshooting

### Common Issues

1. **User cannot access features**
   - Check user role in database
   - Verify clinic assignment for admin users
   - Check if user is active

2. **Clinic data not showing**
   - Verify user's clinic_id assignment
   - Check if clinic is active
   - Ensure proper role permissions

3. **Login issues**
   - Verify email and password
   - Check if user account is active
   - Clear browser cookies and try again

### Database Queries

Check user role and clinic assignment:
```sql
SELECT id, name, email, role, clinic_id, is_active 
FROM users 
WHERE email = 'user@example.com';
```

Check clinic information:
```sql
SELECT * FROM clinics WHERE id = 1;
```

## Migration Notes

### From Previous Version
1. Update database schema with new tables
2. Run the superadmin creation script
3. Update existing users with proper roles
4. Assign clinic_id to admin users

### Data Migration
- Existing users will need role updates
- Clinic data needs to be migrated to new structure
- Mobile app data remains separate

## Best Practices

1. **Security**
   - Regularly update passwords
   - Use strong passwords
   - Monitor user access logs

2. **User Management**
   - Assign appropriate roles
   - Regularly review user access
   - Deactivate unused accounts

3. **Data Management**
   - Regular backups
   - Monitor clinic assignments
   - Validate data integrity

## Support

For technical support or questions about the Superadmin system, please contact the development team or refer to the API documentation. 