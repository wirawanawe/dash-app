import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const quality = searchParams.get('quality') || '';
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(u.name LIKE ? OR u.email LIKE ? OR st.sleep_quality LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (quality) {
      whereConditions.push(`st.sleep_quality = ?`);
      params.push(quality);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sleep_tracking st
      LEFT JOIN mobile_users u ON st.user_id = u.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated data
    const dataQuery = `
      SELECT 
        st.*,
        u.name as user_name,
        u.email as user_email
      FROM sleep_tracking st
      LEFT JOIN mobile_users u ON st.user_id = u.id
      ${whereClause}
      ORDER BY st.sleep_date DESC, st.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Use raw query to avoid parameter binding issues with LIMIT/OFFSET
    let finalQuery = dataQuery;
    
    // Replace parameter placeholders with actual values
    params.forEach((param) => {
      const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
      finalQuery = finalQuery.replace('?', value);
    });
    
    // Replace LIMIT and OFFSET placeholders
    finalQuery = finalQuery.replace('?', parseInt(limit, 10)).replace('?', parseInt(offset, 10));
    
    const sleepData = await rawQuery(finalQuery);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      sleepData,
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
    console.error('Error fetching sleep tracking data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, sleep_date, sleep_hours, sleep_minutes, sleep_quality, bedtime, wake_time, notes } = body;

    // Validate required fields
    if (!user_id || !sleep_date || sleep_hours === undefined || sleep_minutes === undefined || !sleep_quality) {
      return NextResponse.json(
        { message: 'User ID, sleep date, sleep hours, sleep minutes, and sleep quality are required' },
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

    // Validate sleep quality
    const validSleepQualities = ['excellent', 'good', 'fair', 'poor'];
    if (!validSleepQualities.includes(sleep_quality)) {
      return NextResponse.json(
        { message: 'Invalid sleep quality' },
        { status: 400 }
      );
    }

    // Validate sleep hours and minutes
    if (sleep_hours < 0 || sleep_hours > 24 || sleep_minutes < 0 || sleep_minutes > 59) {
      return NextResponse.json(
        { message: 'Invalid sleep duration' },
        { status: 400 }
      );
    }

    // Insert new sleep tracking data
    const insertQuery = `
      INSERT INTO sleep_tracking (user_id, sleep_date, sleep_hours, sleep_minutes, sleep_quality, bedtime, wake_time, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(insertQuery, [
      user_id,
      sleep_date,
      sleep_hours,
      sleep_minutes,
      sleep_quality,
      bedtime || null,
      wake_time || null,
      notes || null
    ]);

    // Get the created sleep tracking data with joined data
    const newSleepData = await query(`
      SELECT 
        st.*,
        u.name as user_name,
        u.email as user_email
      FROM sleep_tracking st
      LEFT JOIN mobile_users u ON st.user_id = u.id
      WHERE st.id = ?
    `, [result.insertId]);

    return NextResponse.json({
      message: 'Sleep tracking data created successfully',
      sleepData: newSleepData[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating sleep tracking data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 