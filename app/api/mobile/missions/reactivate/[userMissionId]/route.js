import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT - Reactivate a cancelled mission
export async function PUT(request, { params }) {
  try {
    const { userMissionId } = params;

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
      `SELECT um.id, um.status, um.progress, um.cancelled_at, m.title
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

    // Check if mission is already active
    if (userMission.status === "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Mission sudah aktif",
        },
        { status: 409 }
      );
    }

    // Check if mission is completed
    if (userMission.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          message: "Mission yang sudah diselesaikan tidak dapat diaktifkan kembali",
        },
        { status: 409 }
      );
    }

    // Check if mission is cancelled/abandoned and can be reactivated
    if (userMission.status === "cancelled" || userMission.status === "abandoned") {
      // Check if 24 hours have passed since cancellation/abandonment
      if (userMission.cancelled_at) {
        const cancelledTime = new Date(userMission.cancelled_at).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - cancelledTime;
        const hoursSinceCancellation = timeDiff / (1000 * 60 * 60);

        if (hoursSinceCancellation < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceCancellation);
          return NextResponse.json(
            {
              success: false,
              message: `Mission dapat diaktifkan kembali dalam ${hoursRemaining} jam`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Reactivate the mission
    const reactivateSql = `
      UPDATE user_missions 
      SET status = 'active', cancelled_at = NULL, notes = NULL, updated_at = NOW()
      WHERE id = ?
    `;

    await query(reactivateSql, [userMissionId]);

    return NextResponse.json({
      success: true,
      message: "Mission berhasil diaktifkan kembali",
      data: {
        user_mission_id: userMissionId,
        mission_title: userMission.title,
        status: "active",
        progress: userMission.progress,
      },
    });
  } catch (error) {
    console.error("Error reactivating mission:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengaktifkan kembali mission",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 