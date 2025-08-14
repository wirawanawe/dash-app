import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306
};

async function addSampleData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Add sample wellness activities
    console.log('Adding sample wellness activities...');
    const activities = [
      {
        title: 'Morning Yoga',
        description: 'Start your day with gentle yoga stretches to improve flexibility and reduce stress',
        category: 'fitness',
        duration_minutes: 15,
        difficulty: 'beginner',
        points: 10,
        is_active: 1
      },
      {
        title: 'Meditation',
        description: 'Practice mindfulness meditation for mental clarity and stress relief',
        category: 'mental_health',
        duration_minutes: 10,
        difficulty: 'beginner',
        points: 8,
        is_active: 1
      },
      {
        title: 'Walking',
        description: 'Take a brisk walk outdoors to improve cardiovascular health',
        category: 'fitness',
        duration_minutes: 30,
        difficulty: 'beginner',
        points: 15,
        is_active: 1
      },
      {
        title: 'Strength Training',
        description: 'Build muscle and improve bone density with resistance exercises',
        category: 'fitness',
        duration_minutes: 45,
        difficulty: 'intermediate',
        points: 20,
        is_active: 1
      },
      {
        title: 'Deep Breathing',
        description: 'Practice deep breathing exercises for relaxation and stress management',
        category: 'mental_health',
        duration_minutes: 5,
        difficulty: 'beginner',
        points: 5,
        is_active: 1
      },
      {
        title: 'Swimming',
        description: 'Low-impact full-body workout that improves cardiovascular fitness',
        category: 'fitness',
        duration_minutes: 30,
        difficulty: 'intermediate',
        points: 18,
        is_active: 1
      },
      {
        title: 'Journaling',
        description: 'Write down your thoughts and feelings for emotional well-being',
        category: 'mental_health',
        duration_minutes: 15,
        difficulty: 'beginner',
        points: 8,
        is_active: 1
      },
      {
        title: 'Cycling',
        description: 'Cardiovascular exercise that strengthens legs and improves endurance',
        category: 'fitness',
        duration_minutes: 45,
        difficulty: 'intermediate',
        points: 20,
        is_active: 1
      }
    ];

    for (const activity of activities) {
      try {
        await connection.execute(
          'INSERT INTO available_wellness_activities (title, description, category, duration_minutes, difficulty, points, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [activity.title, activity.description, activity.category, activity.duration_minutes, activity.difficulty, activity.points, activity.is_active]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate activity: ${activity.title}`);
        } else {
          throw error;
        }
      }
    }

    // Add sample mood tracking data
    console.log('Adding sample mood tracking data...');
    const moodData = [
      {
        user_id: 1,
        mood_level: 'happy',
        mood_score: 8,
        stress_level: 'low',
        energy_level: 'high',
        sleep_quality: 'good',
        tracking_date: '2025-01-15',
        notes: 'Had a great workout this morning'
      },
      {
        user_id: 1,
        mood_level: 'neutral',
        mood_score: 5,
        stress_level: 'moderate',
        energy_level: 'moderate',
        sleep_quality: 'fair',
        tracking_date: '2025-01-14',
        notes: 'Busy day at work'
      },
      {
        user_id: 2,
        mood_level: 'very_happy',
        mood_score: 10,
        stress_level: 'low',
        energy_level: 'very_high',
        sleep_quality: 'excellent',
        tracking_date: '2025-01-15',
        notes: 'Completed my fitness goal!'
      },
      {
        user_id: 2,
        mood_level: 'sad',
        mood_score: 3,
        stress_level: 'high',
        energy_level: 'low',
        sleep_quality: 'poor',
        tracking_date: '2025-01-13',
        notes: 'Not feeling well today'
      }
    ];

    for (const mood of moodData) {
      try {
        await connection.execute(
          'INSERT INTO mood_tracking (user_id, mood_level, mood_score, stress_level, energy_level, sleep_quality, tracking_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [mood.user_id, mood.mood_level, mood.mood_score, mood.stress_level, mood.energy_level, mood.sleep_quality, mood.tracking_date, mood.notes]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate mood entry for user ${mood.user_id} on ${mood.tracking_date}`);
        } else {
          throw error;
        }
      }
    }

    // Add sample sleep tracking data
    console.log('Adding sample sleep tracking data...');
    const sleepData = [
      {
        user_id: 1,
        sleep_date: '2025-01-15',
        bedtime: '22:30:00',
        wake_time: '06:30:00',
        sleep_hours: 8.0,
        sleep_duration_minutes: 480,
        sleep_quality: 'good',
        sleep_latency_minutes: 15,
        wake_up_count: 1,
        notes: 'Slept well, feeling refreshed'
      },
      {
        user_id: 1,
        sleep_date: '2025-01-14',
        bedtime: '23:00:00',
        wake_time: '07:00:00',
        sleep_hours: 8.0,
        sleep_duration_minutes: 480,
        sleep_quality: 'excellent',
        sleep_latency_minutes: 10,
        wake_up_count: 0,
        notes: 'Very restful sleep'
      },
      {
        user_id: 2,
        sleep_date: '2025-01-15',
        bedtime: '00:30:00',
        wake_time: '08:00:00',
        sleep_hours: 7.5,
        sleep_duration_minutes: 450,
        sleep_quality: 'fair',
        sleep_latency_minutes: 30,
        wake_up_count: 2,
        notes: 'Late to bed, but slept okay'
      }
    ];

    for (const sleep of sleepData) {
      try {
        await connection.execute(
          'INSERT INTO sleep_tracking (user_id, sleep_date, bedtime, wake_time, sleep_hours, sleep_duration_minutes, sleep_quality, sleep_latency_minutes, wake_up_count, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [sleep.user_id, sleep.sleep_date, sleep.bedtime, sleep.wake_time, sleep.sleep_hours, sleep.sleep_duration_minutes, sleep.sleep_quality, sleep.sleep_latency_minutes, sleep.wake_up_count, sleep.notes]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate sleep entry for user ${sleep.user_id} on ${sleep.sleep_date}`);
        } else {
          throw error;
        }
      }
    }

    // Add sample health data
    console.log('Adding sample health data...');
    const healthData = [
      {
        user_id: 1,
        data_type: 'blood_pressure',
        value: 120.00,
        unit: 'mmHg',
        systolic_value: 120.00,
        diastolic_value: 80.00,
        notes: 'Normal blood pressure reading',
        measured_at: '2025-01-15 08:00:00',
        source: 'manual'
      },
      {
        user_id: 1,
        data_type: 'heart_rate',
        value: 72.00,
        unit: 'bpm',
        notes: 'Resting heart rate',
        measured_at: '2025-01-15 08:00:00',
        source: 'manual'
      },
      {
        user_id: 1,
        data_type: 'weight',
        value: 70.00,
        unit: 'kg',
        notes: 'Morning weight',
        measured_at: '2025-01-15 08:00:00',
        source: 'manual'
      },
      {
        user_id: 2,
        data_type: 'blood_sugar',
        value: 95.00,
        unit: 'mg/dL',
        notes: 'Fasting blood sugar',
        measured_at: '2025-01-15 08:00:00',
        source: 'manual'
      },
      {
        user_id: 2,
        data_type: 'temperature',
        value: 36.80,
        unit: '°C',
        notes: 'Body temperature',
        measured_at: '2025-01-15 08:00:00',
        source: 'manual'
      }
    ];

    for (const health of healthData) {
      try {
        await connection.execute(
          'INSERT INTO health_data (user_id, data_type, value, unit, systolic_value, diastolic_value, notes, measured_at, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [health.user_id, health.data_type, health.value, health.unit, health.systolic_value || null, health.diastolic_value || null, health.notes, health.measured_at, health.source]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate health data for user ${health.user_id}`);
        } else {
          throw error;
        }
      }
    }

    // Add sample user wellness activities
    console.log('Adding sample user wellness activities...');
    const userActivities = [
      {
        user_id: 1,
        activity_id: 1,
        duration_minutes: 15,
        notes: 'Great morning yoga session',
        completed_at: '2025-01-15 07:00:00'
      },
      {
        user_id: 1,
        activity_id: 3,
        duration_minutes: 30,
        notes: '30-minute walk in the park',
        completed_at: '2025-01-15 18:00:00'
      },
      {
        user_id: 2,
        activity_id: 2,
        duration_minutes: 10,
        notes: 'Meditation helped clear my mind',
        completed_at: '2025-01-15 20:00:00'
      }
    ];

    for (const activity of userActivities) {
      try {
        await connection.execute(
          'INSERT INTO user_wellness_activities (user_id, activity_id, duration_minutes, notes, completed_at, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [activity.user_id, activity.activity_id, activity.duration_minutes, activity.notes, activity.completed_at]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate activity for user ${activity.user_id}`);
        } else {
          throw error;
        }
      }
    }

    // Add sample water tracking data
    console.log('Adding sample water tracking data...');
    const waterData = [
      {
        user_id: 1,
        amount_ml: 2000,
        water_intake: 2000,
        target_water: 2500,
        tracking_date: '2025-01-15',
        tracking_time: '08:00:00',
        notes: 'Daily water intake'
      },
      {
        user_id: 1,
        amount_ml: 1800,
        water_intake: 1800,
        target_water: 2500,
        tracking_date: '2025-01-14',
        tracking_time: '08:00:00',
        notes: 'Daily water intake'
      },
      {
        user_id: 2,
        amount_ml: 2200,
        water_intake: 2200,
        target_water: 2000,
        tracking_date: '2025-01-15',
        tracking_time: '08:00:00',
        notes: 'Daily water intake'
      }
    ];

    for (const water of waterData) {
      try {
        await connection.execute(
          'INSERT INTO water_tracking (user_id, amount_ml, water_intake, target_water, tracking_date, tracking_time, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [water.user_id, water.amount_ml, water.water_intake, water.target_water, water.tracking_date, water.tracking_time, water.notes]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate water entry for user ${water.user_id} on ${water.tracking_date}`);
        } else {
          throw error;
        }
      }
    }

    console.log('Sample data added successfully!');

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
addSampleData();
