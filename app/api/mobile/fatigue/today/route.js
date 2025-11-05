import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/mobile/fatigue/today
 * Get today's fatigue assessment for a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const sql = `
      SELECT 
        id, user_id, assessment_date, sleep_hours, sleep_quality,
        mood_level, stress_level, energy_level, focus_level,
        physical_activity, activity_type, caffeine_intake,
        fatigue_score, fatigue_level, notes, symptoms,
        created_at, updated_at
      FROM fatigue_tracking
      WHERE user_id = ? AND assessment_date = CURDATE()
      LIMIT 1
    `;

    const result = await query(sql, [user_id]);

    if (result.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No fatigue assessment for today'
      });
    }

    const fatigueData = result[0];
    
    // Parse JSON fields safely
    if (fatigueData.symptoms) {
      try {
        fatigueData.symptoms = JSON.parse(fatigueData.symptoms);
      } catch (e) {
        // If parsing fails, treat as empty array
        fatigueData.symptoms = [];
      }
    } else {
      fatigueData.symptoms = [];
    }

    return NextResponse.json({
      success: true,
      data: fatigueData,
      message: 'Today\'s fatigue assessment retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching today\'s fatigue data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch today\'s fatigue data',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

