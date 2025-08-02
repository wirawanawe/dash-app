import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get wellness activities
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let sql = `
      SELECT 
        id, title, description, category, duration_minutes, 
        difficulty, points, calories_burn, instructions, is_active, created_at, updated_at
      FROM wellness_activity
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    let params = [];

    // Add filters if provided
    if (category) {
      sql = sql.replace('WHERE is_active = 1', 'WHERE is_active = 1 AND category = ?');
      params.push(category);
    }

    if (difficulty) {
      const whereClause = category ? 'AND difficulty = ?' : 'WHERE is_active = 1 AND difficulty = ?';
      sql = sql.replace('WHERE is_active = 1', whereClause);
      if (!category) {
        sql = sql.replace('WHERE is_active = 1 AND difficulty = ?', 'WHERE is_active = 1 AND difficulty = ?');
      }
      params.push(difficulty);
    }

    const activities = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM wellness_activity WHERE is_active = 1";
    let countParams = [];

    if (category) {
      countSql += " AND category = ?";
      countParams.push(category);
    }

    if (difficulty) {
      countSql += " AND difficulty = ?";
      countParams.push(difficulty);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching wellness activities:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil wellness activities",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 