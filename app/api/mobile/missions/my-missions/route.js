import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get user's missions (v2)
export async function GET(request) {
  try {
    console.log("=== MY-MISSIONS V2 ===");
    
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

    // Simple query first to check if user has any missions
    const simpleQuery = "SELECT COUNT(*) as count FROM user_missions WHERE user_id = ?";
    console.log("Simple query:", simpleQuery);
    console.log("Params:", [userId]);
    
    const simpleResult = await query(simpleQuery, [userId]);
    console.log("Simple result:", simpleResult);

    // If user has no missions, return empty response
    if (simpleResult[0]?.count === 0) {
      console.log("User has no missions, returning empty response");
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          total_missions: 0,
          active_missions: 0,
          completed_missions: 0,
          expired_missions: 0,
          cancelled_missions: 0,
          total_points_earned: 0,
          completion_rate: 0,
        },
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });
    }

    // If simple query works, try the complex query
    const complexQuery = `
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
        m.difficulty
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
    `;
    
    console.log("Complex query:", complexQuery);
    console.log("Complex params:", [userId]);
    
    const userMissions = await query(complexQuery, [userId]);
    console.log("Complex result count:", userMissions.length);

    // Process user missions to ensure correct progress calculation
    const processedUserMissions = userMissions.map(mission => {
      // Calculate progress if not set or if current_value has changed
      let progress = mission.progress;
      if (mission.current_value !== null && mission.target_value) {
        progress = Math.min(Math.round((mission.current_value / mission.target_value) * 100), 100);
      }
      
      return {
        ...mission,
        progress: progress,
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

    console.log("Processed user missions:", processedUserMissions.map(m => ({
      id: m.user_mission_id,
      title: m.title,
      current_value: m.current_value,
      target_value: m.target_value,
      progress: m.progress,
      status: m.status
    })));

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
    `;
    
    const countResult = await query(countQuery, [userId]);
    const total = countResult[0]?.total || 0;

    // Calculate summary
    const summary = {
      total_missions: total,
      active_missions: 0,
      completed_missions: 0,
      expired_missions: 0,
      cancelled_missions: 0,
      total_points_earned: 0,
      completion_rate: 0,
    };

    processedUserMissions.forEach(mission => {
      switch (mission.status) {
        case "active":
          summary.active_missions++;
          break;
        case "completed":
          summary.completed_missions++;
          summary.total_points_earned += mission.points || 0;
          break;
        case "expired":
          summary.expired_missions++;
          break;
        case "cancelled":
          summary.cancelled_missions++;
          break;
      }
    });

    if (summary.total_missions > 0) {
      summary.completion_rate = (summary.completed_missions / summary.total_missions) * 100;
    }

    console.log("Returning successful response with data");
    return NextResponse.json({
      success: true,
      data: processedUserMissions,
      summary,
      pagination: {
        total,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Error in my-missions v2:", error);
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