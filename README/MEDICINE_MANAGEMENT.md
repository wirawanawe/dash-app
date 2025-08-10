# Medicine Management System

## Overview

The Medicine Management System (FAR_PRODUK) is a comprehensive module for managing medicine/drug inventory across multiple clinics. Each clinic maintains its own separate medicine database, allowing for clinic-specific pricing and inventory management.

## Features

### Core Functionality
- **Multi-clinic Support**: Each clinic has its own medicine database
- **Complete CRUD Operations**: Create, Read, Update, Delete medicines
- **Advanced Filtering**: Filter by clinic, search by name, description, or codes
- **Pagination**: Efficient data loading with configurable page sizes
- **Soft Delete**: Medicines can be deactivated (Berlaku = 0) or permanently deleted (GCRecord = 1)

### Medicine Information
- **Basic Info**: Name, description, clinic association
- **Pricing**: HNA (Net Price) and HNAJual (Selling Price)
- **Units**: Small, Medium, and Large units (e.g., Tablet, Strip, Box)
- **Conversion**: Factor for unit conversion
- **Inventory**: Minimum quantity settings
- **Codes**: KFA Code and APLN Code support
- **Status**: Active/Inactive status tracking

## Database Schema

### FAR_PRODUK Table

```sql
CREATE TABLE far_produk (
    ElementDetailKey INT AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT NOT NULL,
    Detail VARCHAR(50) NULL,
    DetailDescription VARCHAR(100) DEFAULT '' NOT NULL,
    HNA FLOAT(53) DEFAULT 0 NOT NULL,
    HNAJual FLOAT(53) DEFAULT 0 NOT NULL,
    SmallUnit VARCHAR(50) DEFAULT '' NOT NULL,
    MediumUnit CHAR(10) DEFAULT '' NOT NULL,
    LargeUnit CHAR(10) DEFAULT '' NOT NULL,
    factor_3 REAL DEFAULT 1 NOT NULL,
    QtyMin INT DEFAULT 0 NOT NULL,
    UserIDInput VARCHAR(10) NULL,
    UserIDModify VARCHAR(10) NULL,
    Berlaku BIT DEFAULT 1 NOT NULL,
    GCRecord BIT DEFAULT 0 NOT NULL,
    ReffID VARCHAR(30) NULL,
    KFA_Code VARCHAR(20) NULL,
    IsSyncServerPHC BIT DEFAULT 0 NOT NULL,
    APLN_Code VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    
    INDEX idx_clinic_id (clinic_id),
    INDEX idx_detail (Detail),
    INDEX idx_kfa_code (KFA_Code),
    INDEX idx_apln_code (APLN_Code),
    INDEX idx_berlaku (Berlaku),
    INDEX idx_created_at (created_at)
);
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `ElementDetailKey` | INT | Primary key, auto-increment |
| `clinic_id` | INT | Foreign key to clinics table |
| `Detail` | VARCHAR(50) | Medicine name |
| `DetailDescription` | VARCHAR(100) | Medicine description |
| `HNA` | FLOAT | Net price (Harga Netto) |
| `HNAJual` | FLOAT | Selling price |
| `SmallUnit` | VARCHAR(50) | Smallest unit (e.g., Tablet) |
| `MediumUnit` | CHAR(10) | Medium unit (e.g., Strip) |
| `LargeUnit` | CHAR(10) | Largest unit (e.g., Box) |
| `factor_3` | REAL | Conversion factor between units |
| `QtyMin` | INT | Minimum quantity |
| `Berlaku` | BIT | Active status (1=Active, 0=Inactive) |
| `GCRecord` | BIT | Deletion flag (1=Deleted, 0=Active) |
| `KFA_Code` | VARCHAR(20) | KFA (Katalog Farmasi) code |
| `APLN_Code` | VARCHAR(20) | APLN code |

## API Endpoints

### Base URL: `/api/medicine`

#### GET /api/medicine
Get all medicines with pagination and filtering

**Query Parameters:**
- `clinic_id` (optional): Filter by clinic ID
- `search` (optional): Search in Detail, DetailDescription, or KFA_Code
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ElementDetailKey": 1,
      "clinic_id": 1,
      "clinic_name": "Klinik A",
      "Detail": "Paracetamol 500mg",
      "DetailDescription": "Tablet paracetamol 500mg",
      "HNA": 0.5,
      "HNAJual": 0.75,
      "SmallUnit": "Tablet",
      "MediumUnit": "Strip",
      "LargeUnit": "Box",
      "factor_3": 10,
      "QtyMin": 1,
      "KFA_Code": "PAR001",
      "APLN_Code": "APL001",
      "Berlaku": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
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

#### POST /api/medicine
Create a new medicine

**Request Body:**
```json
{
  "clinic_id": 1,
  "Detail": "Paracetamol 500mg",
  "DetailDescription": "Tablet paracetamol 500mg",
  "HNA": 0.5,
  "HNAJual": 0.75,
  "SmallUnit": "Tablet",
  "MediumUnit": "Strip",
  "LargeUnit": "Box",
  "factor_3": 10,
  "QtyMin": 1,
  "KFA_Code": "PAR001",
  "APLN_Code": "APL001"
}
```

#### GET /api/medicine/[id]
Get specific medicine by ID

#### PUT /api/medicine/[id]
Update medicine

#### DELETE /api/medicine/[id]
Soft delete medicine (set Berlaku = 0)

#### DELETE /api/medicine/[id]?hard=true
Hard delete medicine (set GCRecord = 1)

## Frontend Components

### MedicinePage (`/app/medicine/page.js`)
Main page for medicine management with:
- Statistics dashboard
- Search and filtering
- Pagination
- CRUD operations

### MedicineTable (`/app/medicine/components/MedicineTable.jsx`)
Table component displaying medicine data with:
- Responsive design
- Action buttons (Edit, Delete)
- Status indicators
- Currency formatting

### MedicineForm (`/app/medicine/components/MedicineForm.jsx`)
Modal form for adding/editing medicines with:
- Form validation
- Currency input formatting
- Clinic selection
- Unit management

## Usage

### Accessing Medicine Management
1. Navigate to `/medicine` in the application
2. Only users with SUPERADMIN or ADMIN roles can access
3. The page shows medicines filtered by the user's clinic (if applicable)

### Adding a New Medicine
1. Click "Tambah Obat" button
2. Fill in required fields:
   - Clinic (required)
   - Medicine name (required)
   - Pricing information
   - Unit information
   - Codes (optional)
3. Click "Simpan" to save

### Editing a Medicine
1. Click the edit icon (pencil) next to any medicine
2. Modify the desired fields
3. Click "Update" to save changes

### Deleting a Medicine
1. Click the delete icon (trash) next to any medicine
2. Choose between:
   - **Deactivate**: Sets Berlaku = 0 (soft delete)
   - **Permanent Delete**: Sets GCRecord = 1 (hard delete)

## Database Views and Stored Procedures

### View: v_medicine_with_clinic
Provides medicine data with clinic information for easier querying.

### Stored Procedures
- `AddMedicine`: Add new medicine
- `UpdateMedicine`: Update existing medicine
- `DeactivateMedicine`: Soft delete medicine
- `DeleteMedicine`: Hard delete medicine

## Security and Permissions

### Role-Based Access
- **SUPERADMIN**: Full access to all clinics and medicines
- **ADMIN**: Access to medicines in their assigned clinics
- **DOCTOR/STAFF**: No direct access to medicine management

### Data Validation
- Required field validation
- Numeric value validation for prices and quantities
- Clinic existence validation
- User permission validation

## Integration Points

### Clinic Integration
- Medicines are linked to clinics via `clinic_id` foreign key
- Clinic deletion cascades to medicine deletion
- Clinic filtering available in all queries

### User Integration
- User tracking via `UserIDInput` and `UserIDModify` fields
- Role-based access control
- Audit trail for medicine changes

## Migration and Setup

### Database Migration
Run the migration script to create the medicine table:

```bash
# Apply the medicine table migration
mysql -u username -p database_name < init-scripts/13-create-medicine-table.sql
```

### Sample Data
The migration includes sample data that can be uncommented for testing:

```sql
INSERT INTO far_produk (clinic_id, Detail, DetailDescription, HNA, HNAJual, SmallUnit, MediumUnit, LargeUnit, factor_3, QtyMin, KFA_Code, APLN_Code) VALUES
(1, 'PARACETAMOL', 'Paracetamol 500mg Tablet', 0.50, 0.75, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001'),
(1, 'AMOXICILLIN', 'Amoxicillin 500mg Capsule', 1.20, 1.80, 'Capsule', 'Strip', 'Box', 10, 1, 'AMO001', 'APL002');
```

## Future Enhancements

### Planned Features
- **Inventory Tracking**: Stock level monitoring
- **Batch Management**: Expiry date tracking
- **Price History**: Historical pricing data
- **Supplier Integration**: Supplier information
- **Barcode Support**: QR code generation
- **Reporting**: Medicine usage reports
- **API Integration**: External pharmacy system integration

### Performance Optimizations
- Database indexing optimization
- Caching for frequently accessed data
- Pagination improvements for large datasets
- Search optimization with full-text search

## Troubleshooting

### Common Issues

1. **Medicine not appearing in list**
   - Check if `Berlaku = 1` and `GCRecord = 0`
   - Verify clinic filtering is correct

2. **Permission denied errors**
   - Ensure user has appropriate role (SUPERADMIN or ADMIN)
   - Check clinic assignment for ADMIN users

3. **Database connection issues**
   - Verify database credentials
   - Check if migration script has been applied

4. **Form validation errors**
   - Ensure required fields are filled
   - Check numeric field formats
   - Verify clinic selection

### Logs and Debugging
- Check browser console for JavaScript errors
- Review server logs for API errors
- Verify database query performance
- Monitor user access patterns 