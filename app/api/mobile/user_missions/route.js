import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(u.name LIKE ? OR u.email LIKE ? OR m.title LIKE ? OR m.category LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      whereConditions.push(`um.status = ?`);
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_missions um
      LEFT JOIN mobile_users u ON um.user_id = u.id
      LEFT JOIN missions m ON um.mission_id = m.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated data
    const dataQuery = `
      SELECT 
        um.*,
        u.name as user_name,
        u.email as user_email,
        m.title as mission_title,
        m.category as mission_category,
        m.description as mission_description
      FROM user_missions um
      LEFT JOIN mobile_users u ON um.user_id = u.id
      LEFT JOIN missions m ON um.mission_id = m.id
      ${whereClause}
      ORDER BY um.created_at DESC
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
    
    const userMissions = await rawQuery(finalQuery);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      userMissions,
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
    console.error('Error fetching user missions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, mission_id, status, progress, start_date, end_date, notes } = body;

    // Validate required fields
    if (!user_id || !mission_id) {
      return NextResponse.json(
        { message: 'User ID and Mission ID are required' },
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

    // Check if mission exists
    const missionExists = await query('SELECT id FROM missions WHERE id = ?', [mission_id]);
    if (missionExists.length === 0) {
      return NextResponse.json(
        { message: 'Mission not found' },
        { status: 404 }
      );
    }

    // Check if user mission already exists
    const existingUserMission = await query(
      'SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ?',
      [user_id, mission_id]
    );

    if (existingUserMission.length > 0) {
      return NextResponse.json(
        { message: 'User mission already exists' },
        { status: 409 }
      );
    }

    // Insert new user mission
    const insertQuery = `
      INSERT INTO user_missions (user_id, mission_id, status, progress, start_date, end_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(insertQuery, [
      user_id,
      mission_id,
      status || 'pending',
      progress || 0,
      start_date || null,
      end_date || null,
      notes || null
    ]);

    // Get the created user mission with joined data
    const newUserMission = await query(`
      SELECT 
        um.*,
        u.name as user_name,
        u.email as user_email,
        m.title as mission_title,
        m.category as mission_category,
        m.description as mission_description
      FROM user_missions um
      LEFT JOIN mobile_users u ON um.user_id = u.id
      LEFT JOIN missions m ON um.mission_id = m.id
      WHERE um.id = ?
    `, [result.insertId]);

    return NextResponse.json({
      message: 'User mission created successfully',
      userMission: newUserMission[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user mission:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 