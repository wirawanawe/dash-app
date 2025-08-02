import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    console.log("🔍 Test endpoint: Received token");
    console.log("🔍 Test endpoint: Token length:", token.length);
    console.log("🔍 Test endpoint: JWT_SECRET set:", !!process.env.JWT_SECRET);
    console.log("🔍 Test endpoint: JWT_SECRET length:", process.env.JWT_SECRET?.length);
    
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      
      console.log("🔍 Test endpoint: JWT verification successful");
      console.log("🔍 Test endpoint: Payload:", payload);
      
      return NextResponse.json({
        success: true,
        message: "Token is valid",
        payload: payload
      });
    } catch (jwtError) {
      console.error("🔍 Test endpoint: JWT verification failed:", jwtError);
      return NextResponse.json({
        success: false,
        message: "Token is invalid",
        error: jwtError.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error("🔍 Test endpoint: General error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
      error: error.message
    }, { status: 500 });
  }
} 