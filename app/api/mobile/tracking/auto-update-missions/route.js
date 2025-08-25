import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Auto-update missions from tracking data
export async function POST(request) {
  try {
    const { user_id, tracking_type, current_value, date } = await request.json();

    console.log(`🔄 Auto-updating missions for user ${user_id}, type: ${tracking_type}, value: ${current_value}, date: ${date}`);

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

    console.log(`📋 Found ${activeMissions.length} active missions for ${tracking_type}`);

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

        console.log(`📊 Mission "${mission.title}": ${mission.current_value} + ${current_value} = ${newTotalValue}/${mission.target_value} (${newProgress}%)`);

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

        console.log(`✅ Updated mission "${mission.title}": ${newProgress}% (${newStatus})`);

      } catch (error) {
        console.error(`❌ Error updating mission ${mission.user_mission_id}:`, error);
      }
    }

    // If no active missions found, auto-assign new missions
    if (activeMissions.length === 0) {
      console.log(`🔍 No active missions for ${tracking_type}, auto-assigning...`);
      
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

      for (const mission of availableMissions) {
        try {
          // Check if user already has this mission for today
          const existingMission = await query(
            `SELECT id FROM user_missions 
             WHERE user_id = ? AND mission_id = ? AND mission_date = ?`,
            [user_id, mission.id, date]
          );

          if (existingMission.length === 0) {
            // Assign new mission
            const assignSql = `
              INSERT INTO user_missions (
                user_id, mission_id, status, current_value, progress, 
                mission_date, created_at, updated_at
              ) VALUES (?, ?, 'active', ?, ?, ?, NOW(), NOW())
            `;

            const initialProgress = Math.min(Math.round((current_value / mission.target_value) * 100), 100);
            const initialStatus = initialProgress >= 100 ? 'completed' : 'active';

            await query(assignSql, [
              user_id, 
              mission.id, 
              current_value, 
              initialProgress, 
              date
            ]);

            if (initialStatus === 'completed') {
              await query(
                `UPDATE user_missions SET completed_at = NOW() WHERE user_id = ? AND mission_id = ? AND mission_date = ?`,
                [user_id, mission.id, date]
              );
            }

            updatedMissions.push({
              user_mission_id: 'new',
              mission_title: mission.title,
              old_value: 0,
              new_value: current_value,
              old_progress: 0,
              new_progress: initialProgress,
              old_status: 'new',
              new_status: initialStatus,
              points: mission.points,
              completed: initialStatus === "completed",
              auto_assigned: true
            });

            console.log(`✅ Auto-assigned mission "${mission.title}": ${initialProgress}% (${initialStatus})`);
          }
        } catch (error) {
          console.error(`❌ Error auto-assigning mission ${mission.id}:`, error);
        }
      }
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

    console.log(`✅ Auto-update completed: ${updatedMissions.length} missions updated`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error auto-updating missions:", error);
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
