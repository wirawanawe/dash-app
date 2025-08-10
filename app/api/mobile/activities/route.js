import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (activity_name LIKE ? OR activity_type LIKE ? OR activity_category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND activity_category = ?';
      params.push(category);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM wellness_activities ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get activities with pagination
    const sql = `
      SELECT 
        id,
        user_id,
        activity_id,
        activity_name,
        activity_type,
        activity_category,
        duration,
        points_earned,
        notes,
        completed_at,
        mood_before,
        mood_after,
        stress_level_before,
        stress_level_after,
        created_at,
        updated_at
      FROM wellness_activities 
      ${whereClause}
      ORDER BY completed_at DESC 
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
      user_id,
      activity_id,
      activity_name,
      activity_type,
      activity_category,
      duration,
      points_earned,
      notes,
      mood_before,
      mood_after,
      stress_level_before,
      stress_level_after
    } = body;

    const sql = `
      INSERT INTO wellness_activities (
        user_id, activity_id, activity_name, activity_type, activity_category,
        duration, points_earned, notes, mood_before, mood_after,
        stress_level_before, stress_level_after
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      user_id, activity_id, activity_name, activity_type, activity_category,
      duration, points_earned, notes, mood_before, mood_after,
      stress_level_before, stress_level_after
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
      user_id,
      activity_id,
      activity_name,
      activity_type,
      activity_category,
      duration,
      points_earned,
      notes,
      mood_before,
      mood_after,
      stress_level_before,
      stress_level_after
    } = body;

    const sql = `
      UPDATE wellness_activities SET
        user_id = ?, activity_id = ?, activity_name = ?, activity_type = ?,
        activity_category = ?, duration = ?, points_earned = ?, notes = ?,
        mood_before = ?, mood_after = ?, stress_level_before = ?, stress_level_after = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [
      user_id, activity_id, activity_name, activity_type,
      activity_category, duration, points_earned, notes,
      mood_before, mood_after, stress_level_before, stress_level_after,
      id
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