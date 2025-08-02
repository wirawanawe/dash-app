import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

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

      // Get user from database
      const sql = `
        SELECT id, name, email, phone, date_of_birth, gender, height, weight, blood_type, 
               emergency_contact_name, emergency_contact_phone, is_active, 
               wellness_program_joined, wellness_join_date, activity_level, fitness_goal,
               created_at, updated_at
        FROM mobile_users 
        WHERE id = ?
      `;
      const [user] = await query(sql, [payload.userId]);

      if (!user || !user.is_active) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found or inactive",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: user,
        },
        { status: 200 }
      );
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
} 