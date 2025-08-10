import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Find the actual mobile_users ID from Google user ID or direct ID
    let actualUserId = user_id;
    
    // If it's a Google user ID (starts with 'google_'), find the corresponding mobile_users record
    if (user_id.startsWith('google_')) {
      const userCheck = await query(
        'SELECT id FROM mobile_users WHERE password = ?',
        [user_id]
      );
      
      if (userCheck.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }
      actualUserId = userCheck[0].id;
    } else {
      // Check if it's a direct mobile_users ID
      const userCheck = await query(
        'SELECT id FROM mobile_users WHERE id = ?',
        [user_id]
      );
      
      if (userCheck.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }
    }

    // Get user profile data
    const [userProfile] = await query(
      `SELECT 
        id, name, email, phone, date_of_birth, gender, 
        height, weight, blood_type, emergency_contact_name, 
        emergency_contact_phone, is_active, created_at, updated_at
      FROM mobile_users WHERE id = ?`,
      [actualUserId]
    );

    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile user tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile berhasil diambil",
        data: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 