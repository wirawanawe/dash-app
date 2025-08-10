import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET polyclinics for a specific clinic
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const polyclinics = await query(`
      SELECT 
        p.*,
        cp.is_active as is_available,
        cp.created_at as added_at
      FROM polyclinics p
      LEFT JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id AND cp.clinic_id = ?
      ORDER BY p.name ASC
    `, [id]);
    
    return NextResponse.json(polyclinics);
  } catch (error) {
    console.error("Error fetching clinic polyclinics:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data poli klinik" },
      { status: 500 }
    );
  }
}

// POST to add polyclinic to clinic
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Check if relationship already exists
    const existing = await query(`
      SELECT * FROM clinic_polyclinics 
      WHERE clinic_id = ? AND polyclinic_id = ?
    `, [id, data.polyclinic_id]);
    
    if (existing.length > 0) {
      // Update existing relationship
      await query(`
        UPDATE clinic_polyclinics 
        SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE clinic_id = ? AND polyclinic_id = ?
      `, [id, data.polyclinic_id]);
    } else {
      // Create new relationship
      await query(`
        INSERT INTO clinic_polyclinics (clinic_id, polyclinic_id, is_active)
        VALUES (?, ?, TRUE)
      `, [id, data.polyclinic_id]);
    }
    
    return NextResponse.json({ message: "Poli berhasil ditambahkan ke klinik" });
  } catch (error) {
    console.error("Error adding polyclinic to clinic:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan poli ke klinik" },
      { status: 500 }
    );
  }
}

// DELETE to remove polyclinic from clinic (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const polyclinicId = searchParams.get('polyclinic_id');
    
    if (!polyclinicId) {
      return NextResponse.json(
        { message: "ID poli diperlukan" },
        { status: 400 }
      );
    }
    
    await query(`
      UPDATE clinic_polyclinics 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE clinic_id = ? AND polyclinic_id = ?
    `, [id, polyclinicId]);
    
    return NextResponse.json({ message: "Poli berhasil dihapus dari klinik" });
  } catch (error) {
    console.error("Error removing polyclinic from clinic:", error);
    return NextResponse.json(
      { message: "Gagal menghapus poli dari klinik" },
      { status: 500 }
    );
  }
} 