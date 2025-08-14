import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE mu.name LIKE ? OR mu.email LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    // Get users from mobile_users table only (since it has wellness data)
    const countSql = `SELECT COUNT(*) as total FROM mobile_users mu ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get users with wellness data from mobile_users table and join with health_data for height/weight
    const sql = `
      SELECT 
        mu.id,
        mu.name,
        mu.email,
        mu.phone,
        mu.date_of_birth,
        mu.gender,
        mu.emergency_contact_name,
        mu.emergency_contact_phone,
        mu.is_active,
        mu.wellness_program_joined,
        mu.wellness_join_date,
        mu.activity_level,
        mu.fitness_goal,
        mu.created_at,
        mu.updated_at,
        MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
        MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
      FROM mobile_users mu
      LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
      ${whereClause}
      GROUP BY mu.id
      ORDER BY mu.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    // Use raw query to avoid parameter binding issues with LIMIT/OFFSET
    let finalQuery = sql;
    
    // Replace parameter placeholders with actual values
    params.forEach((param) => {
      const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
      finalQuery = finalQuery.replace('?', value);
    });
    
    // Replace LIMIT and OFFSET placeholders
    finalQuery = finalQuery.replace('?', parseInt(limit, 10)).replace('?', parseInt(offset, 10));
    
    const users = await rawQuery(finalQuery);
    
    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mobile users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mobile users', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      date_of_birth,
      gender,
      height,
      weight,
      emergency_contact_name,
      emergency_contact_phone
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Insert new user (without height and weight - these go to health_data table)
    const insertSql = `
      INSERT INTO mobile_users (
        name, email, phone, password, date_of_birth, gender,
        emergency_contact_name, emergency_contact_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertSql, [
      name, email, phone, password, date_of_birth, gender,
      emergency_contact_name, emergency_contact_phone
    ]);

    const userId = result.insertId;

    // Insert height and weight into health_data table if provided
    if (height && height > 0) {
      await query(
        'INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source) VALUES (?, ?, ?, ?, NOW(), ?)',
        [userId, 'height', height, 'cm', 'manual']
      );
    }

    if (weight && weight > 0) {
      await query(
        'INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source) VALUES (?, ?, ?, ?, NOW(), ?)',
        [userId, 'weight', weight, 'kg', 'manual']
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Error creating mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to create mobile user' },
      { status: 500 }
    );
  }
} 