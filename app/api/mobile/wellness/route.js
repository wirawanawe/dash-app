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
    
    // Ensure limit and offset are numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    
    let whereClause = '';
    const params = [];
    
    if (search || category) {
      whereClause = 'WHERE ';
      const conditions = [];
      
      if (search) {
        conditions.push('(title LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      
      whereClause += conditions.join(' AND ');
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM master_wellness_activities ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;
    
    // Get activities with pagination
    const activitiesQuery = `
      SELECT 
        id, title, description, category, duration_minutes, 
        difficulty, points, is_active, created_at, updated_at
      FROM master_wellness_activities 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Use raw query to avoid parameter binding issues with LIMIT/OFFSET
    let finalQuery = activitiesQuery;
    
    // Replace parameter placeholders with actual values
    params.forEach((param) => {
      const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
      finalQuery = finalQuery.replace('?', value);
    });
    
    // Replace LIMIT and OFFSET placeholders
    finalQuery = finalQuery.replace('?', limitNum).replace('?', offsetNum);
    
    const activities = await rawQuery(finalQuery);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      activities,
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
    console.error('Error fetching wellness activities:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch wellness activities' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      duration_minutes,
      difficulty,
      points,
      is_active = true
    } = body;
    
    // Validation
    if (!name || !description || !category) {
      return NextResponse.json(
        { success: false, message: 'Name, description, and category are required' },
        { status: 400 }
      );
    }
    
    const insertQuery = `
      INSERT INTO wellness_activities (
        title, description, category, duration_minutes, 
        difficulty, points, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const result = await query(insertQuery, [
      name, description, category, duration_minutes || null,
      difficulty || 'medium', points || 0, is_active
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Wellness activity created successfully',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creating wellness activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create wellness activity' },
      { status: 500 }
    );
  }
} 