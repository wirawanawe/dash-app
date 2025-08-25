# Medicine API Fix Documentation

## Problem Summary

The medicine API was failing with the error: `Table 'phc_dashboard.medicines' doesn't exist`

## Root Cause

The `medicines` table creation script (`14-create-medicines-table.sql`) existed but was not included in the main database setup script (`00-complete-setup.sql`). The `npm run setup-complete-db` command only runs the complete setup script, which didn't include the medicines table.

## Solution Applied

### 1. Immediate Fix
Manually executed the medicines table creation script:
```bash
mysql -u root -p -e "USE phc_dashboard; SOURCE init-scripts/14-create-medicines-table.sql;"
```

### 2. Long-term Fix
Updated the complete setup script (`00-complete-setup.sql`) to include the medicines table creation and sample data.

### 3. Created Helper Script
Added a new script `setup-medicines.js` that can be run independently:
```bash
npm run setup-medicines
```

## Current Status

✅ **Medicine API is working** - Returns proper pagination and data  
✅ **Dashboard Stats API is working** - Returns statistics correctly  
✅ **Database has all necessary tables** including medicines table with 25 sample medicines  
✅ **Complete setup script updated** - Now includes medicines table  
✅ **Helper script created** - For future medicines setup needs  

## API Testing

### Medicine API
```bash
curl "http://localhost:3000/api/medicine?search=&page=1&limit=10"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "ElementDetailKey": 25,
      "clinic_id": 3,
      "clinic_name": "Puskesmas Central",
      "Detail": "OMEPRAZOLE 20MG",
      "DetailDescription": "Omeprazole 20mg Capsule - Obat untuk asam lambung",
      "HNA": 2.05,
      "HNAJual": 3.07,
      "SmallUnit": "Capsule",
      "MediumUnit": "Strip",
      "LargeUnit": "Box",
      "factor_3": 10,
      "QtyMin": 1,
      "UserIDInput": "SYSTEM",
      "Berlaku": {"type": "Buffer", "data": [1]},
      "GCRecord": {"type": "Buffer", "data": [0]},
      "KFA_Code": "OME001",
      "APLN_Code": "APL005",
      "created_at": "2025-08-05T11:11:05.000Z",
      "updated_at": "2025-08-05T11:11:05.000Z"
    }
    // ... more medicines
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Dashboard Stats API
```bash
curl "http://localhost:3000/api/dashboard/stats"
```

## Available Scripts

### Database Setup Scripts
- `npm run full-setup` - Complete database setup (now includes medicines)
- `npm run setup-complete-db` - Setup database tables only
- `npm run setup-medicines` - Setup medicines table and data only
- `npm run check-db` - Check database connection

### Testing Scripts
- `npm run test-meal-tracking` - Test meal tracking API
- `npm run test-db` - Test database connection

## Database Structure

### Medicines Table
```sql
CREATE TABLE medicines (
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

## Sample Data

The medicines table includes 25 sample medicines across 3 clinics:
- **Clinic 1**: 10 medicines (Paracetamol, Amoxicillin, Ibuprofen, etc.)
- **Clinic 2**: 10 medicines (Paracetamol, Cetirizine, Omeprazole, etc.)
- **Clinic 3**: 5 medicines (Paracetamol, Amoxicillin, Ibuprofen, etc.)

## Prevention Measures

1. **Always include new tables in the complete setup script** when creating new features
2. **Test the complete setup process** after adding new tables
3. **Use the helper scripts** for specific table setup when needed
4. **Document table dependencies** clearly in SQL scripts

## Troubleshooting

### If Medicine API Fails Again

1. **Check if medicines table exists:**
   ```bash
   mysql -u root -p -e "USE phc_dashboard; SHOW TABLES LIKE 'medicines';"
   ```

2. **If table doesn't exist, run the setup:**
   ```bash
   npm run setup-medicines
   ```

3. **If that fails, run the complete setup:**
   ```bash
   npm run full-setup
   ```

4. **Check database connection:**
   ```bash
   npm run check-db
   ```

### Common Issues

1. **MySQL not running:**
   ```bash
   # macOS
   brew services start mysql
   
   # Ubuntu
   sudo systemctl start mysql
   ```

2. **Wrong database credentials:**
   - Check `.env` file
   - Verify MySQL user permissions

3. **Database doesn't exist:**
   ```bash
   npm run full-setup
   ```

## Next Steps

1. **Test all medicine-related features** in the dashboard
2. **Add more sample medicines** if needed
3. **Implement medicine search and filtering** features
4. **Add medicine inventory management** features
5. **Create medicine prescription workflows**

## Files Modified

1. `dash-app/init-scripts/00-complete-setup.sql` - Added medicines table creation
2. `dash-app/scripts/setup-medicines.js` - Created new helper script
3. `dash-app/package.json` - Added setup-medicines script

## Files Created

1. `dash-app/MEDICINE_API_FIX.md` - This documentation file 