import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (hd.notes LIKE ? OR mu.name LIKE ? OR mu.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) {
      whereClause += ' AND hd.data_type = ?';
      params.push(type);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM health_data hd
      LEFT JOIN mobile_users mu ON hd.user_id = mu.id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get health data with pagination
    const sql = `
      SELECT 
        hd.id,
        hd.user_id,
        hd.data_type,
        hd.value,
        hd.unit,
        hd.recorded_date,
        hd.notes,
        hd.created_at,
        hd.updated_at,
        mu.name as user_name,
        mu.email as user_email
      FROM health_data hd
      LEFT JOIN mobile_users mu ON hd.user_id = mu.id
      ${whereClause}
      ORDER BY hd.recorded_date DESC 
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
    
    const healthData = await rawQuery(finalQuery);

    return NextResponse.json({
      success: true,
      healthData: healthData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch health data',
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
      data_type,
      value,
      unit,
      recorded_date,
      notes
    } = body;

    // Validate required fields
    if (!user_id || !data_type || value === undefined || value === null) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID, data type, and value are required' 
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO health_data (
        user_id, data_type, value, unit, recorded_date, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        unit = VALUES(unit),
        notes = VALUES(notes),
        updated_at = NOW()
    `;

    const result = await query(sql, [
      user_id,
      data_type,
      value,
      unit || null,
      recorded_date || new Date().toISOString().split('T')[0],
      notes || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Health data created successfully',
      data: {
        id: result.insertId,
        user_id,
        data_type,
        value,
        recorded_date: recorded_date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error creating health data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create health data',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 