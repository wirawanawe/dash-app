import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const mood = searchParams.get('mood') || '';
    const date = searchParams.get('date') || ''; // Add date parameter support
    const user_id = searchParams.get('user_id') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // Add user_id filter if provided
    if (user_id) {
      whereClause += ' AND mt.user_id = ?';
      params.push(user_id);
    }

    // Add date filter if provided
    if (date) {
      whereClause += " AND DATE(CONVERT_TZ(mt.tracking_date, '+00:00', '+07:00')) = ?";
      params.push(date);
    }

    if (search) {
      whereClause += ' AND (mt.notes LIKE ? OR mu.name LIKE ? OR mu.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (mood) {
      whereClause += ' AND mt.mood_level = ?';
      params.push(mood);
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
        mt.mood_score,
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
        mu.name as user_name,
        mu.email as user_email
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
      data: {
        entries: moodData,
        total_entries: total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching mood tracking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch mood tracking data',
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
      mood_level,
      mood_score,
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
    if (!user_id || !mood_level) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID and mood level are required' 
        },
        { status: 400 }
      );
    }

    // Calculate mood_score based on mood_level if not provided
    let calculatedMoodScore = mood_score;
    if (!calculatedMoodScore) {
      const moodScores = {
        'very_happy': 10,
        'happy': 8,
        'neutral': 5,
        'sad': 3,
        'very_sad': 1
      };
      calculatedMoodScore = moodScores[mood_level] || 5;
    }

    const sql = `
      INSERT INTO mood_tracking (
        user_id, mood_level, mood_score, stress_level, energy_level, sleep_quality, 
        tracking_date, notes, activities, weather, location, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        mood_level = VALUES(mood_level),
        mood_score = VALUES(mood_score),
        stress_level = VALUES(stress_level),
        energy_level = VALUES(energy_level),
        sleep_quality = VALUES(sleep_quality),
        notes = VALUES(notes),
        activities = VALUES(activities),
        weather = VALUES(weather),
        location = VALUES(location),
        updated_at = NOW()
    `;

    // Ensure tracking_date is in the correct format
    const finalTrackingDate = tracking_date || new Date().toISOString().split('T')[0];
    console.log('🔍 Inserting mood with tracking_date:', finalTrackingDate);
    
    const result = await query(sql, [
      user_id,
      mood_level,
      calculatedMoodScore,
      stress_level || null,
      energy_level || null,
      sleep_quality || null,
      finalTrackingDate,
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
        user_id,
        mood_level,
        tracking_date: tracking_date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error creating mood tracking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create mood tracking data',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 