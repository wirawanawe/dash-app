import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const secret = process.env.JWT_SECRET;
    
    return NextResponse.json({
      success: true,
      secretExists: !!secret,
      secretLength: secret?.length || 0,
      secretPreview: secret ? secret.substring(0, 10) + '...' : 'null'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 