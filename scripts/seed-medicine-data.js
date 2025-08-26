import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seedMedicineData() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'dash.doctorphc.id',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'phc_dashboard'
    });

    console.log('Connected to database');

    // Check if medicines table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "medicines"');
    if (tables.length === 0) {
      console.log('Medicines table does not exist. Creating...');
      
      // Create medicines table
      await connection.execute(`
        CREATE TABLE medicines (
          ElementDetailKey INT AUTO_INCREMENT PRIMARY KEY,
          clinic_id INT NOT NULL,
          Detail VARCHAR(255) NOT NULL,
          DetailDescription TEXT,
          HNA DECIMAL(10,2) DEFAULT 0,
          HNAJual DECIMAL(10,2) DEFAULT 0,
          SmallUnit VARCHAR(50) DEFAULT 'Tablet',
          MediumUnit VARCHAR(50) DEFAULT 'Strip',
          LargeUnit VARCHAR(50) DEFAULT 'Box',
          factor_3 INT DEFAULT 1,
          QtyMin INT DEFAULT 1,
          UserIDInput VARCHAR(50),
          UserIDModify VARCHAR(50),
          Berlaku TINYINT(1) DEFAULT 1,
          GCRecord TINYINT(1) DEFAULT 0,
          ReffID VARCHAR(50),
          KFA_Code VARCHAR(50),
          IsSyncServerPHC TINYINT(1) DEFAULT 0,
          APLN_Code VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Medicines table created');
    }

    // Check if we have any clinics
    const [clinics] = await connection.execute('SELECT id FROM clinics LIMIT 1');
    if (clinics.length === 0) {
      console.log('No clinics found. Creating sample clinic...');
      await connection.execute(`
        INSERT INTO clinics (name, address, phone, email, is_active) 
        VALUES ('Klinik Sample', 'Jl. Sample No. 1', '021-123456', 'sample@klinik.com', 1)
      `);
    }

    // Get clinic ID
    const [clinicResult] = await connection.execute('SELECT id FROM clinics LIMIT 1');
    const clinicId = clinicResult[0]?.id || 1;

    // Check if medicines table has data
    const [medicineCount] = await connection.execute('SELECT COUNT(*) as count FROM medicines');
    
    if (medicineCount[0].count === 0) {
      console.log('Seeding sample medicine data...');
      
      const sampleMedicines = [
        {
          clinic_id: clinicId,
          Detail: 'Paracetamol 500mg',
          DetailDescription: 'Obat pereda nyeri dan demam',
          HNA: 1500,
          HNAJual: 2000,
          SmallUnit: 'Tablet',
          MediumUnit: 'Strip',
          LargeUnit: 'Box',
          factor_3: 10,
          QtyMin: 1,
          UserIDInput: 'system',
          KFA_Code: 'KFA001',
          APLN_Code: 'APLN001'
        },
        {
          clinic_id: clinicId,
          Detail: 'Amoxicillin 500mg',
          DetailDescription: 'Antibiotik untuk infeksi bakteri',
          HNA: 2500,
          HNAJual: 3000,
          SmallUnit: 'Kapsul',
          MediumUnit: 'Strip',
          LargeUnit: 'Box',
          factor_3: 10,
          QtyMin: 1,
          UserIDInput: 'system',
          KFA_Code: 'KFA002',
          APLN_Code: 'APLN002'
        },
        {
          clinic_id: clinicId,
          Detail: 'Omeprazole 20mg',
          DetailDescription: 'Obat untuk asam lambung',
          HNA: 3500,
          HNAJual: 4500,
          SmallUnit: 'Kapsul',
          MediumUnit: 'Strip',
          LargeUnit: 'Box',
          factor_3: 10,
          QtyMin: 1,
          UserIDInput: 'system',
          KFA_Code: 'KFA003',
          APLN_Code: 'APLN003'
        },
        {
          clinic_id: clinicId,
          Detail: 'Ibuprofen 400mg',
          DetailDescription: 'Obat anti inflamasi non steroid',
          HNA: 1800,
          HNAJual: 2500,
          SmallUnit: 'Tablet',
          MediumUnit: 'Strip',
          LargeUnit: 'Box',
          factor_3: 10,
          QtyMin: 1,
          UserIDInput: 'system',
          KFA_Code: 'KFA004',
          APLN_Code: 'APLN004'
        },
        {
          clinic_id: clinicId,
          Detail: 'Cetirizine 10mg',
          DetailDescription: 'Obat antihistamin untuk alergi',
          HNA: 2200,
          HNAJual: 2800,
          SmallUnit: 'Tablet',
          MediumUnit: 'Strip',
          LargeUnit: 'Box',
          factor_3: 10,
          QtyMin: 1,
          UserIDInput: 'system',
          KFA_Code: 'KFA005',
          APLN_Code: 'APLN005'
        }
      ];

      for (const medicine of sampleMedicines) {
        await connection.execute(`
          INSERT INTO medicines (
            clinic_id, Detail, DetailDescription, HNA, HNAJual,
            SmallUnit, MediumUnit, LargeUnit, factor_3, QtyMin,
            UserIDInput, KFA_Code, APLN_Code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          medicine.clinic_id,
          medicine.Detail,
          medicine.DetailDescription,
          medicine.HNA,
          medicine.HNAJual,
          medicine.SmallUnit,
          medicine.MediumUnit,
          medicine.LargeUnit,
          medicine.factor_3,
          medicine.QtyMin,
          medicine.UserIDInput,
          medicine.KFA_Code,
          medicine.APLN_Code
        ]);
      }

      console.log('Sample medicine data seeded successfully');
    } else {
      console.log('Medicines table already has data');
    }

    // Verify the data
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM medicines');
    console.log(`Total medicines in database: ${finalCount[0].count}`);

    const [sampleData] = await connection.execute('SELECT * FROM medicines LIMIT 3');
    console.log('Sample data:', sampleData);

  } catch (error) {
    console.error('Error seeding medicine data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the seeding function
seedMedicineData().then(() => {
  console.log('Medicine seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
}); 