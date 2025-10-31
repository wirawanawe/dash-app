import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all polyclinics with related data from visits
export async function GET(request) {
  try {
    // Get clinic_code from query params if provided
    const { searchParams } = new URL(request.url);
    const clinicCode = searchParams.get('clinic_code');
    
    
    // Build the doctor count subquery with optional clinic filter
    const doctorCountSubquery = clinicCode
      ? `(
          SELECT COUNT(DISTINCT v.doctor_name)
          FROM visits v
          WHERE (v.clinic = p.name OR v.room = p.name)
            AND v.facility_code = ?
            AND v.doctor_name IS NOT NULL
            AND v.doctor_name != ''
            AND v.doctor_name != '-'
        )`
      : `(
          SELECT COUNT(DISTINCT v.doctor_name)
          FROM visits v
          WHERE (v.clinic = p.name OR v.room = p.name)
            AND v.doctor_name IS NOT NULL
            AND v.doctor_name != ''
            AND v.doctor_name != '-'
        )`;
    
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.code,
        p.description,
        p.status,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT cp.clinic_id) as clinic_count,
        ${doctorCountSubquery} as doctor_count
      FROM polyclinics p
      LEFT JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id AND cp.is_active = TRUE
      GROUP BY p.id, p.name, p.code, p.description, p.status, p.created_at, p.updated_at
      ORDER BY p.name ASC
    `;
    
    const params = clinicCode ? [clinicCode] : [];
    const polyclinics = await query(sql, params);
    
    return NextResponse.json(polyclinics);
  } catch (error) {
    console.error('Error fetching polyclinics:', error);
    return NextResponse.json(
      { message: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

// POST new polyclinic
export async function POST(request) {
  try {
    const data = await request.json();
    
    const result = await query(`
      INSERT INTO polyclinics (name, code, description, status) 
      VALUES (?, ?, ?, ?)
    `, [
      data.name,
      data.code || data.name.toUpperCase().replace(/\s+/g, '-'),
      data.description || null,
      data.status || "Aktif"
    ]);
    
    const newPolyclinic = await query(`
      SELECT * FROM polyclinics WHERE id = ?
    `, [result.insertId]);
    
    return NextResponse.json(newPolyclinic[0]);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal menambahkan poli" },
      { status: 500 }
    );
  }
}
