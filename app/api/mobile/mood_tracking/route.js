import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const mood = searchParams.get('mood') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search || mood) {
      const conditions = [];
      if (search) {
        conditions.push('(notes LIKE ? OR user_id IN (SELECT id FROM mobile_users WHERE name LIKE ?))');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (mood) {
        conditions.push('mood = ?');
        params.push(mood);
      }
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM mood_tracking ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get mood data with pagination
    const sql = `
      SELECT 
        mt.id,
        mt.user_id,
        mt.mood,
        mt.energy_level,
        mt.recorded_at,
        mt.notes,
        mt.created_at,
        mt.updated_at,
        mu.name as user_name
      FROM mood_tracking mt
      LEFT JOIN mobile_users mu ON mt.user_id = mu.id
      ${whereClause}
      ORDER BY mt.recorded_at DESC 
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
      moodData,
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
      { error: 'Failed to fetch mood tracking data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      mood,
      energy_level,
      recorded_at,
      notes
    } = body;

    // Validate required fields
    if (!user_id || !mood) {
      return NextResponse.json(
        { error: 'User ID and mood are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO mood_tracking (
        user_id, mood, energy_level, recorded_at, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      user_id,
      mood,
      energy_level || null,
      recorded_at || new Date().toISOString(),
      notes || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mood tracking data created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating mood tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to create mood tracking data' },
      { status: 500 }
    );
  }
} 