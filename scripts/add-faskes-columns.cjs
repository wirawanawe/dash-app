const mysql = require('mysql2/promise');

async function addFaskesColumns() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'pr1k1t1w',
      database: process.env.DB_NAME || 'phc_dashboard',
    });

    console.log('✅ Connected to database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clinics'
    `, [process.env.DB_NAME || 'phc_dashboard']);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    // Add external_id column if not exists
    if (!existingColumns.includes('external_id')) {
      console.log('Adding external_id column...');
      await connection.execute(`
        ALTER TABLE clinics 
        ADD COLUMN external_id VARCHAR(100) NULL AFTER id
      `);
      await connection.execute(`
        ALTER TABLE clinics 
        ADD INDEX idx_external_id (external_id)
      `);
      console.log('✅ Added external_id column');
    } else {
      console.log('⏭️  external_id column already exists');
    }

    // Add code column if not exists
    if (!existingColumns.includes('code')) {
      console.log('Adding code column...');
      await connection.execute(`
        ALTER TABLE clinics 
        ADD COLUMN code VARCHAR(50) NULL AFTER name
      `);
      await connection.execute(`
        ALTER TABLE clinics 
        ADD INDEX idx_code (code)
      `);
      console.log('✅ Added code column');
    } else {
      console.log('⏭️  code column already exists');
    }

    // Add client_id column if not exists
    if (!existingColumns.includes('client_id')) {
      console.log('Adding client_id column...');
      await connection.execute(`
        ALTER TABLE clinics 
        ADD COLUMN client_id VARCHAR(50) NULL AFTER code
      `);
      console.log('✅ Added client_id column');
    } else {
      console.log('⏭️  client_id column already exists');
    }

    // Show updated table structure
    console.log('\n📋 Updated table structure:');
    const [tableInfo] = await connection.execute(`DESCRIBE clinics`);
    console.table(tableInfo);

    console.log('\n✅ All columns added successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addFaskesColumns();

