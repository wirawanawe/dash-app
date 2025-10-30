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
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM missions ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get missions with pagination
    const sql = `
      SELECT 
        id,
        title,
        description,
        category,
        points,
        duration_days,
        target_value,
        target_unit,
        is_active,
        created_at,
        updated_at
      FROM missions 
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
    
    const missions = await rawQuery(finalQuery);

    return NextResponse.json({
      missions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch missions' },
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
      points,
      duration_days,
      target_value,
      target_unit,
      is_active = true
    } = body;

    // Validate required fields
    if (!title || !description || !category || !points) {
      return NextResponse.json(
        { error: 'Title, description, category, and points are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO missions (
        title, description, category, points, duration_days,
        target_value, target_unit, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      title, description, category, points, duration_days,
      target_value, target_unit, is_active
    ]);

    return NextResponse.json({
      message: 'Mission created successfully',
      missionId: result.insertId
    });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { error: 'Failed to create mission' },
      { status: 500 }
    );
  }
} 