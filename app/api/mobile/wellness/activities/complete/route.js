import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Complete a wellness activity
export async function POST(request) {
  try {
    const {
      user_id,
      activity_id,
      duration_minutes,
      notes,
      completed_at
    } = await request.json();

    if (!user_id || !activity_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan activity ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate user exists
    const userCheck = await query(
      "SELECT id, name FROM users WHERE id = ?",
      [user_id]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Check if activity exists and is active
    const activityCheck = await query(
      "SELECT id, title, points, duration_minutes FROM wellness_activity WHERE id = ? AND is_active = 1",
      [activity_id]
    );

    if (activityCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity tidak ditemukan atau tidak aktif",
        },
        { status: 404 }
      );
    }

    const activity = activityCheck[0];

    // Check if user has already completed this activity today
    const today = new Date().toISOString().split('T')[0];
    const existingCompletion = await query(
      "SELECT id FROM user_wellness_activity WHERE user_id = ? AND activity_id = ? AND DATE(completed_at) = ?",
      [user_id, activity_id, today]
    );

    if (existingCompletion.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity sudah diselesaikan hari ini",
        },
        { status: 409 }
      );
    }

    // Calculate points earned based on duration
    const actualDuration = duration_minutes || activity.duration_minutes || 30;
    const pointsEarned = Math.round((actualDuration / activity.duration_minutes) * activity.points) || activity.points || 0;

    // Insert completion record into user_wellness_activity table
    const completionSql = `
      INSERT INTO user_wellness_activity (
        user_id, activity_id, duration_minutes, notes, points_earned, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    // Format the completed_at datetime properly for MySQL
    const formatDateTime = (dateString) => {
      if (!dateString) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      // Convert ISO string to MySQL datetime format
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const result = await query(completionSql, [
      user_id,
      activity_id,
      actualDuration,
      notes || null,
      pointsEarned,
      formatDateTime(completed_at),
    ]);

    return NextResponse.json({
      success: true,
      message: "Activity berhasil diselesaikan",
      data: {
        completion_id: result.insertId,
        activity_title: activity.title,
        points_earned: pointsEarned,
        duration_minutes: actualDuration,
        activity_points: activity.points,
        user_name: userCheck[0].name,
      },
    });
  } catch (error) {
    console.error("Error completing wellness activity:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyelesaikan activity",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 