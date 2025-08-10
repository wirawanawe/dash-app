import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const mood = searchParams.get('mood') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE mt.user_id = ?';
    let params = [userId];

    if (search || mood) {
      if (search) {
        whereClause += ' AND (mt.notes LIKE ? OR mu.name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (mood) {
        whereClause += ' AND mt.mood_level = ?';
        params.push(mood);
      }
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM mood_tracking mt
      LEFT JOIN mobile_users mu ON mt.user_id = mu.id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get mood data with pagination
    const sql = `
      SELECT 
        mt.id,
        mt.user_id,
        mt.mood_level,
        mt.stress_level,
        mt.energy_level,
        mt.sleep_quality,
        mt.tracking_date,
        mt.notes,
        mt.activities,
        mt.weather,
        mt.location,
        mt.created_at,
        mt.updated_at,
        mu.name as user_name
      FROM mood_tracking mt
      LEFT JOIN mobile_users mu ON mt.user_id = mu.id
      ${whereClause}
      ORDER BY mt.tracking_date DESC 
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
    
    const moodData = await rawQuery(finalQuery);

    return NextResponse.json({
      success: true,
      data: moodData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mood tracking data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mood tracking data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const body = await request.json();
    const {
      mood_level,
      stress_level,
      energy_level,
      sleep_quality,
      tracking_date,
      notes,
      activities,
      weather,
      location
    } = body;

    // Validate required fields
    if (!mood_level) {
      return NextResponse.json(
        { success: false, error: 'Mood level is required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO mood_tracking (
        user_id, mood_level, stress_level, energy_level, sleep_quality, tracking_date, notes, activities, weather, location, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        mood_level = VALUES(mood_level),
        stress_level = VALUES(stress_level),
        energy_level = VALUES(energy_level),
        sleep_quality = VALUES(sleep_quality),
        notes = VALUES(notes),
        activities = VALUES(activities),
        weather = VALUES(weather),
        location = VALUES(location),
        updated_at = NOW()
    `;

    const result = await query(sql, [
      userId,
      mood_level,
      stress_level || null,
      energy_level || null,
      sleep_quality || null,
      tracking_date || new Date().toISOString().split('T')[0],
      notes || null,
      activities ? JSON.stringify(activities) : null,
      weather || null,
      location || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mood tracking data created successfully',
      data: {
        id: result.insertId,
        user_id: userId,
        mood_level,
        tracking_date: tracking_date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error creating mood tracking data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mood tracking data' },
      { status: 500 }
    );
  }
} 