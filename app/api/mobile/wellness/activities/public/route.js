import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';

    // Get wellness activities for the specified period (public access)
    const activitiesQuery = `
      SELECT 
        wa.id,
        wa.title,
        wa.description,
        wa.category,
        wa.duration_minutes,
        wa.difficulty,
        wa.points,
        wa.is_active,
        wa.created_at,
        'available' as status,
        NULL as activity_date
      FROM available_wellness_activities wa
      WHERE wa.is_active = 1
      ORDER BY wa.created_at DESC
    `;
    
    const activitiesResult = await query(activitiesQuery);

    const response = {
      success: true,
      data: activitiesResult,
      message: 'Public wellness activities loaded successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in public wellness activities endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
