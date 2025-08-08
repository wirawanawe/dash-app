import { NextResponse } from 'next/server';
import { getMobileUserFromRequest } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

// GET - Get user health data
export async function GET(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type'); // Optional filter by data type
    const limit = parseInt(searchParams.get('limit')) || 10;

    let sql = `
      SELECT 
        hd.id,
        hd.data_type,
        hd.value,
        hd.unit,
        hd.measured_at,
        hd.source,
        hd.created_at,
        mu.date_of_birth,
        mu.gender,
        mu.fitness_goal,
        mu.activity_level
      FROM health_data hd
      LEFT JOIN mobile_users mu ON hd.user_id = mu.id
      WHERE hd.user_id = ?
    `;
    
    const params = [user.id];

    if (dataType) {
      sql += ' AND hd.data_type = ?';
      params.push(dataType);
    }

    sql += ' ORDER BY hd.measured_at DESC LIMIT ?';
    params.push(limit);

    const [healthData] = await query(sql, params);

    // Hitung usia dari tanggal lahir
    let age = null;
    if (healthData && healthData.length > 0 && healthData[0].date_of_birth) {
      const today = new Date();
      const birthDate = new Date(healthData[0].date_of_birth);
      
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Kelompokkan data berdasarkan tipe
    const groupedData = {};
    if (healthData) {
      healthData.forEach(record => {
        if (!groupedData[record.data_type]) {
          groupedData[record.data_type] = [];
        }
        groupedData[record.data_type].push({
          id: record.id,
          value: record.value,
          unit: record.unit,
          measured_at: record.measured_at,
          source: record.source,
          created_at: record.created_at
        });
      });
    }

    // Ambil data terbaru untuk setiap tipe
    const latestData = {};
    Object.keys(groupedData).forEach(type => {
      if (groupedData[type].length > 0) {
        latestData[type] = groupedData[type][0]; // Data terbaru (sudah diurutkan DESC)
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        age: age,
        gender: healthData && healthData.length > 0 ? healthData[0].gender : null,
        fitness_goal: healthData && healthData.length > 0 ? healthData[0].fitness_goal : null,
        activity_level: healthData && healthData.length > 0 ? healthData[0].activity_level : null,
        latest_data: latestData,
        all_data: groupedData
      }
    });

  } catch (error) {
    console.error('Get health data error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new health data
export async function POST(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data_type, value, unit, notes, source = 'manual' } = body;

    // Validasi input
    if (!data_type || !value || !unit) {
      return NextResponse.json({ 
        success: false, 
        message: 'data_type, value, dan unit harus diisi' 
      }, { status: 400 });
    }

    // Validasi data_type
    const validDataTypes = ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'bmi', 'blood_sugar', 'cholesterol'];
    if (!validDataTypes.includes(data_type)) {
      return NextResponse.json({ 
        success: false, 
        message: `data_type harus salah satu dari: ${validDataTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validasi nilai
    if (value <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Value harus lebih dari 0' 
      }, { status: 400 });
    }

    // Insert data kesehatan
    const [result] = await query(
      'INSERT INTO health_data (user_id, data_type, value, unit, notes, measured_at, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())',
      [user.id, data_type, value, unit, notes || null, source]
    );

    return NextResponse.json({
      success: true,
      message: 'Data kesehatan berhasil ditambahkan!',
      data: {
        id: result.insertId,
        data_type,
        value,
        unit,
        notes,
        source,
        measured_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Add health data error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 