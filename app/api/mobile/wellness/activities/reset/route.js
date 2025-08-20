import { NextResponse } from "next/server";
import { jwtVerify } from 'jose';
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// POST - Reset user wellness activities (for daily reset purposes)
export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let payload;
    try {
      const result = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      payload = result.payload;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { activity_id, record_id } = await request.json();

    console.log(`🔄 Resetting wellness activities for user: ${userId}${record_id ? `, record: ${record_id}` : activity_id ? `, activity: ${activity_id}` : ''}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    let sql, params;

    if (record_id) {
      // Delete specific record by ID
      sql = `
        DELETE FROM user_wellness_activities 
        WHERE user_id = ? AND id = ?
      `;
      params = [userId, record_id];
    } else if (activity_id) {
      // Reset specific activity (all dates)
      sql = `
        DELETE FROM user_wellness_activities 
        WHERE user_id = ? AND activity_id = ?
      `;
      params = [userId, activity_id];
    } else {
      // Reset all activities for today
      const today = new Date().toISOString().split('T')[0];
      sql = `
        DELETE FROM user_wellness_activities 
        WHERE user_id = ? AND activity_date = ?
      `;
      params = [userId, today];
    }

    const result = await query(sql, params);
    console.log(`✅ Reset ${result.affectedRows} wellness activity(ies) for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil reset ${result.affectedRows} wellness activity(ies)`,
      data: {
        affected_rows: result.affectedRows,
        user_id: userId,
        record_id: record_id || null,
        activity_id: activity_id || null,
        reset_date: new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error("❌ Error resetting wellness activities:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal reset wellness activities",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
