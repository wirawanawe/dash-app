import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get user's missions (v2) - Optimized for Performance
export async function GET(request) {
  try {
    console.log("=== MY-MISSIONS V2 (OPTIMIZED) ===");
    
    // Get parameters from URL
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");
    
    console.log("User ID from URL:", user_id);
    
    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Convert to number
    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID format",
        },
        { status: 400 }
      );
    }

    console.log("Parsed user ID:", userId);

    // Single optimized query with all data and summary calculation
    const optimizedQuery = `
      SELECT 
        um.id as user_mission_id,
        um.status,
        um.progress,
        um.current_value,
        um.completed_at,
        um.created_at,
        um.updated_at,
        um.notes,
        m.id as mission_id,
        m.title,
        m.description,
        m.category,
        m.points,
        m.target_value,
        m.is_active,
        m.icon,
        m.color,
        m.difficulty,
        -- Summary calculations in the same query
        COUNT(*) OVER() as total_missions,
        SUM(CASE WHEN um.status = 'active' THEN 1 ELSE 0 END) OVER() as active_missions,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) OVER() as completed_missions,
        SUM(CASE WHEN um.status = 'expired' THEN 1 ELSE 0 END) OVER() as expired_missions,
        SUM(CASE WHEN um.status = 'cancelled' THEN 1 ELSE 0 END) OVER() as cancelled_missions,
        SUM(CASE WHEN um.status = 'completed' THEN m.points ELSE 0 END) OVER() as total_points_earned
      FROM user_missions um
      INNER JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
      ORDER BY um.created_at DESC
    `;
    
    console.log("Optimized query executed for user:", userId);
    
    const userMissions = await query(optimizedQuery, [userId]);
    console.log("Query result count:", userMissions.length);

    // Extract summary from first row (all rows have same summary values)
    const summary = userMissions.length > 0 ? {
      total_missions: userMissions[0].total_missions || 0,
      active_missions: userMissions[0].active_missions || 0,
      completed_missions: userMissions[0].completed_missions || 0,
      expired_missions: userMissions[0].expired_missions || 0,
      cancelled_missions: userMissions[0].cancelled_missions || 0,
      total_points_earned: userMissions[0].total_points_earned || 0,
      completion_rate: userMissions[0].total_missions > 0 
        ? Math.round((userMissions[0].completed_missions / userMissions[0].total_missions) * 100)
        : 0,
    } : {
      total_missions: 0,
      active_missions: 0,
      completed_missions: 0,
      expired_missions: 0,
      cancelled_missions: 0,
      total_points_earned: 0,
      completion_rate: 0,
    };

    // Process user missions to ensure correct progress calculation
    const processedUserMissions = userMissions.map(mission => {
      // Calculate progress if not set or if current_value has changed
      let progress = mission.progress;
      if (mission.current_value !== null && mission.target_value) {
        progress = Math.min(Math.round((mission.current_value / mission.target_value) * 100), 100);
      }
      
      return {
        user_mission_id: mission.user_mission_id,
        status: mission.status,
        progress: progress,
        current_value: mission.current_value || 0,
        completed_at: mission.completed_at,
        created_at: mission.created_at,
        updated_at: mission.updated_at,
        notes: mission.notes || "",
        // Add mission object for frontend compatibility
        mission: {
          id: mission.mission_id,
          title: mission.title,
          description: mission.description,
          category: mission.category,
          points: mission.points,
          target_value: mission.target_value,
          icon: mission.icon,
          color: mission.color,
          difficulty: mission.difficulty,
          is_active: mission.is_active
        }
      };
    });

    console.log("Processed user missions:", processedUserMissions.length, "missions");
    console.log("Summary:", summary);

    return NextResponse.json({
      success: true,
      data: processedUserMissions,
      summary,
      pagination: {
        total: summary.total_missions,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Error in my-missions v2 (optimized):", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil user missions",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 