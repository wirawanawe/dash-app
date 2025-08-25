import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJwtToken, getMobileUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Try to get user from authentication token first
    let user = null;
    let isAuthenticated = false;
    
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        user = await verifyJwtToken(token);
        if (user) {
          isAuthenticated = true;
          console.log(`✅ User authenticated: ${user.id}`);
        }
      }
    } catch (authError) {
      console.log('⚠️ Authentication failed, trying mobile user detection:', authError.message);
    }
    
    // If not authenticated, try to get user from mobile request
    if (!isAuthenticated) {
      try {
        user = await getMobileUserFromRequest(request);
        if (user) {
          isAuthenticated = true;
          console.log(`✅ Mobile user detected: ${user.id}`);
        }
      } catch (mobileAuthError) {
        console.log('⚠️ Mobile user detection failed:', mobileAuthError.message);
      }
    }
    
    // If still not authenticated, use default user ID for testing
    if (!isAuthenticated) {
      console.log('⚠️ No authentication found, using default user ID for testing');
      user = { id: 1 }; // Use Super Admin user ID for testing
    }

    // Get user mission with mission details
    const sql = `
      SELECT 
        um.id,
        um.user_id,
        um.mission_id,
        um.status,
        um.current_value,
        um.progress,
        um.notes,
        um.points_earned,
        um.created_at,
        um.updated_at,
        um.completed_date,
        um.cancelled_at,
        m.title as mission_title,
        m.description as mission_description,
        m.category as mission_category,
        m.points as mission_points,
        m.target_value as mission_target_value,
        m.unit as mission_unit,
        m.difficulty as mission_difficulty,
        m.icon as mission_icon,
        m.color as mission_color,
        m.type as mission_type
      FROM user_missions um
      LEFT JOIN missions m ON um.mission_id = m.id
      WHERE um.id = ?
      ${isAuthenticated ? 'AND um.user_id = ?' : ''}
    `;

    const queryParams = isAuthenticated ? [id, user.id] : [id];
    const userMissions = await query(sql, queryParams);

    if (userMissions.length === 0) {
      console.log(`❌ User mission not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'User mission not found',
          error: 'MISSION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const userMission = userMissions[0];
    console.log(`✅ Found user mission: ${userMission.mission_title} (ID: ${userMission.id})`);

    // Format the response to match the expected structure
    const formattedUserMission = {
      id: userMission.id,
      user_id: userMission.user_id,
      mission_id: userMission.mission_id,
      status: userMission.status,
      current_value: userMission.current_value || 0,
      target_value: userMission.mission_target_value || 0,
      progress: userMission.progress || 0,
      notes: userMission.notes || '',
      points_earned: userMission.points_earned || 0,
      created_at: userMission.created_at,
      updated_at: userMission.updated_at,
      completed_date: userMission.completed_date,
      cancelled_at: userMission.cancelled_at,
      mission: {
        id: userMission.mission_id,
        title: userMission.mission_title,
        description: userMission.mission_description,
        category: userMission.mission_category,
        points: userMission.mission_points,
        target_value: userMission.mission_target_value,
        unit: userMission.mission_unit,
        difficulty: userMission.mission_difficulty,
        icon: userMission.mission_icon,
        color: userMission.mission_color,
        type: userMission.mission_type
      }
    };

    console.log(`📤 Returning user mission data for ID: ${id}`);
    return NextResponse.json({
      success: true,
      data: formattedUserMission,
      message: 'User mission retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching user mission:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch user mission',
        error: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
