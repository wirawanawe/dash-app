import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    let payload;
    try {
      const result = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      payload = result.payload;
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Validate userId
    if (!userId) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid token: missing user ID",
        },
        { status: 401 }
      );
    }

    // Get user profile data
    const userQuery = `
      SELECT 
        wellness_program_joined,
        wellness_join_date,
        wellness_program_duration,
        fitness_goal,
        activity_level,
        date_of_birth,
        gender
      FROM mobile_users 
      WHERE id = ?
    `;

    const userResult = await query(userQuery, [userId]);
    const user = userResult[0];
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get user missions count
    const missionsQuery = `
      SELECT COUNT(*) as mission_count
      FROM user_missions 
      WHERE user_id = ? AND status IN ('active', 'completed')
    `;

    const missionsResult = await query(missionsQuery, [userId]);
    const missionCount = missionsResult[0]?.mission_count || 0;

    // Calculate age from date_of_birth if available
    let age = null;
    if (user.date_of_birth) {
      const birthDate = new Date(user.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Determine if profile is complete
    const profileComplete = !!(age && user?.gender && user?.activity_level && user?.fitness_goal);

    // Determine if user needs onboarding
    // User needs onboarding if they haven't joined the wellness program
    // Missions alone are not sufficient - user must register for wellness program first
    const needsOnboarding = !user?.wellness_program_joined;

    // Calculate actual days since joining wellness program
    let daysSinceJoining = 0;
    if (user?.wellness_join_date) {
      try {
        const joinDate = new Date(user.wellness_join_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - joinDate.getTime());
        daysSinceJoining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (error) {

      }
    }

    // Calculate remaining days in program
    let daysRemaining = 0;
    if (user?.wellness_program_duration && daysSinceJoining > 0) {
      daysRemaining = Math.max(0, user.wellness_program_duration - daysSinceJoining);
    }

    const response = {
      success: true,
      data: {
        has_joined: !!user?.wellness_program_joined,
        join_date: user?.wellness_join_date,
        program_duration: user?.wellness_program_duration,
        days_since_joining: daysSinceJoining,
        days_remaining: daysRemaining,
        fitness_goal: user?.fitness_goal,
        activity_level: user?.activity_level,
        has_missions: missionCount > 0,
        mission_count: missionCount,
        profile_complete: profileComplete,
        needs_onboarding: needsOnboarding,
        age: age
      }
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 