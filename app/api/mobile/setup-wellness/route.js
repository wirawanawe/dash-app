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

    const body = await request.json();
    const { weight, height, gender, activity_level, fitness_goal } = body;

    // Validasi input
    if (!weight || !height || !gender || !activity_level || !fitness_goal) {
      return NextResponse.json({ 
        success: false, 
        message: 'Semua field harus diisi: weight, height, gender, activity_level, fitness_goal' 
      }, { status: 400 });
    }

    // Validasi nilai
    if (weight <= 0 || height <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Berat badan dan tinggi badan harus lebih dari 0' 
      }, { status: 400 });
    }

    // Ambil tanggal lahir user untuk perhitungan usia
    const [userResult] = await query(
      'SELECT date_of_birth FROM mobile_users WHERE id = ?',
      [user.id]
    );

    if (!userResult) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Hitung usia otomatis dari tanggal lahir
    const age = calculateAge(userResult.date_of_birth);
    
    if (age === null) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tanggal lahir tidak ditemukan. Silakan update profil terlebih dahulu.' 
      }, { status: 400 });
    }

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

      // 3. Update mobile_users dengan data wellness
      await query(
        'UPDATE mobile_users SET wellness_program_joined = ?, wellness_join_date = NOW(), fitness_goal = ?, activity_level = ? WHERE id = ?',
        [true, fitness_goal, activity_level, user.id]
      );

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
