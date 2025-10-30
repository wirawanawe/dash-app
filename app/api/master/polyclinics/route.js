import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all polyclinics with doctor count from visits
export async function GET() {
  try {
    const sql = `
      SELECT 
        p.id, 
        p.name, 
        p.code, 
        p.description, 
        p.status, 
        p.created_at, 
        p.updated_at,
        (
          SELECT COUNT(DISTINCT v.doctor_name)
          FROM visits v
          WHERE (v.clinic = p.name OR v.room = p.name)
            AND v.doctor_name IS NOT NULL
            AND v.doctor_name != ''
            AND v.doctor_name != '-'
        ) as doctor_count
      FROM polyclinics p
      WHERE p.status = 'Aktif' OR p.status IS NULL
      ORDER BY p.name ASC
    `;
    
    const polyclinics = await query(sql);
    console.log('Master Polyclinics with doctor count:', polyclinics.map(p => ({ 
      name: p.name, 
      doctor_count: p.doctor_count 
    })));
    
    return NextResponse.json(polyclinics);
  } catch (error) {
    console.error('Error fetching master polyclinics:', error);
    return NextResponse.json(
      { error: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

// POST new polyclinic
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.code) {
      return NextResponse.json(
        { error: "Nama dan kode poli harus diisi" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO polyclinics (name, code, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      data.name,
      data.code,
      data.description || null,
      data.status || 'Aktif'
    ];

    const result = await query(sql, params);

    // Get the newly created polyclinic
    const [newPolyclinic] = await query(
      `SELECT id, name, code, description, status, created_at, updated_at
       FROM polyclinics WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json(newPolyclinic, { status: 201 });
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal menambahkan poli" },
      { status: 500 }
    );
  }
}
