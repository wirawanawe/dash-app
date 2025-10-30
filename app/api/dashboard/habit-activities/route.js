import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get habit activities for dashboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    // Check if the table exists first
    const tableExistsQuery = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'phc_dashboard' 
      AND table_name = 'available_habit_activities'
    `;
    const tableExistsResult = await query(tableExistsQuery);
    
    if (tableExistsResult[0].count === 0) {
      // Table doesn't exist, return empty data
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          total_activities: 0,
          active_activities: 0,
          categories: 0,
          avg_duration: 0,
          avg_points: 0,
          category_distribution: [],
          difficulty_distribution: []
        },
        pagination: {
          total: 0,
          limit,
          hasMore: false,
        },
      });
    }

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
    const countSql = `SELECT COUNT(*) as total FROM available_habit_activities ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Get habit activities with pagination
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
      FROM available_habit_activities 
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
      FROM available_habit_activities 
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
      FROM available_habit_activities 
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

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data habit activities",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
