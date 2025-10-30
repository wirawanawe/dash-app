import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

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
      WHERE id = ?
    `;

    const users = await query(sql, [id]);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Mobile user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(users[0]);
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch mobile user' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const {
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
      is_active
    } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Mobile user not found' },
        { status: 404 }
      );
    }

    // Check if email already exists for other users
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM mobile_users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const sql = `
      UPDATE mobile_users SET
        name = ?,
        email = ?,
        phone = ?,
        date_of_birth = ?,
        gender = ?,
        height = ?,
        weight = ?,
        blood_type = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    // Validate blood_type against ENUM values
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const validatedBloodType = blood_type && validBloodTypes.includes(blood_type) ? blood_type : null;

    // Ensure is_active is properly converted to boolean
    const validatedIsActive = is_active === true || is_active === 1 || is_active === 'true' || is_active === '1';

    const updateParams = [
      name, email, phone, date_of_birth, gender,
      height, weight, validatedBloodType, emergency_contact_name,
      emergency_contact_phone, validatedIsActive, id
    ];

    const result = await query(sql, updateParams);

    return NextResponse.json({
      success: true,
      message: 'Mobile user updated successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update mobile user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Mobile user not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await query(
      'UPDATE mobile_users SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      message: 'Mobile user deleted successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete mobile user' },
      { status: 500 }
    );
  }
} 