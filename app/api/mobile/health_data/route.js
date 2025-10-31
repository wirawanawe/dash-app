import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryWithPagination } from '@/lib/safeQuery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(u.name LIKE ? OR u.email LIKE ? OR hd.data_type LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (type) {
      whereConditions.push(`hd.data_type = ?`);
      params.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM health_data hd
      LEFT JOIN mobile_users u ON hd.user_id = u.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated data - using safe query with parameter binding
    const baseQuery = `
      SELECT 
        hd.*,
        u.name as user_name,
        u.email as user_email
      FROM health_data hd
      LEFT JOIN mobile_users u ON hd.user_id = u.id
      ${whereClause}
      ORDER BY hd.recorded_at DESC, hd.created_at DESC
    `;

    // Use safe pagination helper to prevent SQL injection
    const healthData = await queryWithPagination(baseQuery, params, limit, offset);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      healthData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, data_type, value, unit, recorded_at, notes } = body;

    // Validate required fields
    if (!user_id || !data_type || !value) {
      return NextResponse.json(
        { message: 'User ID, data type, and value are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await query('SELECT id FROM mobile_users WHERE id = ?', [user_id]);
    if (userExists.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Validate data type
    const validDataTypes = ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight', 'temperature', 'oxygen_saturation'];
    if (!validDataTypes.includes(data_type)) {
      return NextResponse.json(
        { message: 'Invalid data type' },
        { status: 400 }
      );
    }

    // Insert new health data
    const insertQuery = `
      INSERT INTO health_data (user_id, data_type, value, unit, recorded_at, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(insertQuery, [
      user_id,
      data_type,
      value,
      unit || null,
      recorded_at || null,
      notes || null
    ]);

    // Get the created health data with joined data
    const newHealthData = await query(`
      SELECT 
        hd.*,
        u.name as user_name,
        u.email as user_email
      FROM health_data hd
      LEFT JOIN mobile_users u ON hd.user_id = u.id
      WHERE hd.id = ?
    `, [result.insertId]);

    return NextResponse.json({
      message: 'Health data created successfully',
      healthData: newHealthData[0]
    }, { status: 201 });

  } catch (error) {

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 