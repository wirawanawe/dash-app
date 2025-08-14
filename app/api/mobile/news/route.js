import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// GET - Get news articles
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let sql = `
      SELECT 
        id, title, content, summary, category, author, image_url,
        published_at, is_featured, is_active, created_at, updated_at
      FROM news_articles
      WHERE is_active = 1
    `;
    let params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY published_at DESC, is_featured DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const newsArticles = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM news_articles WHERE is_active = 1";
    let countParams = [];

    if (category) {
      countSql += " AND category = ?";
      countParams.push(category);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Get featured articles
    const featuredSql = `
      SELECT 
        id, title, content, summary, category, author, image_url,
        published_at, is_featured, is_active, created_at, updated_at
      FROM news_articles
      WHERE is_active = 1 AND is_featured = 1
      ORDER BY published_at DESC
      LIMIT 5
    `;

    const featuredArticles = await query(featuredSql);

    // Get categories
    const categoriesSql = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM news_articles
      WHERE is_active = 1
      GROUP BY category
      ORDER BY count DESC
    `;

    const categories = await query(categoriesSql);

    return NextResponse.json({
      success: true,
      data: newsArticles,
      featured: featuredArticles,
      categories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil news",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 