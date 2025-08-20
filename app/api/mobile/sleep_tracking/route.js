import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const quality = searchParams.get('quality') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (st.notes LIKE ? OR mu.name LIKE ? OR mu.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (quality) {
      whereClause += ' AND st.sleep_quality = ?';
      params.push(quality);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM sleep_tracking st
      LEFT JOIN mobile_users mu ON st.user_id = mu.id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get sleep data with pagination
    const sql = `
      SELECT 
        st.id,
        st.user_id,
        st.sleep_date,
        st.bedtime,
        st.wake_time,
        st.sleep_hours,
        st.sleep_duration_minutes,
        st.sleep_quality,
        st.sleep_latency_minutes,
        st.wake_up_count,
        st.notes,
        st.created_at,
        st.updated_at,
        mu.name as user_name,
        mu.email as user_email
      FROM sleep_tracking st
      LEFT JOIN mobile_users mu ON st.user_id = mu.id
      ${whereClause}
      ORDER BY st.sleep_date DESC 
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
    
    const sleepData = await rawQuery(finalQuery);

    return NextResponse.json({
      success: true,
      sleepData: sleepData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sleep tracking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch sleep tracking data',
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
      sleep_date,
      bedtime,
      wake_time,
      sleep_hours,
      sleep_minutes,
      sleep_duration_minutes,
      sleep_quality,
      sleep_latency_minutes,
      wake_up_count,
      notes
    } = body;

    // Validate required fields
    if (!user_id || !sleep_date) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID and sleep date are required' 
        },
        { status: 400 }
      );
    }

    // Calculate sleep duration in minutes if not provided
    let calculatedSleepDurationMinutes = sleep_duration_minutes;
    if (sleep_hours !== undefined && sleep_minutes !== undefined) {
      calculatedSleepDurationMinutes = (sleep_hours * 60) + sleep_minutes;
    }

    const sql = `
      INSERT INTO sleep_tracking (
        user_id, sleep_date, bedtime, wake_time, sleep_hours, sleep_duration_minutes,
        sleep_quality, sleep_latency_minutes, wake_up_count, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        bedtime = VALUES(bedtime),
        wake_time = VALUES(wake_time),
        sleep_hours = VALUES(sleep_hours),
        sleep_duration_minutes = VALUES(sleep_duration_minutes),
        sleep_quality = VALUES(sleep_quality),
        sleep_latency_minutes = VALUES(sleep_latency_minutes),
        wake_up_count = VALUES(wake_up_count),
        notes = VALUES(notes),
        updated_at = NOW()
    `;

    const result = await query(sql, [
      user_id,
      sleep_date,
      bedtime || null,
      wake_time || null,
      sleep_hours || null,
      calculatedSleepDurationMinutes || null,
      sleep_quality || null,
      sleep_latency_minutes || null,
      wake_up_count || 0,
      notes || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Sleep tracking data created successfully',
      data: {
        id: result.insertId,
        user_id,
        sleep_date
      }
    });
  } catch (error) {
    console.error('Error creating sleep tracking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create sleep tracking data',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 