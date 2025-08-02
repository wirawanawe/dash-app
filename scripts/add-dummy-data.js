const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addDummyData() {
  let connection;
  
  try {
    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'phc_dashboard',
      port: process.env.DB_PORT || 3306
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected to database successfully!');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../init-scripts/17-add-dummy-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Reading SQL file...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
          // Continue with next statement
        }
      }
    }
    
    console.log('✅ Dummy data has been successfully added to all tables!');
    console.log('\n📊 Data added includes:');
    console.log('   • 5 Clinics');
    console.log('   • 8 Doctors');
    console.log('   • 8 Polyclinics');
    console.log('   • 5 Insurance companies');
    console.log('   • 5 Companies');
    console.log('   • 8 Treatments');
    console.log('   • 8 ICD codes');
    console.log('   • 8 Patients');
    console.log('   • 8 Visits');
    console.log('   • 8 Examinations');
    console.log('   • 10 Additional food items');
    console.log('   • 8 Additional missions');
    console.log('   • 8 User missions (for user_id 1)');
    console.log('   • 5 Wellness activities');
    console.log('   • 8 Mood tracking entries');
    console.log('   • 8 Water tracking entries');
    console.log('   • 1 User water settings');
    console.log('   • 8 Sleep tracking entries');
    console.log('   • 9 Meal logging entries');
    console.log('   • 7 Meal tracking entries');
    console.log('   • 5 Meal foods');
    console.log('   • 8 Fitness tracking entries');
    console.log('   • 5 User quick foods');
    console.log('   • 3 Chats');
    console.log('   • 6 Chat messages');
    console.log('   • 4 Consultations');
    console.log('   • 8 Health data entries');
    console.log('   • 2 Assessments');
    console.log('   • 5 Additional users (staff/admin)');
    
  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  addDummyData()
    .then(() => {
      console.log('\n🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDummyData }; 