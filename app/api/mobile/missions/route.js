import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    // Build WHERE clause
    let whereConditions = ['is_active = 1'];
    let params = [];

    if (search) {
      whereConditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get missions
    const sql = `
      SELECT 
        id,
        title,
        description,
        category,
        sub_category,
        points,
        target_value,
        unit,
        CONCAT(target_value, ' ', unit) as duration,
        is_active,
        type,
        difficulty,
        icon,
        color,
        tracking_mapping,
        created_at,
        updated_at
      FROM missions 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const missions = await query(sql, params);

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total 
      FROM missions 
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get pagination parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const totalPages = Math.ceil(total / limit);

    // Return in the format expected by frontend
    return NextResponse.json({
      success: true,
      data: missions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch missions',
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
      points,
      target_value,
      unit,
      type = 'daily',
      difficulty = 'easy',
      icon,
      color,
      is_active = true
    } = body;

    // Validate required fields
    if (!title || !description || !category || !points || !target_value) {
      return NextResponse.json(
        { error: 'Title, description, category, points, and target_value are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO missions (
        title, description, category, points, target_value,
        unit, type, difficulty, icon, color, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      title, description, category, points, target_value,
      unit || null, type || 'daily', difficulty || 'easy', icon || null, color || null, is_active
    ]);

    return NextResponse.json({
      success: true,
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