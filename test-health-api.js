const mysql = require('mysql2/promise');

async function testHealthAPI() {
  console.log('🧪 Testing Health Data API...\n');

  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'phc_dashboard'
    });

    console.log('✅ Connected to database');

    // Test 1: Simple query to get health data
    console.log('\n📋 Test 1: Simple health data query...');
    
    const user_id = 1;
    const limit = 50;
    const offset = 0;

    let sql = `
      SELECT 
        id, user_id, data_type, value, unit, measured_at as recorded_at, notes, created_at, updated_at
      FROM health_data
      WHERE user_id = ?
    `;
    let params = [user_id];

    sql += " ORDER BY measured_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    console.log("SQL Query:", sql);
    console.log("SQL Params:", params);

    const [healthData] = await connection.execute(sql, params);
    console.log(`✅ Query successful, found ${healthData.length} records`);

    if (healthData.length > 0) {
      console.log('Sample data:');
      healthData.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.data_type}: ${record.value} ${record.unit}`);
      });
    }

    // Test 2: Count query
    console.log('\n📊 Test 2: Count query...');
    const countSql = "SELECT COUNT(*) as total FROM health_data WHERE user_id = ?";
    const [countResult] = await connection.execute(countSql, [user_id]);
    console.log(`✅ Total records for user ${user_id}: ${countResult[0].total}`);

    // Test 3: Test INSERT
    console.log('\n➕ Test 3: Test INSERT...');
    const insertSql = `
      INSERT INTO health_data (user_id, data_type, value, unit, measured_at, notes, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'manual', NOW())
    `;
    
    const insertParams = [
      1, // user_id
      'weight', // data_type
      75.5, // value
      'kg', // unit
      new Date().toISOString(), // measured_at
      'Test insert from script' // notes
    ];

    console.log("INSERT SQL:", insertSql);
    console.log("INSERT Params:", insertParams);

    try {
      const [insertResult] = await connection.execute(insertSql, insertParams);
      console.log(`✅ Insert successful, ID: ${insertResult.insertId}`);
    } catch (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`);
    }

    await connection.end();
    console.log('\n✅ Health API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHealthAPI();
