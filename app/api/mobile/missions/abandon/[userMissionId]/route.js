import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT - Abandon a mission
export async function PUT(request, { params }) {
  try {
    const { userMissionId } = params;
    const { reason } = await request.json();

    if (!userMissionId) {
      return NextResponse.json(
        {
          success: false,
          message: "User mission ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if user mission exists
    const userMissionCheck = await query(
      `SELECT um.id, um.status, um.progress, m.title
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
          message: "Mission yang sudah diselesaikan tidak dapat ditinggalkan",
        },
        { status: 409 }
      );
    }

    // Check if mission is already cancelled
    if (userMission.status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          message: "Mission sudah dibatalkan",
        },
        { status: 409 }
      );
    }

    // Cancel the mission
    const cancelSql = `
      UPDATE user_missions 
      SET status = 'cancelled', notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(cancelSql, [reason || "Mission dibatalkan oleh user", userMissionId]);

    return NextResponse.json({
      success: true,
      message: "Mission berhasil dibatalkan",
      data: {
        user_mission_id: userMissionId,
        mission_title: userMission.title,
        status: "cancelled",
        progress: userMission.progress,
      },
    });
  } catch (error) {
    console.error("Error abandoning mission:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal meninggalkan mission",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 