const mysql = require('mysql2/promise');

async function fixMealData() {
  let connection;
  
  try {
    // Database configuration
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '', // Empty password as per env.local.example
      database: 'phc_dashboard',
      port: 3306
    };

    console.log('🔧 Fixing meal data...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // 1. Add test user if not exists
    console.log('\n👤 Adding test user...');
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['test@phc.com']
    );

    let userId;
    if (existingUser.length === 0) {
      const [userResult] = await connection.execute(
        'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['Test User', 'test@phc.com', 'hashed_password', 'user']
      );
      userId = userResult.insertId;
      console.log(`✅ Created test user with ID: ${userId}`);
    } else {
      userId = existingUser[0].id;
      console.log(`✅ Test user already exists with ID: ${userId}`);
    }

    // 2. Add sample meal data
    console.log('\n🍽️ Adding sample meal data...');
    
    // Add breakfast meal
    const [breakfastResult] = await connection.execute(
      'INSERT INTO meal_tracking (user_id, meal_type, recorded_at, notes, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, 'breakfast', new Date().toISOString().slice(0, 19).replace('T', ' '), 'Sample breakfast meal']
    );
    const breakfastId = breakfastResult.insertId;
    console.log(`✅ Added breakfast meal with ID: ${breakfastId}`);

    // Add lunch meal
    const [lunchResult] = await connection.execute(
      'INSERT INTO meal_tracking (user_id, meal_type, recorded_at, notes, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, 'lunch', new Date().toISOString().slice(0, 19).replace('T', ' '), 'Sample lunch meal']
    );
    const lunchId = lunchResult.insertId;
    console.log(`✅ Added lunch meal with ID: ${lunchId}`);

    // 3. Add food items to meals
    console.log('\n🥗 Adding food items to meals...');
    
    // Get food items from food_database
    const [foods] = await connection.execute('SELECT id, name FROM food_database LIMIT 3');
    
    if (foods.length > 0) {
      // Add foods to breakfast
      for (const food of foods.slice(0, 2)) {
        await connection.execute(
          'INSERT INTO meal_foods (meal_id, food_id, quantity, unit, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [breakfastId, food.id, 1, 'serving', 150, 5, 25, 3]
        );
        console.log(`✅ Added ${food.name} to breakfast`);
      }

      // Add foods to lunch
      for (const food of foods.slice(1, 3)) {
        await connection.execute(
          'INSERT INTO meal_foods (meal_id, food_id, quantity, unit, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [lunchId, food.id, 1, 'serving', 200, 8, 30, 5]
        );
        console.log(`✅ Added ${food.name} to lunch`);
      }
    }

    // 4. Verify data
    console.log('\n📊 Verifying data...');
    const [mealCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM meal_tracking WHERE user_id = ?',
      [userId]
    );
    const [foodCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM meal_foods WHERE meal_id IN (SELECT id FROM meal_tracking WHERE user_id = ?)',
      [userId]
    );

    console.log(`✅ Meal tracking records: ${mealCount[0].count}`);
    console.log(`✅ Meal food records: ${foodCount[0].count}`);

    console.log('\n🎉 Meal data fix completed successfully!');
    console.log(`📱 Test with user_id: ${userId}`);
    console.log(`🔗 API URL: http://localhost:3000/api/mobile/tracking/meal?user_id=${userId}`);

  } catch (error) {
    console.error('❌ Error fixing meal data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMealData(); 