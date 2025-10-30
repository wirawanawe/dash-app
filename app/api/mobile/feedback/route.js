import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get user feedback
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status"); // pending, in_progress, resolved, closed
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

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
        id, user_id, type, subject, message, status, priority,
        created_at, updated_at, resolved_at
      FROM user_feedback
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const feedback = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM user_feedback WHERE user_id = ?";
    let countParams = [user_id];

    if (status) {
      countSql += " AND status = ?";
      countParams.push(status);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Get feedback statistics
    const statsSql = `
      SELECT 
        status,
        type,
        COUNT(*) as count
      FROM user_feedback
      WHERE user_id = ?
      GROUP BY status, type
    `;

    const statsResult = await query(statsSql, [user_id]);

    const statistics = {
      total: total,
      by_status: {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
      },
      by_type: {},
    };

    statsResult.forEach(stat => {
      statistics.by_status[stat.status] += stat.count;
      
      if (!statistics.by_type[stat.type]) {
        statistics.by_type[stat.type] = 0;
      }
      statistics.by_type[stat.type] += stat.count;
    });

    return NextResponse.json({
      success: true,
      data: feedback,
      statistics,
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
        message: "Gagal mengambil feedback",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Submit feedback
export async function POST(request) {
  try {
    const {
      user_id,
      type,
      subject,
      message,
      priority = "medium"
    } = await request.json();

    if (!user_id || !type || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, type, subject, dan message wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validTypes = [
      'bug_report', 'feature_request', 'general_feedback', 
      'technical_issue', 'suggestion', 'complaint'
    ];
    
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback type tidak valid",
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          message: "Priority tidak valid",
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO user_feedback (
        user_id, type, subject, message, priority, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `;

    const result = await query(sql, [
      user_id,
      type,
      subject,
      message,
      priority,
    ]);

    return NextResponse.json({
      success: true,
      message: "Feedback berhasil dikirim",
      data: {
        id: result.insertId,
        status: "pending",
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengirim feedback",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 