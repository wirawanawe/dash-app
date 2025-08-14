import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get wellness activities for dashboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    let whereClause = 'WHERE is_active = 1';
    let params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM available_wellness_activities ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Get wellness activities with pagination
    const sql = `
      SELECT 
        id,
        title,
        description,
        category,
        duration_minutes,
        difficulty,
        points,
        is_active,
        created_at,
        updated_at
      FROM available_wellness_activities 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;

    const activities = await query(sql, params);

    // Get category statistics
    const categoryStatsSql = `
      SELECT 
        category,
        COUNT(*) as count,
        AVG(duration_minutes) as avg_duration,
        AVG(points) as avg_points
      FROM available_wellness_activities 
      WHERE is_active = 1
      GROUP BY category
      ORDER BY count DESC
    `;
    const categoryStats = await query(categoryStatsSql);

    // Get difficulty distribution
    const difficultyStatsSql = `
      SELECT 
        difficulty,
        COUNT(*) as count
      FROM available_wellness_activities 
      WHERE is_active = 1
      GROUP BY difficulty
      ORDER BY difficulty
    `;
    const difficultyStats = await query(difficultyStatsSql);

    // Calculate summary statistics
    const summary = {
      total_activities: total,
      active_activities: activities.length,
      categories: categoryStats.length,
      avg_duration: activities.length > 0 
        ? Math.round(activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0) / activities.length)
        : 0,
      avg_points: activities.length > 0
        ? Math.round(activities.reduce((sum, activity) => sum + (activity.points || 0), 0) / activities.length)
        : 0,
      category_distribution: categoryStats,
      difficulty_distribution: difficultyStats
    };

    return NextResponse.json({
      success: true,
      data: activities,
      summary,
      pagination: {
        total,
        limit,
        hasMore: limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching wellness activities:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data wellness activities",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
