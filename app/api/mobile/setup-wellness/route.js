import { NextResponse } from 'next/server';
import { getMobileUserFromRequest } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

// Fungsi untuk menghitung usia dari tanggal lahir
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// GET - Check wellness setup status
export async function GET(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Cek apakah user sudah join wellness program
    const [userResult] = await query(
      'SELECT wellness_program_joined, wellness_join_date, fitness_goal, activity_level FROM mobile_users WHERE id = ?',
      [user.id]
    );

    if (!userResult) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Cek apakah user sudah memiliki data kesehatan di health_data
    const healthDataResult = await query(
      'SELECT data_type, value, unit FROM health_data WHERE user_id = ? AND data_type IN ("weight", "height") ORDER BY measured_at DESC',
      [user.id]
    );

    const hasHealthData = healthDataResult && healthDataResult.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        wellness_program_joined: userResult.wellness_program_joined || false,
        wellness_join_date: userResult.wellness_join_date,
        fitness_goal: userResult.fitness_goal,
        activity_level: userResult.activity_level,
        has_health_data: hasHealthData,
        needs_setup: !userResult.wellness_program_joined || !hasHealthData
      }
    });

  } catch (error) {
    console.error('Setup wellness GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Setup wellness program
export async function POST(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 Setup wellness POST - User ID: ${user.id}`);

    const body = await request.json();
    const { weight, height, gender, activity_level, fitness_goal, program_duration } = body;

    console.log(`📊 Request body:`, { weight, height, gender, activity_level, fitness_goal, program_duration });

    // Validasi input
    if (!weight || !height || !gender || !activity_level || !fitness_goal || !program_duration) {
      const missingFields = [];
      if (!weight) missingFields.push('weight');
      if (!height) missingFields.push('height');
      if (!gender) missingFields.push('gender');
      if (!activity_level) missingFields.push('activity_level');
      if (!fitness_goal) missingFields.push('fitness_goal');
      if (!program_duration) missingFields.push('program_duration');
      
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return NextResponse.json({ 
        success: false, 
        message: `Semua field harus diisi: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validasi nilai
    if (weight <= 0 || height <= 0) {
      console.log(`❌ Invalid values - weight: ${weight}, height: ${height}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Berat badan dan tinggi badan harus lebih dari 0' 
      }, { status: 400 });
    }

    // Validasi durasi program
    if (program_duration < 7 || program_duration > 365) {
      console.log(`❌ Invalid program duration: ${program_duration}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Durasi program harus antara 7-365 hari' 
      }, { status: 400 });
    }

    // Ambil tanggal lahir user untuk perhitungan usia
    const [userResult] = await query(
      'SELECT date_of_birth FROM mobile_users WHERE id = ?',
      [user.id]
    );

    if (!userResult) {
      console.log(`❌ User not found - ID: ${user.id}`);
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    console.log(`📅 User date_of_birth: ${userResult.date_of_birth}`);

    // Hitung usia otomatis dari tanggal lahir
    const age = calculateAge(userResult.date_of_birth);
    
    if (age === null) {
      console.log(`❌ No date_of_birth found for user ID: ${user.id}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Tanggal lahir tidak ditemukan. Silakan update profil terlebih dahulu.' 
      }, { status: 400 });
    }

    console.log(`✅ Calculated age: ${age}`);

    try {
      // 1. Simpan data berat badan ke health_data
      await query(
        'INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source) VALUES (?, ?, ?, ?, NOW(), ?)',
        [user.id, 'weight', weight, 'kg', 'manual']
      );

      // 2. Simpan data tinggi badan ke health_data
      await query(
        'INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source) VALUES (?, ?, ?, ?, NOW(), ?)',
        [user.id, 'height', height, 'cm', 'manual']
      );

      // 3. Update mobile_users dengan data wellness dan increment cycle
      // Check if user is joining for the first time or renewing
      const [currentUser] = await query(
        'SELECT wellness_program_joined, wellness_program_cycles FROM mobile_users WHERE id = ?',
        [user.id]
      );
      
      let newCycleCount = 1; // Default for first time join
      if (currentUser && currentUser.wellness_program_joined) {
        // User is renewing, increment existing cycles
        newCycleCount = (currentUser.wellness_program_cycles || 0) + 1;
        console.log(`🔄 User renewing wellness program. Previous cycles: ${currentUser.wellness_program_cycles}, New cycles: ${newCycleCount}`);
      } else {
        console.log(`🎯 User joining wellness program for the first time. Setting cycles to: ${newCycleCount}`);
      }
      
      await query(
        `UPDATE mobile_users 
         SET wellness_program_joined = ?, 
             wellness_join_date = NOW(), 
             wellness_program_duration = ?, 
             wellness_program_end_date = DATE_ADD(NOW(), INTERVAL ? DAY),
             wellness_program_completed = FALSE,
             wellness_program_completion_date = NULL,
             wellness_program_cycles = ?,
             fitness_goal = ?, 
             activity_level = ? 
         WHERE id = ?`,
        [true, program_duration, program_duration, newCycleCount, fitness_goal, activity_level, user.id]
      );

      console.log(`✅ Wellness setup completed for user ID: ${user.id}`);

      return NextResponse.json({
        success: true,
        message: 'Wellness program berhasil disetup!',
        data: {
          age: age,
          weight: weight,
          height: height,
          gender: gender,
          activity_level: activity_level,
          fitness_goal: fitness_goal,
          program_duration: program_duration,
          wellness_program_joined: true,
          wellness_join_date: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in wellness setup:', error);
      throw error;
    }

  } catch (error) {
    console.error('Setup wellness POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update wellness data
export async function PUT(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weight, height, fitness_goal, activity_level } = body;

    try {
      // Update data berat badan jika ada
      if (weight && weight > 0) {
        await query(
          'INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source) VALUES (?, ?, ?, ?, NOW(), ?)',
          [user.id, 'weight', weight, 'kg', 'manual']
        );
      }

      // Update data tinggi badan jika ada
      if (height && height > 0) {
        await query(
          'INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source) VALUES (?, ?, ?, ?, NOW(), ?)',
          [user.id, 'height', height, 'cm', 'manual']
        );
      }

      // Update wellness settings
      const updateFields = [];
      const updateValues = [];

      if (fitness_goal) {
        updateFields.push('fitness_goal = ?');
        updateValues.push(fitness_goal);
      }

      if (activity_level) {
        updateFields.push('activity_level = ?');
        updateValues.push(activity_level);
      }

      if (updateFields.length > 0) {
        updateValues.push(user.id);
        await query(
          `UPDATE mobile_users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Data wellness berhasil diupdate!'
      });

    } catch (error) {
      console.error('Error in wellness update:', error);
      throw error;
    }

  } catch (error) {
    console.error('Update wellness PUT error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
