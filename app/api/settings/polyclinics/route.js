import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all polyclinics with related data
export async function GET() {
  try {
    const polyclinics = await query(`
      SELECT 
        p.*,
        COUNT(DISTINCT cp.clinic_id) as clinic_count,
        COUNT(DISTINCT d.id) as doctor_count
      FROM polyclinics p
      LEFT JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id AND cp.is_active = TRUE
      LEFT JOIN doctors d ON p.id = d.polyclinic_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    
    return NextResponse.json(polyclinics);
  } catch (error) {

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
