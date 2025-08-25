import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

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
        is_active,
        type,
        difficulty,
        icon,
        color,
        tracking_mapping,
        requirements,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM missions 
      WHERE id = ?
    `;

    const missions = await query(sql, [id]);

    if (missions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: missions[0],
      message: 'Mission retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching mission:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch mission' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      category,
      points,
      target_value,
      unit,
      is_active
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { success: false, error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Check if mission exists
    const existingMission = await query(
      'SELECT id FROM missions WHERE id = ?',
      [id]
    );

    if (existingMission.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    const sql = `
      UPDATE missions SET
        title = ?,
        description = ?,
        category = ?,
        points = ?,
        target_value = ?,
        unit = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    // Ensure is_active is properly converted to boolean
    const validatedIsActive = is_active === true || is_active === 1 || is_active === 'true' || is_active === '1';

    await query(sql, [
      title, description, category, points,
      target_value, unit, validatedIsActive, id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mission updated successfully'
    });
  } catch (error) {
    console.error('Error updating mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update mission' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if mission exists
    const existingMission = await query(
      'SELECT id FROM missions WHERE id = ?',
      [id]
    );

    if (existingMission.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await query(
      'UPDATE missions SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Mission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mission' },
      { status: 500 }
    );
  }
} 