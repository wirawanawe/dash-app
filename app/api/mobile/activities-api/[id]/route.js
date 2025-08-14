import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Soft delete by setting is_active to 0
    const sql = 'UPDATE available_wellness_activities SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Activity not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to delete activity',
        error: error.message 
      },
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
      duration_minutes,
      difficulty,
      points,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Activity ID is required'
        },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE available_wellness_activities SET
        title = ?, description = ?, category = ?, duration_minutes = ?,
        difficulty = ?, points = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await query(sql, [
      title, description, category, duration_minutes, 
      difficulty, points, is_active, id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Activity not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to update activity',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const sql = `
      SELECT 
        id,
        title,
        description,
        category,
        duration_minutes,
        difficulty,
        points,
        is_active,
        created_at,
        updated_at
      FROM available_wellness_activities 
      WHERE id = ? AND is_active = 1
    `;
    const result = await query(sql, [id]);

    if (result.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Activity not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: result[0]
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch activity',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 