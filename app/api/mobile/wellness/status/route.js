import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

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

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      const userId = payload.userId;

      // Get user profile to check wellness program status
      const profileQuery = `
        SELECT 
          wellness_program_joined,
          wellness_join_date,
          fitness_goal,
          activity_level,
          weight,
          height,
          TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) as age,
          gender
        FROM mobile_users 
        WHERE id = ?
      `;
      
      const [profile] = await query(profileQuery, [userId]);

      // Check if user has any missions
      const missionsQuery = `
        SELECT COUNT(*) as mission_count
        FROM user_missions 
        WHERE user_id = ?
      `;
      
      const [missionsResult] = await query(missionsQuery, [userId]);
      const hasMissions = missionsResult.mission_count > 0;

      // Determine wellness program status
      const hasJoinedWellness = profile?.wellness_program_joined || hasMissions;

      const wellnessStatus = {
        has_joined: hasJoinedWellness,
        join_date: profile?.wellness_join_date || null,
        fitness_goal: profile?.fitness_goal || null,
        activity_level: profile?.activity_level || null,
        has_missions: hasMissions,
        mission_count: missionsResult.mission_count || 0,
        profile_complete: !!(profile?.weight && profile?.height && profile?.age && profile?.gender),
        needs_onboarding: !hasJoinedWellness && !hasMissions
      };

      return NextResponse.json({
        success: true,
        data: wellnessStatus,
      });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error checking wellness program status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memeriksa status program wellness",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 