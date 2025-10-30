import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      user_id,
      mood,
      energy_level,
      recorded_at,
      notes
    } = body;

    // Validate required fields
    if (!user_id || !mood) {
      return NextResponse.json(
        { error: 'User ID and mood are required' },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE mood_tracking 
      SET user_id = ?, mood = ?, energy_level = ?, recorded_at = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const result = await query(sql, [
      user_id,
      mood,
      energy_level || null,
      recorded_at || new Date().toISOString(),
      notes || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Mood tracking record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mood tracking data updated successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update mood tracking data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const sql = 'DELETE FROM mood_tracking WHERE id = ?';
    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Mood tracking record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mood tracking data deleted successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete mood tracking data' },
      { status: 500 }
    );
  }
} 