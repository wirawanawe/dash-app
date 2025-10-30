import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

// GET - Get water tracking data for today
export async function GET(request) {
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

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      const userId = payload.userId;
      const today = new Date().toISOString().split('T')[0];

      const sql = `
        SELECT id, user_id, amount_ml, tracking_date, tracking_time, notes, created_at
        FROM water_tracking
        WHERE user_id = ? AND tracking_date = ?
        ORDER BY tracking_time DESC
      `;

      const waterData = await query(sql, [userId, today]);

      // Calculate total water intake for today
      const totalWater = waterData.reduce((sum, entry) => sum + (entry.amount_ml || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          entries: waterData,
          total_water_ml: totalWater,
          date: today,
          user_id: userId
        },
      });
    } catch (jwtError) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data water tracking hari ini",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create water tracking entry for today
export async function POST(request) {
  try {
    const { user_id, amount_ml, tracking_time, notes } = await request.json();

    if (!user_id || !amount_ml) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan amount_ml wajib diisi",
        },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = tracking_time || new Date().toTimeString().split(' ')[0];

    const sql = `
      INSERT INTO water_tracking (user_id, amount_ml, tracking_date, tracking_time, notes, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id,
      amount_ml,
      today,
      currentTime,
      notes || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Water tracking entry created successfully for today",
      data: { 
        id: result.insertId,
        date: today,
        amount_ml: amount_ml
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat water tracking entry untuk hari ini",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 