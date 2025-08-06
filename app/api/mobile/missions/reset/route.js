import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Reset user missions (for testing purposes)
export async function POST(request) {
  try {
    const { user_id, mission_id } = await request.json();

    console.log(`🔄 Resetting missions for user: ${user_id}${mission_id ? `, mission: ${mission_id}` : ''}`);

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    let sql, params;

    if (mission_id) {
      // Reset specific mission
      sql = `
        UPDATE user_missions 
        SET status = 'active', progress = 0, updated_at = NOW()
        WHERE user_id = ? AND mission_id = ?
      `;
      params = [user_id, mission_id];
    } else {
      // Reset all missions for user
      sql = `
        UPDATE user_missions 
        SET status = 'active', progress = 0, updated_at = NOW()
        WHERE user_id = ?
      `;
      params = [user_id];
    }

    const result = await query(sql, params);
    console.log(`✅ Reset ${result.affectedRows} mission(s) for user ${user_id}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil reset ${result.affectedRows} mission(s)`,
      data: {
        affected_rows: result.affectedRows,
        user_id: user_id,
        mission_id: mission_id || 'all'
      }
    });

  } catch (error) {
    console.error("❌ Error resetting missions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal reset missions",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 