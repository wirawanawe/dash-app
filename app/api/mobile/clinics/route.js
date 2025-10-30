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

    // Get services (polyclinics) and doctors for each clinic
    const processedClinics = [];
    
    for (const clinic of clinics) {
      // Get polyclinics (services) for this clinic
      const servicesQuery = `
        SELECT 
          p.id, p.name, p.code, p.description,
          'Konsultasi' as price,
          '30 min' as duration
        FROM polyclinics p
        INNER JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id
        WHERE cp.clinic_id = ? AND cp.is_active = TRUE AND p.status = 'Aktif'
        ORDER BY p.name ASC
      `;
      
      const services = await query(servicesQuery, [clinic.id]);
      
      // Get doctors for each service in this clinic
      const servicesWithDoctors = [];
      
      for (const service of services) {
        const doctorsQuery = `
          SELECT 
            d.id, d.name, d.specialist as specialization,
            COALESCE(d.rating, 4.5) as rating
          FROM doctors d
          WHERE d.clinic_id = ? AND d.polyclinic_id = ?
          ORDER BY d.name ASC
        `;
        
        const doctors = await query(doctorsQuery, [clinic.id, service.id]);
        
        servicesWithDoctors.push({
          ...service,
          doctors: doctors
        });
      }
      
      // Get all doctors for this clinic (for backward compatibility)
      const allDoctorsQuery = `
        SELECT 
          d.id, d.name, d.specialist as specialization,
          d.polyclinic_id as service_id,
          COALESCE(d.rating, 4.5) as rating
        FROM doctors d
        WHERE d.clinic_id = ?
        ORDER BY d.name ASC
      `;
      
      const allDoctors = await query(allDoctorsQuery, [clinic.id]);
      
      processedClinics.push({
        ...clinic,
        operating_hours: clinic.operating_hours ? 
          (typeof clinic.operating_hours === 'string' ? 
            JSON.parse(clinic.operating_hours) : clinic.operating_hours) : 
          null,
        services: servicesWithDoctors,
        doctors: allDoctors
      });
    }

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