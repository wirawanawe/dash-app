import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/mobile/clinics/consultation/doctors - get doctors available for consultation
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get total count of doctors available for consultation
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM doctors d
      LEFT JOIN doctor_specializations ds ON d.id = ds.doctor_id
      WHERE d.is_available_for_consultation = 1
        AND (LOWER(d.name) LIKE LOWER(?) OR 
             LOWER(d.specialist) LIKE LOWER(?) OR
             LOWER(ds.specialization_name) LIKE LOWER(?))
    `;

    const countResult = await query(countQuery, [`%${search}%`, `%${search}%`, `%${search}%`]);
    const totalResults = parseInt(countResult[0].total);

    // Get paginated results of doctors available for consultation
    const doctorsQuery = `
      SELECT DISTINCT
        d.id, d.name, d.specialist, d.qualification,
        d.experience_years, d.consultation_fee, d.rating,
        d.total_reviews, d.image_url, d.bio,
        d.is_available_for_consultation, d.consultation_schedule,
        GROUP_CONCAT(DISTINCT ds.specialization_name) as specializations
      FROM doctors d
      LEFT JOIN doctor_specializations ds ON d.id = ds.doctor_id
      WHERE d.is_available_for_consultation = 1
        AND (LOWER(d.name) LIKE LOWER(?) OR 
             LOWER(d.specialist) LIKE LOWER(?) OR
             LOWER(ds.specialization_name) LIKE LOWER(?))
      GROUP BY d.id
      ORDER BY d.rating DESC, d.total_reviews DESC, d.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const doctors = await query(doctorsQuery, [`%${search}%`, `%${search}%`, `%${search}%`]);

    // Process consultation schedule if it's stored as JSON
    const processedDoctors = doctors.map(doctor => ({
      ...doctor,
      consultation_schedule: doctor.consultation_schedule ? 
        (typeof doctor.consultation_schedule === 'string' ? 
          JSON.parse(doctor.consultation_schedule) : doctor.consultation_schedule) : 
        null,
      specializations: doctor.specializations ? doctor.specializations.split(',') : []
    }));

    return NextResponse.json({
      success: true,
      data: processedDoctors,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {
    console.error("Error getting consultation doctors:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data dokter konsultasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/mobile/clinics/consultation/doctors - not supported for mobile app
export async function POST(request) {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed for mobile app",
    },
    { status: 405 }
  );
} 