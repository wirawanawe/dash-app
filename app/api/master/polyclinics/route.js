import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all polyclinics
export async function GET() {
  try {
    const sql = `
      SELECT id, name, code, description, status, created_at, updated_at
      FROM polyclinics
      WHERE status = 'Aktif' OR status IS NULL
      ORDER BY name ASC
    `;
    
    const polyclinics = await query(sql);
    return NextResponse.json(polyclinics);
  } catch (error) {
    console.error("Error fetching polyclinics:", error);
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
    console.error("Error creating polyclinic:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan poli" },
      { status: 500 }
    );
  }
}
