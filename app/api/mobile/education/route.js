import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get education content
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty"); // beginner, intermediate, advanced
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let sql = `
      SELECT 
        id, title, content, summary, category, difficulty, author,
        image_url, video_url, reading_time_minutes, is_featured, is_active,
        created_at, updated_at
      FROM education_content
      WHERE is_active = 1
    `;
    let params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (difficulty) {
      sql += " AND difficulty = ?";
      params.push(difficulty);
    }

    sql += " ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const educationContent = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM education_content WHERE is_active = 1";
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

    // Get featured content
    const featuredSql = `
      SELECT 
        id, title, content, summary, category, difficulty, author,
        image_url, video_url, reading_time_minutes, is_featured, is_active,
        created_at, updated_at
      FROM education_content
      WHERE is_active = 1 AND is_featured = 1
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const featuredContent = await query(featuredSql);

    // Get categories
    const categoriesSql = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM education_content
      WHERE is_active = 1
      GROUP BY category
      ORDER BY count DESC
    `;

    const categories = await query(categoriesSql);

    // Get difficulty levels
    const difficultySql = `
      SELECT DISTINCT difficulty, COUNT(*) as count
      FROM education_content
      WHERE is_active = 1
      GROUP BY difficulty
      ORDER BY 
        CASE difficulty
          WHEN 'beginner' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          ELSE 4
        END
    `;

    const difficulties = await query(difficultySql);

    return NextResponse.json({
      success: true,
      data: educationContent,
      featured: featuredContent,
      categories,
      difficulties,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching education content:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil education content",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 