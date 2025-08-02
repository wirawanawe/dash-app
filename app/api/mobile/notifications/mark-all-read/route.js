import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Mark all notifications as read
export async function POST(request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Update all unread notifications for the user
    const updateSql = `
      UPDATE user_notifications 
      SET status = 'read', read_at = NOW()
      WHERE user_id = ? AND status = 'unread'
    `;

    const result = await query(updateSql, [user_id]);

    return NextResponse.json({
      success: true,
      message: `${result.affectedRows} notifications berhasil ditandai sebagai dibaca`,
      data: {
        updated_count: result.affectedRows,
      },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menandai semua notifications sebagai dibaca",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 