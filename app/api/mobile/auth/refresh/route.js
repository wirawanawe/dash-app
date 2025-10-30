import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token is required",
        },
        { status: 400 }
      );
    }

    try {
      // Verify refresh token
      const { payload } = await jwtVerify(
        refreshToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      // Check if it's a refresh token
      if (payload.type !== "refresh") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid token type",
          },
          { status: 401 }
        );
      }

      // Get user from database
      const sql = `
        SELECT id, name, email, phone, date_of_birth, gender, is_active
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

      // Create new access token
      const newAccessToken = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "MOBILE_USER",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      // Create new refresh token
      const newRefreshToken = await new SignJWT({
        userId: user.id,
        type: "refresh",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      return NextResponse.json(
        {
          success: true,
          message: "Token refreshed successfully",
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        },
        { status: 200 }
      );
    } catch (jwtError) {

      // Provide more specific error messages based on the error type
      let errorMessage = "Invalid refresh token";
      if (jwtError.code === 'ERR_JWS_INVALID') {
        errorMessage = "Token format is invalid";
      } else if (jwtError.code === 'ERR_JWT_EXPIRED') {
        errorMessage = "Token has expired";
      } else if (jwtError.code === 'ERR_JWT_MALFORMED') {
        errorMessage = "Token is malformed";
      }
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
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