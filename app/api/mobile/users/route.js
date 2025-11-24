import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 20;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be between 1 and 100)' },
        { status: 400 }
      );
    }

    let whereClause = '';
    let params = [];

    if (search && search.trim() !== '') {
      whereClause = 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params = [`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`];
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM mobile_users ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Ensure limit and offset are valid integers (already sanitized)
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const safeOffset = Math.max(0, parseInt(offset, 10));
    
    if (isNaN(safeLimit) || isNaN(safeOffset) || !Number.isInteger(safeLimit) || !Number.isInteger(safeOffset)) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build query with pagination
    // Note: Using direct integer values for LIMIT/OFFSET (already validated)
    // since MySQL's prepared statements may not support parameterized LIMIT/OFFSET
    const sql = [
      'SELECT',
      'id, name, email, phone, date_of_birth, gender,',
      'height, weight, blood_type, emergency_contact_name,',
      'emergency_contact_phone, is_active, created_at, updated_at',
      'FROM mobile_users',
      whereClause,
      'ORDER BY created_at DESC',
      `LIMIT ${safeLimit} OFFSET ${safeOffset}`
    ].filter(Boolean).join(' ');

    // Only WHERE clause parameters (LIMIT/OFFSET are embedded in SQL after validation)
    const allParams = params;

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 GET /api/mobile/users - Query:', {
        sql: sql.substring(0, 200),
        paramsCount: allParams.length,
        params: allParams,
        limit: safeLimit,
        offset: safeOffset
      });
    }

    // Execute query - only WHERE params, LIMIT/OFFSET are in SQL
    const users = await query(sql, allParams);
    
    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error in GET /api/mobile/users:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    return NextResponse.json(
      { 
        error: 'Failed to fetch mobile users',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      date_of_birth,
      gender,
      height,
      weight,
      blood_type,
      emergency_contact_name,
      emergency_contact_phone
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt for security
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO mobile_users (
        name, email, phone, password, date_of_birth, gender,
        height, weight, blood_type, emergency_contact_name,
        emergency_contact_phone, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;

    // Validate blood_type against ENUM values
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const validatedBloodType = blood_type && validBloodTypes.includes(blood_type) ? blood_type : null;

    const result = await query(sql, [
      name, email, phone, hashedPassword, date_of_birth, gender,
      height, weight, validatedBloodType, emergency_contact_name,
      emergency_contact_phone
    ]);

    return NextResponse.json({
      message: 'Mobile user created successfully',
      userId: result.insertId
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create mobile user' },
      { status: 500 }
    );
  }
} 