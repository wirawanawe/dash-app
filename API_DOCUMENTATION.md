# API Documentation

## Authentication Endpoints

### GET /api/auth/me
Get current user information
- **Response**: User object with id, name, email, role, clinic_id
- **Authentication**: Required (via cookies)

### POST /api/auth/login
Login user
- **Body**: { email, password }
- **Response**: { token, user }
- **Authentication**: Not required

### POST /api/auth/logout
Logout user
- **Response**: { message: "Logged out successfully" }
- **Authentication**: Required

### POST /api/auth/register
Register new user
- **Body**: { name, email, password, role }
- **Response**: { user }
- **Authentication**: Not required

## Users Management API

### GET /api/users
Get all users with pagination and filtering
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `search` (string): Search by name or email
  - `role` (string): Filter by role (SUPERADMIN, ADMIN, DOCTOR, STAFF)
- **Response**: 
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "User Name",
        "email": "user@example.com",
        "role": "ADMIN",
        "clinic_id": 1,
        "is_active": true,
        "created_at": "2025-07-28T06:26:51.000Z",
        "updated_at": "2025-07-28T06:26:51.000Z",
        "clinic_name": "Klinik Name"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 11,
      "totalPages": 2
    }
  }
  ```
- **Authentication**: Required (ADMIN or SUPERADMIN)

### GET /api/users/[id]
Get specific user by ID
- **Response**: User object
- **Authentication**: Required (ADMIN or SUPERADMIN)

### POST /api/users
Create new user
- **Body**: 
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123",
    "role": "ADMIN",
    "clinic_id": 1,
    "is_active": true
  }
  ```
- **Response**: Created user object
- **Authentication**: Required (ADMIN or SUPERADMIN)

### PUT /api/users/[id]
Update user
- **Body**: Same as POST (all fields optional)
- **Response**: Updated user object
- **Authentication**: Required (ADMIN or SUPERADMIN)

### DELETE /api/users/[id]
Delete user
- **Response**: { message: "Pengguna berhasil dihapus" }
- **Authentication**: Required (ADMIN or SUPERADMIN)

## Patients API

### GET /api/patients
Get all patients with pagination and search
- **Query Parameters**:
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `search` (string): Search by name, NIK, or MR number
- **Response**: 
  ```json
  {
    "data": [
      {
        "id": 1,
        "mrn": "MR001",
        "name": "Patient Name",
        "nik": "1234567890123456",
        "birthDate": "1990-01-01",
        "gender": "L",
        "nip": "123456789",
        "status": "Active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
  ```

### GET /api/patients/[id]
Get specific patient by ID
- **Response**: Patient object with full details

### POST /api/patients
Create new patient
- **Body**: Patient data
- **Response**: Created patient object

### PUT /api/patients/[id]
Update patient
- **Body**: Patient data
- **Response**: Updated patient object

### DELETE /api/patients/[id]
Delete patient
- **Response**: { message: "Patient deleted successfully" }

## Settings API

### GET /api/settings/clinics
Get all clinics
- **Response**: Array of clinic objects

### GET /api/settings/doctors
Get all doctors
- **Response**: Array of doctor objects

### GET /api/settings/companies
Get all companies
- **Response**: Array of company objects

### GET /api/settings/insurance
Get all insurance providers
- **Response**: Array of insurance objects

### GET /api/settings/treatments
Get all treatments
- **Response**: Array of treatment objects

### GET /api/settings/icd
Get all ICD codes
- **Response**: Array of ICD objects

### GET /api/settings/users
Get all users (for settings)
- **Response**: Array of user objects

## Mobile API

### GET /api/mobile/users
Get mobile users
- **Response**: Array of mobile user objects

### GET /api/mobile/food
Get food data
- **Response**: Array of food objects

### GET /api/mobile/health_data
Get health data
- **Response**: Array of health data objects

### GET /api/mobile/missions
Get missions
- **Response**: Array of mission objects

### GET /api/mobile/mood_tracking
Get mood tracking data
- **Response**: Array of mood tracking objects

### GET /api/mobile/sleep_tracking
Get sleep tracking data
- **Response**: Array of sleep tracking objects

### GET /api/mobile/user_missions
Get user missions
- **Response**: Array of user mission objects



## Chat API

### GET /api/chat
Get chat conversations
- **Response**: Array of chat objects

### GET /api/chat/[id]
Get specific chat conversation
- **Response**: Chat conversation object

### GET /api/chat/users
Get chat users
- **Response**: Array of chat user objects

## Visits API

### GET /api/visits
Get all visits
- **Response**: Array of visit objects

### GET /api/visits/[id]
Get specific visit
- **Response**: Visit object

### POST /api/visits
Create new visit
- **Body**: Visit data
- **Response**: Created visit object

### PUT /api/visits/[id]
Update visit
- **Body**: Visit data
- **Response**: Updated visit object

### DELETE /api/visits/[id]
Delete visit
- **Response**: { message: "Visit deleted successfully" }

## Examinations API

### GET /api/examinations
Get all examinations
- **Response**: Array of examination objects

### GET /api/examinations/[id]
Get specific examination
- **Response**: Examination object

### POST /api/examinations
Create new examination
- **Body**: Examination data
- **Response**: Created examination object

### PUT /api/examinations/[id]
Update examination
- **Body**: Examination data
- **Response**: Updated examination object

### DELETE /api/examinations/[id]
Delete examination
- **Response**: { message: "Examination deleted successfully" }

## Laboratory API

### GET /api/laboratory/results
Get laboratory results
- **Response**: Array of laboratory result objects

## Regional Data API

### GET /api/regions/provinces
Get all provinces
- **Response**: Array of province objects

### GET /api/regions/cities
Get cities by province
- **Query Parameters**:
  - `province_id` (number): Province ID
- **Response**: Array of city objects

### GET /api/regions/districts
Get districts by city
- **Query Parameters**:
  - `city_id` (number): City ID
- **Response**: Array of district objects

### GET /api/regions/villages
Get villages by district
- **Query Parameters**:
  - `district_id` (number): District ID
- **Response**: Array of village objects

### GET /api/postal-codes
Get postal codes
- **Response**: Array of postal code objects

## Error Responses

All API endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Authentication

Most API endpoints require authentication via cookies:
- `token`: Internal JWT token
- `api_token`: External API token

## Role-Based Access Control

The system uses role-based access control with the following hierarchy:
1. **SUPERADMIN**: Full system access
2. **ADMIN**: User management and system configuration
3. **DOCTOR**: Patient management and medical records
4. **STAFF**: Basic operations and data entry

## Pagination

Endpoints that return lists support pagination with the following parameters:
- `page`: Page number (starts from 1)
- `limit`: Number of items per page

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
``` 