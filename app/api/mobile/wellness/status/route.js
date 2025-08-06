import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export async function GET(request) {
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

    // Get user profile data
    const userQuery = `
      SELECT 
        wellness_program_joined,
        wellness_join_date,
        fitness_goal,
        activity_level,
        weight,
        height,
        age,
        gender
      FROM mobile_users 
      WHERE id = ?
    `;
    
    const [userResult] = await query(userQuery, [userId]);
    const user = userResult[0];

    // Get user missions count
    const missionsQuery = `
      SELECT COUNT(*) as mission_count
      FROM user_missions 
      WHERE user_id = ? AND status IN ('active', 'completed')
    `;
    
    const [missionsResult] = await query(missionsQuery, [userId]);
    const missionCount = missionsResult[0]?.mission_count || 0;

    // Determine if profile is complete
    const profileComplete = !!(user?.weight && user?.height && user?.age && user?.gender && user?.activity_level && user?.fitness_goal);

    // Determine if user needs onboarding
    const needsOnboarding = !user?.wellness_program_joined && missionCount === 0;

    const response = {
      success: true,
      data: {
        has_joined: !!user?.wellness_program_joined,
        join_date: user?.wellness_join_date,
        fitness_goal: user?.fitness_goal,
        activity_level: user?.activity_level,
        has_missions: missionCount > 0,
        mission_count: missionCount,
        profile_complete: profileComplete,
        needs_onboarding: needsOnboarding
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness status endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 