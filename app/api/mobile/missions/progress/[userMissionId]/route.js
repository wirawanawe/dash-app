import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT - Update mission progress
export async function PUT(request, { params }) {
  try {
    const { userMissionId } = params;
    const { current_value, notes } = await request.json();

    console.log(`📈 Updating mission progress: ${userMissionId} to ${current_value}`);

    if (!userMissionId || current_value === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "User mission ID dan current_value wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if user mission exists
    const userMissionCheck = await query(
      `SELECT um.id, um.status, um.progress, um.current_value, m.title, m.target_value, m.points
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       WHERE um.id = ?`,
      [userMissionId]
    );

    if (userMissionCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User mission tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const userMission = userMissionCheck[0];

    // Check if mission is already completed
    if (userMission.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          message: "Mission sudah diselesaikan",
        },
        { status: 409 }
      );
    }

    // Check if mission is cancelled or abandoned
    if (userMission.status === "cancelled" || userMission.status === "abandoned") {
      return NextResponse.json(
        {
          success: false,
          message: "Mission sudah dibatalkan",
        },
        { status: 409 }
      );
    }

    // Calculate progress percentage based on current_value and target_value
    const progress = Math.min(Math.round((current_value / userMission.target_value) * 100), 100);

    console.log(`📊 Progress calculation: ${current_value}/${userMission.target_value} = ${progress}%`);

    // Determine new status based on progress
    let newStatus = userMission.status;
    if (progress >= 100) {
      newStatus = "completed";
    } else if (progress > 0) {
      newStatus = "active";
    } else {
      newStatus = "active";
    }

    // Update progress
    const updateSql = `
      UPDATE user_missions 
      SET current_value = ?, progress = ?, status = ?, notes = ?, updated_at = NOW()
      ${newStatus === "completed" ? ", completed_at = NOW()" : ""}
      WHERE id = ?
    `;

    await query(updateSql, [current_value, progress, newStatus, notes || null, userMissionId]);

    // Get updated user mission
    const updatedUserMission = await query(
      `SELECT um.*, m.title, m.target_value, m.points
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       WHERE um.id = ?`,
      [userMissionId]
    );

    const response = {
      success: true,
      message: newStatus === "completed" ? "Mission completed!" : "Progress berhasil diperbarui",
      data: {
        user_mission_id: userMissionId,
        current_value: current_value,
        progress: progress,
        status: newStatus,
        mission_title: userMission.title,
        points: userMission.points,
      },
    };

    // Add completion message if mission is completed
    if (newStatus === "completed") {
      response.data.completion_message = `Selamat! Anda telah menyelesaikan mission "${userMission.title}" dan mendapatkan ${userMission.points} poin!`;
    }

    console.log(`✅ Mission progress updated successfully: ${progress}% (${newStatus})`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating mission progress:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui progress",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 