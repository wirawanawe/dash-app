import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [healthData] = await query(`
      SELECT 
        hd.*,
        u.name as user_name,
        u.email as user_email
      FROM health_data hd
      LEFT JOIN mobile_users u ON hd.user_id = u.id
      WHERE hd.id = ?
    `, [id]);

    if (healthData.length === 0) {
      return NextResponse.json(
        { message: 'Health data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      healthData: healthData[0]
    });

  } catch (error) {

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { user_id, data_type, value, unit, recorded_at, notes } = body;

    // Check if health data exists
    const [existingHealthData] = await query('SELECT id FROM health_data WHERE id = ?', [id]);
    if (existingHealthData.length === 0) {
      return NextResponse.json(
        { message: 'Health data not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!user_id || !data_type || !value) {
      return NextResponse.json(
        { message: 'User ID, data type, and value are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [userExists] = await query('SELECT id FROM mobile_users WHERE id = ?', [user_id]);
    if (userExists.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Validate data type
    const validDataTypes = ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight', 'temperature', 'oxygen_saturation'];
    if (!validDataTypes.includes(data_type)) {
      return NextResponse.json(
        { message: 'Invalid data type' },
        { status: 400 }
      );
    }

    // Update health data
    const updateQuery = `
      UPDATE health_data 
      SET user_id = ?, data_type = ?, value = ?, unit = ?, recorded_at = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, [
      user_id,
      data_type,
      value,
      unit || null,
      recorded_at || null,
      notes || null,
      id
    ]);

    // Get the updated health data with joined data
    const [updatedHealthData] = await query(`
      SELECT 
        hd.*,
        u.name as user_name,
        u.email as user_email
      FROM health_data hd
      LEFT JOIN mobile_users u ON hd.user_id = u.id
      WHERE hd.id = ?
    `, [id]);

    return NextResponse.json({
      message: 'Health data updated successfully',
      healthData: updatedHealthData[0]
    });

  } catch (error) {

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if health data exists
    const [existingHealthData] = await query('SELECT id FROM health_data WHERE id = ?', [id]);
    if (existingHealthData.length === 0) {
      return NextResponse.json(
        { message: 'Health data not found' },
        { status: 404 }
      );
    }

    // Delete health data
    await query('DELETE FROM health_data WHERE id = ?', [id]);

    return NextResponse.json({
      message: 'Health data deleted successfully'
    });

  } catch (error) {

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 