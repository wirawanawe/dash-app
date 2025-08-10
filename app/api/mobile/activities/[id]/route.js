import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const sql = 'DELETE FROM wellness_activities WHERE id = ?';
    await query(sql, [id]);

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
      user_id,
      activity_id,
      activity_name,
      activity_type,
      activity_category,
      duration,
      points_earned,
      notes,
      mood_before,
      mood_after,
      stress_level_before,
      stress_level_after
    } = body;

    console.log('Received mood_before:', mood_before, typeof mood_before);
    console.log('Received stress_level_before:', stress_level_before, typeof stress_level_before);

    // Convert numeric mood values to ENUM values
    const convertMoodValue = (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      
      if (typeof value === 'number') {
        switch (value) {
          case 1: return 'very_sad';
          case 2: return 'sad';
          case 3: return 'neutral';
          case 4: return 'happy';
          case 5: return 'very_happy';
          default: return 'neutral';
        }
      }
      
      // If it's already a string, validate it's a valid ENUM value
      if (typeof value === 'string') {
        const validMoodValues = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'];
        if (validMoodValues.includes(value)) {
          return value;
        }
        // If invalid string, return neutral as default
        return 'neutral';
      }
      
      return 'neutral'; // default fallback
    };

    // Convert numeric stress values to ENUM values
    const convertStressValue = (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      
      if (typeof value === 'number') {
        switch (value) {
          case 1: return 'low';
          case 2: return 'moderate';
          case 3: return 'high';
          case 4: return 'very_high';
          default: return 'moderate';
        }
      }
      
      // If it's already a string, validate it's a valid ENUM value
      if (typeof value === 'string') {
        const validStressValues = ['low', 'moderate', 'high', 'very_high'];
        if (validStressValues.includes(value)) {
          return value;
        }
        // If invalid string, return moderate as default
        return 'moderate';
      }
      
      return 'moderate'; // default fallback
    };

    const convertedMoodBefore = convertMoodValue(mood_before);
    const convertedMoodAfter = convertMoodValue(mood_after);
    const convertedStressBefore = convertStressValue(stress_level_before);
    const convertedStressAfter = convertStressValue(stress_level_after);

    console.log('Converted mood_before:', convertedMoodBefore);
    console.log('Converted stress_level_before:', convertedStressBefore);

    const sql = `
      UPDATE wellness_activities SET
        user_id = ?, activity_id = ?, activity_name = ?, activity_type = ?,
        activity_category = ?, duration = ?, points_earned = ?, notes = ?,
        mood_before = ?, mood_after = ?, stress_level_before = ?, stress_level_after = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [
      user_id, activity_id, activity_name, activity_type,
      activity_category, duration, points_earned, notes,
      convertedMoodBefore, convertedMoodAfter, 
      convertedStressBefore, convertedStressAfter,
      id
    ]);

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

    const sql = 'SELECT * FROM wellness_activities WHERE id = ?';
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