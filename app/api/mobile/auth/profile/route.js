import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

export async function PUT(request) {
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

      const body = await request.json();
      const {
        weight,
        height,
        age,
        gender,
        activity_level,
        fitness_goal,
        wellness_program_joined,
        wellness_join_date
      } = body;

      // Validate required fields
      if (!gender) {
        return NextResponse.json(
          {
            success: false,
            message: "Gender is required",
          },
          { status: 400 }
        );
      }

      // Update user profile (without weight/height since they don't exist in mobile_users table)
      const updateSql = `
        UPDATE mobile_users 
        SET 
          gender = ?,
          activity_level = ?,
          fitness_goal = ?,
          wellness_program_joined = ?,
          wellness_join_date = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      const result = await query(updateSql, [
        gender,
        activity_level || null,
        fitness_goal || null,
        wellness_program_joined || false,
        wellness_join_date || new Date().toISOString(),
        payload.userId
      ]);

      if (result.affectedRows === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 404 }
        );
      }

      // Get updated user data
      const getUserSql = `
        SELECT id, name, email, phone, date_of_birth, gender, 
               emergency_contact_name, emergency_contact_phone, is_active, 
               wellness_program_joined, wellness_join_date, activity_level, fitness_goal,
               created_at, updated_at
        FROM mobile_users 
        WHERE id = ?
      `;
      const [updatedUser] = await query(getUserSql, [payload.userId]);

      return NextResponse.json(
        {
          success: true,
          message: "Profile updated successfully",
          data: updatedUser,
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
    console.error("Update user profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
} 