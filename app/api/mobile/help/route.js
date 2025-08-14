import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// GET - Get help content
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let sql = `
      SELECT 
        id, title, content, category, tags, is_featured, is_active,
        created_at, updated_at
      FROM help_content
      WHERE is_active = 1
    `;
    let params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += " ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const helpContent = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM help_content WHERE is_active = 1";
    let countParams = [];

    if (category) {
      countSql += " AND category = ?";
      countParams.push(category);
    }

    if (search) {
      countSql += " AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Get featured help content
    const featuredSql = `
      SELECT 
        id, title, content, category, tags, is_featured, is_active,
        created_at, updated_at
      FROM help_content
      WHERE is_active = 1 AND is_featured = 1
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const featuredContent = await query(featuredSql);

    // Get categories
    const categoriesSql = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM help_content
      WHERE is_active = 1
      GROUP BY category
      ORDER BY count DESC
    `;

    const categories = await query(categoriesSql);

    // Get frequently asked questions
    const faqSql = `
      SELECT 
        id, title, content, category, tags, is_featured, is_active,
        created_at, updated_at
      FROM help_content
      WHERE is_active = 1 AND category = 'faq'
      ORDER BY is_featured DESC, created_at DESC
      LIMIT 10
    `;

    const faqContent = await query(faqSql);

    return NextResponse.json({
      success: true,
      data: helpContent,
      featured: featuredContent,
      faq: faqContent,
      categories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching help content:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil help content",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 