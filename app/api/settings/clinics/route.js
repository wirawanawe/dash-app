import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

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

    return null;
  }
}

// GET list of all clinics for dropdown/selection
export async function GET(request) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to clinics
    if (!user || (user.role !== "SUPERADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized access to clinics settings" },
        { status: 403 }
      );
    }

    try {
      const clinics = await query(`
        SELECT 
          c.*,
          (
            SELECT COUNT(DISTINCT v.doctor_name)
            FROM visits v
            WHERE v.facility_name = c.name
              AND v.doctor_name IS NOT NULL
              AND v.doctor_name != ''
              AND v.doctor_name != '-'
          ) as doctor_count
        FROM clinics c
        ORDER BY c.name ASC
      `);

      return NextResponse.json({
        success: true,
        clinics: clinics,
      });
    } catch (error) {

      return NextResponse.json(
        { error: "Failed to fetch clinics" },
        { status: 500 }
      );
    }
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal mengambil data klinik" },
      { status: 500 }
    );
  }
}
