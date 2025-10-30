import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Auto-update missions from tracking data
export async function POST(request) {
  try {
    const { user_id, tracking_type, current_value, date } = await request.json();

    if (!user_id || !tracking_type || current_value === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, tracking type, dan current value wajib diisi",
        },
        { status: 400 }
      );
    }

    // Get active missions for this user and tracking type
    const activeMissions = await query(
      `SELECT um.id as user_mission_id, um.current_value, um.progress, um.status, 
              m.id as mission_id, m.title, m.target_value, m.unit, m.category, m.points
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       WHERE um.user_id = ? 
         AND um.status IN ('active', 'pending')
         AND m.category = ?
         AND m.unit = ?
         AND um.mission_date = ?`,
      [user_id, tracking_type, getUnitFromTrackingType(tracking_type), date]
    );

    const updatedMissions = [];

    for (const mission of activeMissions) {
      try {
        // Calculate new total value by adding current tracking data to existing mission value
        const newTotalValue = mission.current_value + current_value;
        
        // Calculate new progress based on accumulated tracking data
        const newProgress = Math.min(Math.round((newTotalValue / mission.target_value) * 100), 100);
        
        // Determine new status
        let newStatus = mission.status;
        if (newProgress >= 100) {
          newStatus = "completed";
        } else if (newProgress > 0) {
          newStatus = "active";
        }

        // Update mission progress with accumulated value
        const updateSql = `
          UPDATE user_missions 
          SET current_value = ?, progress = ?, status = ?, updated_at = NOW()
          ${newStatus === "completed" ? ", completed_at = NOW()" : ""}
          WHERE id = ?
        `;

        await query(updateSql, [newTotalValue, newProgress, newStatus, mission.user_mission_id]);

        updatedMissions.push({
          user_mission_id: mission.user_mission_id,
          mission_title: mission.title,
          old_value: mission.current_value,
          new_value: newTotalValue,
          old_progress: mission.progress,
          new_progress: newProgress,
          old_status: mission.status,
          new_status: newStatus,
          points: mission.points,
          completed: newStatus === "completed"
        });

      } catch (error) {

      }
    }

    // If no active missions found, suggest available missions instead of auto-assigning
    if (activeMissions.length === 0) {

      const availableMissions = await query(
        `SELECT id, title, target_value, unit, category, points
         FROM missions 
         WHERE category = ? 
           AND unit = ?
           AND is_active = 1
         ORDER BY RAND()
         LIMIT 3`,
        [tracking_type, getUnitFromTrackingType(tracking_type)]
      );

      availableMissions.forEach(mission => {

      });
      
      // Don't auto-assign missions - let users choose manually

    }

    const response = {
      success: true,
      message: `Updated ${updatedMissions.length} missions`,
      data: {
        updated_missions: updatedMissions,
        tracking_type: tracking_type,
        current_value: current_value,
        date: date
      }
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal auto-update missions",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to map tracking types to mission units
function getUnitFromTrackingType(trackingType) {
  const unitMap = {
    'health_tracking': 'ml', // for water tracking
    'fitness': 'steps', // for fitness tracking
    'nutrition': 'calories', // for meal tracking
    'mental_health': 'mood_score' // for mood tracking
  };
  
  return unitMap[trackingType] || trackingType;
}
