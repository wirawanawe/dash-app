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
        points,
        duration_days,
        target_value,
        target_unit,
        is_active,
        created_at,
        updated_at
      FROM missions 
      WHERE id = ?
    `;

    const missions = await query(sql, [id]);

    if (missions.length === 0) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(missions[0]);
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch mission' },
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
      duration_days,
      target_value,
      target_unit,
      is_active
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
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
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    const sql = `
      UPDATE missions SET
        title = ?,
        description = ?,
        category = ?,
        points = ?,
        duration_days = ?,
        target_value = ?,
        target_unit = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    // Ensure is_active is properly converted to boolean
    const validatedIsActive = is_active === true || is_active === 1 || is_active === 'true' || is_active === '1';

    await query(sql, [
      title, description, category, points, duration_days,
      target_value, target_unit, validatedIsActive, id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mission updated successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update mission' },
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
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await query(
      'UPDATE missions SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      message: 'Mission deleted successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete mission' },
      { status: 500 }
    );
  }
} 