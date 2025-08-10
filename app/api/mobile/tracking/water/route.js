import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get water tracking data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const date = searchParams.get("date");

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
      SELECT id, user_id, amount_ml, tracking_date, tracking_time, notes, created_at
      FROM water_tracking
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (date) {
      sql += " AND tracking_date = ?";
      params.push(date);
    }

    sql += " ORDER BY tracking_date DESC, tracking_time DESC";

    const waterData = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: waterData,
    });
  } catch (error) {
    console.error("Error fetching water tracking:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data water tracking",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create water tracking entry
export async function POST(request) {
  try {
    const { user_id, amount_ml, tracking_date, tracking_time, notes } = await request.json();

    if (!user_id || !amount_ml) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan amount_ml wajib diisi",
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO water_tracking (user_id, amount_ml, tracking_date, tracking_time, notes, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id,
      amount_ml,
      tracking_date || new Date().toISOString().split('T')[0],
      tracking_time || new Date().toTimeString().split(' ')[0],
      notes || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Water tracking entry created successfully",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating water tracking:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat water tracking entry",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 