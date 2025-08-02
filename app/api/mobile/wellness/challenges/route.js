import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get wellness challenges
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status"); // active, completed, upcoming

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        wc.id,
        wc.title,
        wc.description,
        wc.category,
        wc.duration_days,
        wc.target_value,
        wc.target_unit,
        wc.points_reward,
        wc.start_date,
        wc.end_date,
        wc.is_active,
        wc.created_at,
        wc.updated_at,
        CASE 
          WHEN wuc.user_id IS NOT NULL THEN 'joined'
          WHEN wc.start_date > CURDATE() THEN 'upcoming'
          WHEN wc.end_date < CURDATE() THEN 'expired'
          ELSE 'available'
        END as user_status,
        wuc.progress,
        wuc.completed_at
      FROM wellness_challenges wc
      LEFT JOIN wellness_user_challenges wuc ON wc.id = wuc.challenge_id AND wuc.user_id = ?
      WHERE wc.is_active = 1
    `;
    let params = [user_id];

    if (status) {
      switch (status) {
        case "active":
          sql += " AND wc.start_date <= CURDATE() AND wc.end_date >= CURDATE()";
          break;
        case "completed":
          sql += " AND wuc.completed_at IS NOT NULL";
          break;
        case "upcoming":
          sql += " AND wc.start_date > CURDATE()";
          break;
        case "joined":
          sql += " AND wuc.user_id IS NOT NULL";
          break;
      }
    }

    sql += " ORDER BY wc.start_date DESC";

    const challenges = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error("Error fetching wellness challenges:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil wellness challenges",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 