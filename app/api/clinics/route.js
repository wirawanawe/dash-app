import { query, rawQuery } from "@/lib/db";
import { verifyJwtToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Function to get user from token
async function getUserFromToken(request) {
  const token = request.cookies.get("token");
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token.value, secretKey);
    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// GET /api/clinics - get all clinics
export async function GET(request) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Add clinic filtering based on user role and clinic_id
    let clinicFilter = "";
    let filterValues = [`%${search}%`, `%${search}%`, `%${search}%`];

    // Only filter by clinic_id if user is not an admin and has a clinic_id
    if (userPayload && userPayload.role !== "ADMIN" && userPayload.clinic_id) {
      clinicFilter = " AND id = ?";
      filterValues.push(userPayload.clinic_id);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM clinics
      WHERE 
        (LOWER(name) LIKE LOWER(?) OR
        LOWER(code) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?))
        ${clinicFilter}
    `;

    const countResult = await query(countQuery, filterValues);
    const totalResults = parseInt(countResult[0].total);

    // Get paginated results - Use direct string interpolation for LIMIT and OFFSET
    // to avoid parameter type issues
    const clinicsQuery = `
      SELECT 
        id, code, name, address, phone, email, 
        province_id, province_name, city_id, city_name,
        district_id, district_name, village_id, village_name,
        postal_code, created_at, updated_at
      FROM clinics
      WHERE 
        (LOWER(name) LIKE LOWER(?) OR
        LOWER(code) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?))
        ${clinicFilter}
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const clinics = await query(clinicsQuery, filterValues);

    return NextResponse.json({
      data: clinics,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {
    console.error("Error getting clinics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data klinik" },
      { status: 500 }
    );
  }
}

// POST /api/clinics - create new clinic
export async function POST(request) {
  try {
    // Verify admin authorization
    const token = request.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyJwtToken(token);

    if (payload?.role !== "ADMIN" && payload?.role !== "admin") {
      return Response.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return Response.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    // Check if clinic with same code already exists
    const existingClinic = await query(
      "SELECT * FROM polyclinics WHERE code = ?",
      [code]
    );

    if (existingClinic.length > 0) {
      return Response.json(
        { error: "Clinic with this code already exists" },
        { status: 409 }
      );
    }

    // Insert new clinic
    const result = await query(
      "INSERT INTO polyclinics (name, code, description) VALUES (?, ?, ?)",
      [name, code, description || ""]
    );

    return Response.json(
      {
        message: "Clinic created successfully",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating clinic:", error);
    return Response.json({ error: "Failed to create clinic" }, { status: 500 });
  }
}
