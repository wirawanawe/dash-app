import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    console.log('API endpoint called: /api/mobile/activities-api');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_active = 1';
    let params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM available_wellness_activities ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    console.log('Total activities found:', total);

    // Get activities with pagination
    const sql = `
      SELECT 
        id,
        title,
        description,
        category,
        duration_minutes,
        difficulty,
        points,
        is_active,
        created_at,
        updated_at
      FROM available_wellness_activities 
      ${whereClause}
      ORDER BY created_at DESC 
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
    
    const activities = await rawQuery(finalQuery);

    console.log('Activities fetched:', activities.length);

    // Return in the format expected by frontend
    return NextResponse.json({
      success: true,
      activities: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch activities',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      duration_minutes,
      difficulty,
      points,
      is_active = 1
    } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Title, description, and category are required'
        },
        { status: 400 }
      );
    }

    // Insert into available_wellness_activities table
    const sql = `
      INSERT INTO available_wellness_activities (
        title, description, category, duration_minutes, difficulty, points, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      title, description, category, duration_minutes || null, 
      difficulty || null, points || 0, is_active
    ]);

    return NextResponse.json({
      success: true,
      message: 'Activity created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to create activity',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      category,
      duration_minutes,
      difficulty,
      points,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Activity ID is required'
        },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE available_wellness_activities SET
        title = ?, description = ?, category = ?, duration_minutes = ?,
        difficulty = ?, points = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [
      title, description, category, duration_minutes, 
      difficulty, points, is_active, id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to update activity',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 