import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

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

      // Get user from database with all fields
      const sql = `
        SELECT id, name, email, phone, date_of_birth, gender, 
               emergency_contact_name, emergency_contact_phone, is_active, 
               wellness_program_joined, wellness_join_date, activity_level, fitness_goal,
               height, weight, blood_type, ktp_number, address, insurance, insurance_card_number, insurance_type,
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

      // Format date_of_birth to remove time part
      if (user.date_of_birth) {
        // Handle different date formats
        const dateStr = user.date_of_birth.toString();
        
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            user.date_of_birth = `${year}-${month}-${day}`;
          } else {
            user.date_of_birth = dateStr;
          }
        } catch (error) {
          user.date_of_birth = dateStr;
        }
      }

      return NextResponse.json(
        {
          success: true,
          data: user,
        },
        { status: 200 }
      );
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
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
} 