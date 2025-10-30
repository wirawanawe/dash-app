import { query, rawQuery } from "@/lib/db";
import { verifyJwtToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

// Function to get user from token
async function getUserFromToken(request) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookies
    const cookieToken = request.cookies.get("token");
    if (cookieToken) {
      token = cookieToken.value;
    }
  }
  
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {

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
    let filterValues = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];

    // Superadmin can see all clinics
    if (userPayload && userPayload.role === "SUPERADMIN") {
      // No additional filter needed
    }
    // Admin can see all clinics if they don't have a specific clinic assigned
    else if (userPayload && userPayload.role === "ADMIN") {
      if (userPayload.clinic_id) {
        // Admin with specific clinic can only see their assigned clinic
        clinicFilter = " AND id = ?";
        filterValues.push(userPayload.clinic_id);
      }
      // Admin without clinic can see all clinics
      // No additional filter needed
    }
    // Other roles cannot access clinics
    else if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM clinics
      WHERE 
        (LOWER(name) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?) OR
        LOWER(city) LIKE LOWER(?) OR
        LOWER(code) LIKE LOWER(?))
        ${clinicFilter}
    `;

    const countResult = await query(countQuery, filterValues);
    const totalResults = parseInt(countResult[0].total);

    // Get paginated results
    const clinicsQuery = `
      SELECT 
        id, external_id, name, code, client_id, address, city, phone, email,
        rating, total_reviews, latitude, longitude,
        operating_hours, description, image_url,
        is_active, created_at, updated_at
      FROM clinics
      WHERE 
        (LOWER(name) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?) OR
        LOWER(city) LIKE LOWER(?) OR
        LOWER(code) LIKE LOWER(?))
        ${clinicFilter}
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const clinics = await query(clinicsQuery, filterValues);

    // Get polyclinics for each clinic
    const clinicsWithPolyclinics = await Promise.all(
      clinics.map(async (clinic) => {
        const polyclinicsQuery = `
          SELECT 
            p.id, p.name, p.code, p.description, p.status
          FROM polyclinics p
          INNER JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id
          WHERE cp.clinic_id = ? AND cp.is_active = TRUE
          ORDER BY p.name ASC
        `;
        
        const polyclinics = await query(polyclinicsQuery, [clinic.id]);
        
        return {
          ...clinic,
          polyclinics
        };
      })
    );

    return NextResponse.json({
      data: clinicsWithPolyclinics,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal mengambil data klinik" },
      { status: 500 }
    );
  }
}

// POST /api/clinics - create new clinic (superadmin only)
export async function POST(request) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);

    // Only superadmin can create clinics
    if (!userPayload || userPayload.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const {
      name,
      address,
      city,
      phone,
      email,
      rating = 0,
      total_reviews = 0,
      latitude,
      longitude,
      operating_hours,
      description,
      image_url,
      is_active = true,
    } = await request.json();

    // Validate required fields
    if (!name || !address || !city) {
      return NextResponse.json(
        { error: "Nama, alamat, dan kota harus diisi" },
        { status: 400 }
      );
    }

    // Insert new clinic
    const result = await query(
      `INSERT INTO clinics (
        name, address, city, phone, email, rating, total_reviews,
        latitude, longitude, operating_hours, description, image_url, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, address, city, phone, email, rating, total_reviews,
        latitude, longitude, operating_hours ? JSON.stringify(operating_hours) : null,
        description, image_url, is_active
      ]
    );

    return NextResponse.json(
      {
        message: "Klinik berhasil dibuat",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal membuat klinik" },
      { status: 500 }
    );
  }
}
