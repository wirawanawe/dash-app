import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const activityQuery = `
      SELECT 
        id, name, description, category, duration_minutes, 
        calories_burn, difficulty_level, instructions, 
        image_url, is_active, created_at, updated_at
      FROM wellness_activities 
      WHERE id = ?
    `;
    
    const activities = await query(activityQuery, [id]);
    
    if (activities.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Wellness activity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      activity: activities[0]
    });
    
  } catch (error) {
    console.error('Error fetching wellness activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch wellness activity' },
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
      description,
      category,
      duration_minutes,
      calories_burn,
      difficulty_level,
      instructions,
      image_url,
      is_active
    } = body;
    
    // Check if activity exists
    const checkQuery = 'SELECT id FROM wellness_activities WHERE id = ?';
    const existing = await query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Wellness activity not found' },
        { status: 404 }
      );
    }
    
    // Validation
    if (!name || !description || !category) {
      return NextResponse.json(
        { success: false, message: 'Name, description, and category are required' },
        { status: 400 }
      );
    }
    
    const updateQuery = `
      UPDATE wellness_activities SET
        name = ?, description = ?, category = ?, duration_minutes = ?,
        calories_burn = ?, difficulty_level = ?, instructions = ?,
        image_url = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    // Ensure is_active is properly converted to boolean
    const validatedIsActive = is_active === true || is_active === 1 || is_active === 'true' || is_active === '1';

    await query(updateQuery, [
      name, description, category, duration_minutes || null,
      calories_burn || null, difficulty_level || 'beginner',
      instructions || null, image_url || null, validatedIsActive, id
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Wellness activity updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating wellness activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update wellness activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check if activity exists
    const checkQuery = 'SELECT id FROM wellness_activities WHERE id = ?';
    const existing = await query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Wellness activity not found' },
        { status: 404 }
      );
    }
    
    const deleteQuery = 'DELETE FROM wellness_activities WHERE id = ?';
    await query(deleteQuery, [id]);
    
    return NextResponse.json({
      success: true,
      message: 'Wellness activity deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting wellness activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete wellness activity' },
      { status: 500 }
    );
  }
} 