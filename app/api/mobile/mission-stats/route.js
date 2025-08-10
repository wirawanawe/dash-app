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

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const showAllDates = searchParams.get('all_dates') === 'true';

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      const userId = payload.userId;

      // Build the WHERE clause for date filtering
      let whereClause = "WHERE um.user_id = ?";
      let params = [userId];
      
      if (!showAllDates) {
        whereClause += " AND DATE(um.created_at) = ?";
        params.push(targetDate);
      }

      // Get mission statistics with date filtering
      const statsQuery = `
        SELECT 
          COUNT(*) as total_missions,
          SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
          SUM(CASE WHEN um.status = 'active' THEN 1 ELSE 0 END) as active_missions,
          SUM(CASE WHEN um.status = 'expired' THEN 1 ELSE 0 END) as expired_missions,
          SUM(CASE WHEN um.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_missions,
          SUM(CASE WHEN um.status = 'completed' THEN m.points ELSE 0 END) as total_points_earned
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        ${whereClause}
      `;

      const [stats] = await query(statsQuery, params);

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
        target_date: targetDate,
        show_all_dates: showAllDates,
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