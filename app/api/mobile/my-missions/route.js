import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get user's missions
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

      // Simple query first to check if user has any missions
      let simpleQuery = "SELECT COUNT(*) as count FROM user_missions WHERE user_id = ?";
      let simpleParams = [userId];
      
      if (!showAllDates) {
        simpleQuery += " AND mission_date = ?";
        simpleParams.push(targetDate);
      }

      const simpleResult = await query(simpleQuery, simpleParams);

      // If user has no missions for the specified date, return empty response
      if (simpleResult[0]?.count === 0) {

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
          target_date: targetDate,
        });
      }

      // If simple query works, try the complex query
      let complexQuery = `
        SELECT 
          um.id as user_mission_id,
          um.status,
          um.progress,
          um.current_value,
          um.completed_at,
          um.created_at,
          um.updated_at,
          um.mission_date,
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
      
      let complexParams = [userId];
      
      if (!showAllDates) {
        complexQuery += " AND um.mission_date = ?";
        complexParams.push(targetDate);
      }
      
      complexQuery += " ORDER BY um.created_at DESC";

      const userMissions = await query(complexQuery, complexParams);

      // Process user missions to ensure correct progress calculation
      const processedUserMissions = userMissions.map(mission => {
        // Use the progress field from the database
        let progress = mission.progress || 0;
        
        return {
          ...mission,
          progress: progress,
          current_value: mission.current_value || 0,
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

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = ?
      `;
      
      let countParams = [userId];
      
      if (!showAllDates) {
        countQuery += " AND um.mission_date = ?";
        countParams.push(targetDate);
      }
      
      const countResult = await query(countQuery, countParams);
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

      return NextResponse.json({
        success: true,
        data: processedUserMissions,
        summary,
        target_date: targetDate,
        show_all_dates: showAllDates,
        pagination: {
          total,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });
    } catch (jwtError) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }
  } catch (error) {

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