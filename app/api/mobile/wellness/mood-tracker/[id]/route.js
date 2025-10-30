import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { id } = params;
    const body = await request.json();
    const {
      mood_level,
      stress_level,
      energy_level,
      sleep_quality,
      tracking_date,
      notes,
      activities,
      weather,
      location
    } = body;

    // Validate required fields
    if (!mood_level) {
      return NextResponse.json(
        { success: false, error: 'Mood level is required' },
        { status: 400 }
      );
    }

    // First check if the record belongs to the user
    const checkQuery = 'SELECT id FROM mood_tracking WHERE id = ? AND user_id = ?';
    const [checkResult] = await query(checkQuery, [id, userId]);

    if (checkResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mood tracking record not found or access denied' },
        { status: 404 }
      );
    }

    const sql = `
      UPDATE mood_tracking 
      SET mood_level = ?, stress_level = ?, energy_level = ?, sleep_quality = ?, 
          tracking_date = ?, notes = ?, activities = ?, weather = ?, location = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    const result = await query(sql, [
      mood_level,
      stress_level || null,
      energy_level || null,
      sleep_quality || null,
      tracking_date || new Date().toISOString().split('T')[0],
      notes || null,
      activities ? JSON.stringify(activities) : null,
      weather || null,
      location || null,
      id,
      userId
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Mood tracking record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mood tracking data updated successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Failed to update mood tracking data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { id } = params;

    // First check if the record belongs to the user
    const checkQuery = 'SELECT id FROM mood_tracking WHERE id = ? AND user_id = ?';
    const [checkResult] = await query(checkQuery, [id, userId]);

    if (checkResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mood tracking record not found or access denied' },
        { status: 404 }
      );
    }

    const deleteQuery = 'DELETE FROM mood_tracking WHERE id = ? AND user_id = ?';
    const result = await query(deleteQuery, [id, userId]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Mood tracking record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mood tracking data deleted successfully'
    });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Failed to delete mood tracking data' },
      { status: 500 }
    );
  }
}
