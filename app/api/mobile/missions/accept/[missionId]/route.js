import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Accept a mission
export async function POST(request, { params }) {
  try {
    const { missionId } = params;
    const { user_id, mission_date } = await request.json();

    console.log(`🎯 Accepting mission: ${missionId} for user: ${user_id} on date: ${mission_date}`);

    if (!user_id || !missionId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan mission ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Use provided mission_date or default to today
    const targetDate = mission_date || new Date().toISOString().split('T')[0];

    // Check if mission exists and is active
    const missionCheck = await query(
      "SELECT id, title, description, category, points, is_active FROM missions WHERE id = ? AND is_active = 1",
      [missionId]
    );

    if (missionCheck.length === 0) {
      console.log(`❌ Mission ${missionId} not found or not active`);
      return NextResponse.json(
        {
          success: false,
          message: "Mission tidak ditemukan atau tidak aktif",
        },
        { status: 404 }
      );
    }

    const mission = missionCheck[0];
    console.log(`✅ Mission found: ${mission.title}`);

    // Check if user has already accepted this mission for the same date
    const existingAcceptance = await query(
      "SELECT id, status, mission_date FROM user_missions WHERE user_id = ? AND mission_id = ? AND mission_date = ?",
      [user_id, missionId, targetDate]
    );

    if (existingAcceptance.length > 0) {
      const existing = existingAcceptance[0];
      console.log(`🔄 User already has mission for this date with status: ${existing.status}`);
      
      if (existing.status === "completed") {
        return NextResponse.json(
          {
            success: false,
            message: "Mission sudah diselesaikan untuk tanggal ini",
          },
          { status: 409 }
        );
      } else if (existing.status === "active") {
        return NextResponse.json(
          {
            success: true,
            message: "Mission sudah diterima dan sedang dalam progress untuk tanggal ini",
            data: {
              user_mission_id: existing.id,
              mission_title: mission.title,
              status: "active",
              mission_date: targetDate,
            },
          },
          { status: 200 }
        );
      } else if (existing.status === "cancelled") {
        // Allow re-accepting cancelled missions for the same date
        const updateSql = `
          UPDATE user_missions 
          SET status = 'active', progress = 0, updated_at = NOW()
          WHERE id = ?
        `;
        await query(updateSql, [existing.id]);
        console.log(`✅ Re-activated cancelled mission: ${existing.id}`);

        return NextResponse.json({
          success: true,
          message: "Mission berhasil diterima kembali",
          data: {
            user_mission_id: existing.id,
            mission_title: mission.title,
            status: "active",
            mission_date: targetDate,
          },
        });
      }
    }

    // Accept the mission
    const acceptSql = `
      INSERT INTO user_missions (
        user_id, mission_id, mission_date, status, progress, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', 0, NOW(), NOW())
    `;

    const result = await query(acceptSql, [user_id, missionId, targetDate]);
    console.log(`✅ Mission accepted successfully. User mission ID: ${result.insertId}`);

    return NextResponse.json({
      success: true,
      message: "Mission berhasil diterima",
      data: {
        user_mission_id: result.insertId,
        mission_title: mission.title,
        status: "active",
        points: mission.points,
        mission_date: targetDate,
      },
    });
  } catch (error) {
    console.error("❌ Error accepting mission:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menerima mission",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 