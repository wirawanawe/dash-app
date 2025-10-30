import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get missions by category
export async function GET(request, { params }) {
  try {
    const { category } = params;
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required",
        },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        m.id,
        m.title,
        m.description,
        m.category,
        m.points,
        m.target_value,
        m.unit,
        m.is_active,
        m.created_at,
        m.updated_at,
        CASE 
          WHEN um.user_id IS NOT NULL THEN um.status
          ELSE 'available'
        END as user_status,
        um.progress,
        um.id as user_mission_id
      FROM missions m
      LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ?
      WHERE m.category = ? AND m.is_active = 1
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const missions = await query(sql, [user_id, category, limit, offset]);

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM missions
      WHERE category = ? AND is_active = 1
    `;

    const countResult = await query(countSql, [category]);
    const total = countResult[0]?.total || 0;

    // Calculate category statistics
    const categoryStats = {
      total_missions: total,
      available_missions: 0,
      active_missions: 0,
      completed_missions: 0,
      total_points_available: 0,
    };

    missions.forEach(mission => {
      categoryStats.total_points_available += mission.points || 0;
      
      switch (mission.user_status) {
        case "available":
          categoryStats.available_missions++;
          break;
        case "active":
          categoryStats.active_missions++;
          break;
        case "completed":
          categoryStats.completed_missions++;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: missions,
      category: category,
      statistics: categoryStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil missions by category",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 