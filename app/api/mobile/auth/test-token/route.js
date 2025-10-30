import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(request) {
  try {
    const { token } = await request.json();

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      return NextResponse.json({
        success: true,
        message: "Token is valid",
        payload: payload
      });
    } catch (jwtError) {

      return NextResponse.json({
        success: false,
        message: "Token is invalid",
        error: jwtError.message
      }, { status: 401 });
    }
  } catch (error) {

    return NextResponse.json({
      success: false,
      message: "Server error",
      error: error.message
    }, { status: 500 });
  }
} 