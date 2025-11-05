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

    // Check if code already exists (prevent duplicate)
    const [existing] = await query(
      'SELECT id, name, code FROM polyclinics WHERE code = ?',
      [data.code]
    );
    
    if (existing) {
      return NextResponse.json(
        { 
          error: `Kode poli "${data.code}" sudah digunakan oleh "${existing.name}". Gunakan kode yang berbeda.`,
          existingPoli: existing
        },
        { status: 409 } // 409 Conflict
      );
    }

    const sql = `
      INSERT INTO polyclinics (name, code, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      data.name,
      data.code.toUpperCase(), // Uppercase untuk consistency
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
    // Handle duplicate key error from database
    if (error.message.includes('Duplicate entry') || error.message.includes('unique_code')) {
      return NextResponse.json(
        { error: "Kode poli sudah ada. Gunakan kode yang berbeda." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Gagal menambahkan poli" },
      { status: 500 }
    );
  }
}
