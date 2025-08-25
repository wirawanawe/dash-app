import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306
};

async function createDummyMobileData() {
  console.log('🔧 Creating dummy mobile data...\n');

  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');

    // Clear existing dummy data first
    console.log('🧹 Cleaning existing dummy data...');
    await clearExistingDummyData(connection);

    // Create 5 mobile users
    console.log('👥 Creating 5 mobile users...');
    const users = await createMobileUsers(connection);

    // Create missions if they don't exist
    console.log('🎯 Creating missions...');
    const missions = await createMissions(connection);

    // User 1: Following program for 7 days with tracking data
    console.log('📊 Setting up User 1 (7 days program with tracking)...');
    await setupUser1(connection, users[0], missions);

    // User 2: Following program for 20 days with tracking data  
    console.log('📊 Setting up User 2 (20 days program with tracking)...');
    await setupUser2(connection, users[1], missions);

    // User 3: Following program for 30 days with tracking data
    console.log('📊 Setting up User 3 (30 days program with tracking)...');
    await setupUser3(connection, users[2], missions);

    // User 4: Completed 7 days program with satisfactory results
    console.log('📊 Setting up User 4 (completed 7 days program)...');
    await setupUser4(connection, users[3], missions);

    // User 5: Not following any program
    console.log('📊 Setting up User 5 (not following program)...');
    await setupUser5(connection, users[4]);

    console.log('\n🎉 Dummy mobile data created successfully!');
    console.log('\n📋 Summary:');
    console.log('- User 1: Following program for 7 days with tracking data');
    console.log('- User 2: Following program for 20 days with tracking data');
    console.log('- User 3: Following program for 30 days with tracking data');
    console.log('- User 4: Completed 7 days program with satisfactory results');
    console.log('- User 5: Not following any program');

  } catch (error) {
    console.error('❌ Error creating dummy mobile data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function clearExistingDummyData(connection) {
  // Delete data in reverse order of dependencies
  const tables = [
    'user_habit_activities', 'user_water_settings', 'water_tracking', 
    'sleep_tracking', 'mood_tracking', 'fitness_tracking', 'meal_tracking',
    'meal_foods', 'user_missions', 'wellness_activities', 'health_data',
    'user_quick_foods'
  ];

  for (const table of tables) {
    try {
      await connection.execute(`DELETE FROM ${table} WHERE user_id IN (SELECT id FROM mobile_users WHERE email LIKE '%dummy%')`);
    } catch (error) {
      // Table might not exist, continue
    }
  }

  // Delete dummy users
  await connection.execute("DELETE FROM mobile_users WHERE email LIKE '%dummy%'");
}

async function createMobileUsers(connection) {
  const users = [
    {
      name: 'Dummy User 1',
      email: 'dummy1@example.com',
      phone: '+6281234567001',
      password: 'password123',
      date_of_birth: '1990-01-15',
      gender: 'male',
      height: 175.0,
      weight: 70.0,
      blood_type: 'O+'
    },
    {
      name: 'Dummy User 2', 
      email: 'dummy2@example.com',
      phone: '+6281234567002',
      password: 'password123',
      date_of_birth: '1992-03-20',
      gender: 'female',
      height: 162.0,
      weight: 55.0,
      blood_type: 'A+'
    },
    {
      name: 'Dummy User 3',
      email: 'dummy3@example.com', 
      phone: '+6281234567003',
      password: 'password123',
      date_of_birth: '1988-07-10',
      gender: 'male',
      height: 170.0,
      weight: 68.0,
      blood_type: 'B+'
    },
    {
      name: 'Dummy User 4',
      email: 'dummy4@example.com',
      phone: '+6281234567004', 
      password: 'password123',
      date_of_birth: '1995-11-25',
      gender: 'female',
      height: 158.0,
      weight: 52.0,
      blood_type: 'AB+'
    },
    {
      name: 'Dummy User 5',
      email: 'dummy5@example.com',
      phone: '+6281234567005',
      password: 'password123', 
      date_of_birth: '1993-09-08',
      gender: 'male',
      height: 168.0,
      weight: 72.0,
      blood_type: 'O-'
    }
  ];

  const createdUsers = [];
  for (const user of users) {
    const [result] = await connection.execute(
      `INSERT INTO mobile_users (
        name, email, phone, password, date_of_birth, gender, 
        height, weight, blood_type, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user.name, user.email, user.phone, user.password, user.date_of_birth,
        user.gender, user.height, user.weight, user.blood_type, 1
      ]
    );
    createdUsers.push({ ...user, id: result.insertId });
  }

  return createdUsers;
}

async function createMissions(connection) {
  // Check if missions already exist
  const [existingMissions] = await connection.execute('SELECT id FROM missions LIMIT 1');
  
  if (existingMissions.length === 0) {
    const missions = [
      {
        title: 'Minum Air 8 Gelas',
        description: 'Minum 8 gelas air per hari untuk kesehatan',
        category: 'nutrition',
        points: 15,
        target_value: 8,
        target_unit: 'glasses'
      },
      {
        title: 'Tidur 8 Jam',
        description: 'Tidur 8 jam per hari untuk kesehatan optimal',
        category: 'sleep',
        points: 20,
        target_value: 8,
        target_unit: 'hours'
      },
      {
        title: 'Jalan Kaki 10.000 Langkah',
        description: 'Jalan kaki 10.000 langkah per hari',
        category: 'fitness',
        points: 25,
        target_value: 10000,
        target_unit: 'steps'
      },
      {
        title: 'Meditasi 10 Menit',
        description: 'Meditasi 10 menit per hari untuk kesehatan mental',
        category: 'mental_health',
        points: 20,
        target_value: 10,
        target_unit: 'minutes'
      },
      {
        title: 'Makan Buah 3 Porsi',
        description: 'Makan 3 porsi buah per hari',
        category: 'nutrition',
        points: 15,
        target_value: 3,
        target_unit: 'servings'
      }
    ];

    for (const mission of missions) {
      await connection.execute(
        `INSERT INTO missions (
          title, description, category, points, target_value, target_unit, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          mission.title, mission.description, mission.category, mission.points,
          mission.target_value, mission.target_unit, 1
        ]
      );
    }
  }

  // Get all missions
  const [missions] = await connection.execute('SELECT * FROM missions');
  return missions;
}

async function setupUser1(connection, user, missions) {
  // User 1: Following program for 7 days with tracking data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Add user missions
  for (const mission of missions.slice(0, 3)) {
    await connection.execute(
      `INSERT INTO user_missions (
        user_id, mission_id, status, progress, start_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [user.id, mission.id, 'active', 70, startDate]
    );
  }

  // Add tracking data for 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Water tracking
    await connection.execute(
      `INSERT INTO water_tracking (
        user_id, amount_ml, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [user.id, 2000 + Math.floor(Math.random() * 500), date.toISOString().split('T')[0], '08:00:00']
    );

    // Sleep tracking
    await connection.execute(
      `INSERT INTO sleep_tracking (
        user_id, sleep_date, bedtime, wake_time, sleep_duration_minutes, sleep_quality, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, date.toISOString().split('T')[0], '22:00:00', '06:00:00',
        480 + Math.floor(Math.random() * 60), 'good'
      ]
    );

    // Mood tracking
    await connection.execute(
      `INSERT INTO mood_tracking (
        user_id, mood_level, stress_level, energy_level, tracking_date, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'happy', 'low', 'high', date.toISOString().split('T')[0]
      ]
    );

    // Fitness tracking
    await connection.execute(
      `INSERT INTO fitness_tracking (
        user_id, activity_type, activity_name, duration_minutes, calories_burned, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'walking', 'Jalan Pagi', 30, 150, date.toISOString().split('T')[0], '06:30:00'
      ]
    );
  }
}

async function setupUser2(connection, user, missions) {
  // User 2: Following program for 20 days with tracking data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 20);

  // Add user missions
  for (const mission of missions.slice(0, 4)) {
    await connection.execute(
      `INSERT INTO user_missions (
        user_id, mission_id, status, progress, start_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [user.id, mission.id, 'active', 85, startDate]
    );
  }

  // Add tracking data for 10 days (as specified)
  for (let i = 0; i < 10; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i + 10); // Start from day 11

    // Water tracking
    await connection.execute(
      `INSERT INTO water_tracking (
        user_id, amount_ml, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [user.id, 2200 + Math.floor(Math.random() * 300), date.toISOString().split('T')[0], '08:00:00']
    );

    // Sleep tracking
    await connection.execute(
      `INSERT INTO sleep_tracking (
        user_id, sleep_date, bedtime, wake_time, sleep_duration_minutes, sleep_quality, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, date.toISOString().split('T')[0], '21:30:00', '06:30:00',
        510 + Math.floor(Math.random() * 30), 'excellent'
      ]
    );

    // Mood tracking
    await connection.execute(
      `INSERT INTO mood_tracking (
        user_id, mood_level, stress_level, energy_level, tracking_date, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'very_happy', 'low', 'very_high', date.toISOString().split('T')[0]
      ]
    );

    // Fitness tracking
    await connection.execute(
      `INSERT INTO fitness_tracking (
        user_id, activity_type, activity_name, duration_minutes, calories_burned, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'running', 'Jogging Pagi', 45, 300, date.toISOString().split('T')[0], '06:00:00'
      ]
    );
  }
}

async function setupUser3(connection, user, missions) {
  // User 3: Following program for 30 days with tracking data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Add user missions
  for (const mission of missions) {
    await connection.execute(
      `INSERT INTO user_missions (
        user_id, mission_id, status, progress, start_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [user.id, mission.id, 'active', 90, startDate]
    );
  }

  // Add tracking data for 5 days (as specified)
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i + 25); // Start from day 26

    // Water tracking
    await connection.execute(
      `INSERT INTO water_tracking (
        user_id, amount_ml, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [user.id, 2500 + Math.floor(Math.random() * 200), date.toISOString().split('T')[0], '08:00:00']
    );

    // Sleep tracking
    await connection.execute(
      `INSERT INTO sleep_tracking (
        user_id, sleep_date, bedtime, wake_time, sleep_duration_minutes, sleep_quality, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, date.toISOString().split('T')[0], '21:00:00', '07:00:00',
        600, 'excellent'
      ]
    );

    // Mood tracking
    await connection.execute(
      `INSERT INTO mood_tracking (
        user_id, mood_level, stress_level, energy_level, tracking_date, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'very_happy', 'low', 'very_high', date.toISOString().split('T')[0]
      ]
    );

    // Fitness tracking
    await connection.execute(
      `INSERT INTO fitness_tracking (
        user_id, activity_type, activity_name, duration_minutes, calories_burned, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'cycling', 'Bersepeda', 60, 400, date.toISOString().split('T')[0], '06:00:00'
      ]
    );
  }
}

async function setupUser4(connection, user, missions) {
  // User 4: Completed 7 days program with satisfactory results
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 14); // Started 14 days ago
  const completedDate = new Date(startDate);
  completedDate.setDate(completedDate.getDate() + 7); // Completed after 7 days

  // Add completed user missions
  for (const mission of missions.slice(0, 3)) {
    await connection.execute(
      `INSERT INTO user_missions (
        user_id, mission_id, status, progress, start_date, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [user.id, mission.id, 'completed', 100, startDate, completedDate]
    );
  }

  // Add comprehensive tracking data for 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Water tracking - excellent compliance
    await connection.execute(
      `INSERT INTO water_tracking (
        user_id, amount_ml, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [user.id, 2500, date.toISOString().split('T')[0], '08:00:00']
    );

    // Sleep tracking - excellent quality
    await connection.execute(
      `INSERT INTO sleep_tracking (
        user_id, sleep_date, bedtime, wake_time, sleep_duration_minutes, sleep_quality, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, date.toISOString().split('T')[0], '21:00:00', '07:00:00', 600, 'excellent'
      ]
    );

    // Mood tracking - consistently positive
    await connection.execute(
      `INSERT INTO mood_tracking (
        user_id, mood_level, stress_level, energy_level, tracking_date, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'very_happy', 'low', 'very_high', date.toISOString().split('T')[0]
      ]
    );

    // Fitness tracking - consistent exercise
    await connection.execute(
      `INSERT INTO fitness_tracking (
        user_id, activity_type, activity_name, duration_minutes, calories_burned, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'mixed', 'Workout Pagi', 60, 350, date.toISOString().split('T')[0], '06:00:00'
      ]
    );

    // Health data - showing improvement
    await connection.execute(
      `INSERT INTO health_data (
        user_id, data_type, value, unit, measured_at, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id, 'weight', 70 - (i * 0.2), 'kg', date.toISOString().split('T')[0] + ' 08:00:00', 'manual'
      ]
    );
  }
}

async function setupUser5(connection, user) {
  // User 5: Not following any program - no missions or tracking data
  console.log(`User 5 (${user.name}) is not following any wellness program`);
}

// Run the script
createDummyMobileData();
