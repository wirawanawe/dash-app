import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";

// Function to get user from token
async function getUserFromToken(request) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookies
    const cookieToken = request.cookies.get("token");
    if (cookieToken) {
      token = cookieToken.value;
    }
  }
  
  console.log("🔍 Auth header:", authHeader);
  console.log("🔍 Token extracted:", token ? token.substring(0, 20) + "..." : "null");
  console.log("🔍 JWT_SECRET available:", !!process.env.JWT_SECRET);
  
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    console.log("✅ Token verified successfully:", payload);
    return payload;
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    return null;
  }
}

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
      sql += " AND DATE(tracking_date) = ?";
      params.push(date);
    }

    sql += " ORDER BY tracking_date DESC, tracking_time DESC";

    const waterData = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: {
        entries: waterData
      },
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
    // Get user information from token
    const userPayload = await getUserFromToken(request);
    
    if (!userPayload || !userPayload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const userId = userPayload.id;
    const { amount_ml, tracking_date, tracking_time, notes } = await request.json();

    if (!amount_ml) {
      return NextResponse.json(
        {
          success: false,
          message: "amount_ml wajib diisi",
        },
        { status: 400 }
      );
    }

    const today = tracking_date || new Date().toISOString().split('T')[0];

    // Check if there's already an entry for today
    const existingEntry = await query(
      `SELECT id, amount_ml FROM water_tracking WHERE user_id = ? AND tracking_date = ?`,
      [userId, today]
    );

    let result;
    let totalWaterIntake;

    if (existingEntry.length > 0) {
      // Update existing entry
      const newAmount = existingEntry[0].amount_ml + amount_ml;
      await query(
        `UPDATE water_tracking SET amount_ml = ?, updated_at = NOW() WHERE id = ?`,
        [newAmount, existingEntry[0].id]
      );
      totalWaterIntake = newAmount;
      result = { insertId: existingEntry[0].id };
    } else {
      // Create new entry
      const sql = `
        INSERT INTO water_tracking (user_id, amount_ml, tracking_date, tracking_time, notes, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      result = await query(sql, [
        userId,
        amount_ml,
        today,
        tracking_time || new Date().toTimeString().split(' ')[0],
        notes || null,
      ]);
      totalWaterIntake = amount_ml;
    }



    return NextResponse.json({
      success: true,
      message: "Water tracking entry created successfully",
      data: { 
        id: result.insertId,
        total_water_intake: totalWaterIntake
      },
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