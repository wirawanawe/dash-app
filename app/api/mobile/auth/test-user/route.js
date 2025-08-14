import { NextResponse } from "next/server";
import { getMobileUserFromRequest } from "@/lib/auth";

export const dynamic = 'force-dynamic';


// GET - Test endpoint to check current user
export async function GET(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "No user authenticated",
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      message: "User authenticated",
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      }
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Error checking user",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
