import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryWithPagination } from '@/lib/safeQuery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM mobile_users ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get users with pagination
    const sql = `
      SELECT 
        id,
        name,
        email,
        phone,
        date_of_birth,
        gender,
        height,
        weight,
        blood_type,
        emergency_contact_name,
        emergency_contact_phone,
        is_active,
        created_at,
        updated_at
      FROM mobile_users 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    // Use safe pagination helper to prevent SQL injection
    const users = await queryWithPagination(sql, params, limit, offset);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch mobile users' },
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