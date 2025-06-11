import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";

// Helper function to verify authenticated user
async function verifyAuth(request) {
  // Try to get token from cookies first
  const token = request.cookies.get("token");

  // If no token in cookies, check Authorization header
  let tokenValue = token?.value;
  if (!tokenValue) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      tokenValue = authHeader.slice(7);
    }
  }

  if (!tokenValue) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenValue, secretKey);
    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// GET list of all clinics for dropdown/selection
export async function GET(request) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      console.log("Unauthorized access attempt to settings/clinics");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated for clinics fetch:", user.email);

    // Get all clinics (simpler query for dropdowns/select inputs)
    const clinics = await query(`
      SELECT id, name, code 
      FROM clinics 
      ORDER BY name ASC
    `);

    console.log(`Retrieved ${clinics.length} clinics successfully`);
    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Error fetching clinics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data klinik" },
      { status: 500 }
    );
  }
}
