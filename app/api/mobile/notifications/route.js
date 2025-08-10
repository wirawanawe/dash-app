import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get user notifications
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status"); // unread, read, all
    const type = searchParams.get("type"); // system, mission, wellness, reminder
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
        id, user_id, title, message, type, status, data, created_at, read_at
      FROM user_notifications
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }

    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const notifications = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM user_notifications WHERE user_id = ?";
    let countParams = [user_id];

    if (status && status !== "all") {
      countSql += " AND status = ?";
      countParams.push(status);
    }

    if (type) {
      countSql += " AND type = ?";
      countParams.push(type);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Get unread count
    const unreadSql = `
      SELECT COUNT(*) as unread_count
      FROM user_notifications
      WHERE user_id = ? AND status = 'unread'
    `;

    const unreadResult = await query(unreadSql, [user_id]);
    const unreadCount = unreadResult[0]?.unread_count || 0;

    // Get notification statistics
    const statsSql = `
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM user_notifications
      WHERE user_id = ?
      GROUP BY type, status
    `;

    const statsResult = await query(statsSql, [user_id]);

    const statistics = {
      total: total,
      unread: unreadCount,
      read: total - unreadCount,
      by_type: {},
      by_status: {
        unread: 0,
        read: 0,
      },
    };

    statsResult.forEach(stat => {
      if (!statistics.by_type[stat.type]) {
        statistics.by_type[stat.type] = {
          total: 0,
          unread: 0,
          read: 0,
        };
      }
      statistics.by_type[stat.type].total += stat.count;
      statistics.by_type[stat.type][stat.status] += stat.count;
      statistics.by_status[stat.status] += stat.count;
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      statistics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil notifications",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Mark notification as read
export async function POST(request) {
  try {
    const { user_id, notification_id } = await request.json();

    if (!user_id || !notification_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan notification ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Update notification status
    const updateSql = `
      UPDATE user_notifications 
      SET status = 'read', read_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    const result = await query(updateSql, [notification_id, user_id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification berhasil ditandai sebagai dibaca",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menandai notification sebagai dibaca",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 