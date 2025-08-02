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

      // Get mission statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_missions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_missions,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_missions,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_missions,
          SUM(CASE WHEN status = 'completed' THEN m.points ELSE 0 END) as total_points_earned
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = ?
      `;

      const [stats] = await query(statsQuery, [userId]);

      // Calculate completion rate
      const completionRate = stats.total_missions > 0 
        ? (stats.completed_missions / stats.total_missions) * 100 
        : 0;

      const missionStats = {
        total_missions: stats.total_missions || 0,
        completed_missions: stats.completed_missions || 0,
        active_missions: stats.active_missions || 0,
        expired_missions: stats.expired_missions || 0,
        cancelled_missions: stats.cancelled_missions || 0,
        total_points_earned: stats.total_points_earned || 0,
        completion_rate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
      };

      return NextResponse.json({
        success: true,
        data: missionStats,
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
    console.error("Error fetching mission stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil mission stats",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 