import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/mobile/clinics - get all active clinics for mobile app
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get total count of active clinics
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM clinics
      WHERE is_active = 1 AND
        (LOWER(name) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?) OR
        LOWER(city) LIKE LOWER(?))
    `;

    const countResult = await query(countQuery, [`%${search}%`, `%${search}%`, `%${search}%`]);
    const totalResults = parseInt(countResult[0].total);

    // Get paginated results of active clinics
    const clinicsQuery = `
      SELECT 
        id, name, address, city, phone, email,
        rating, total_reviews, latitude, longitude,
        operating_hours, description, image_url
      FROM clinics
      WHERE is_active = 1 AND
        (LOWER(name) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?) OR
        LOWER(city) LIKE LOWER(?))
      ORDER BY rating DESC, total_reviews DESC, name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const clinics = await query(clinicsQuery, [`%${search}%`, `%${search}%`, `%${search}%`]);

    // Process operating hours if it's stored as JSON
    const processedClinics = clinics.map(clinic => ({
      ...clinic,
      operating_hours: clinic.operating_hours ? 
        (typeof clinic.operating_hours === 'string' ? 
          JSON.parse(clinic.operating_hours) : clinic.operating_hours) : 
        null
    }));

    return NextResponse.json({
      success: true,
      data: processedClinics,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {
    console.error("Error getting mobile clinics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data klinik",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/mobile/clinics - not supported for mobile app
export async function POST(request) {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed for mobile app",
    },
    { status: 405 }
  );
} 