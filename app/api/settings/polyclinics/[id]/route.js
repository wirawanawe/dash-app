import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET specific polyclinic with related data
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const polyclinic = await query(`
      SELECT 
        p.*,
        COUNT(DISTINCT cp.clinic_id) as clinic_count,
        COUNT(DISTINCT d.id) as doctor_count
      FROM polyclinics p
      LEFT JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id AND cp.is_active = TRUE
      LEFT JOIN doctors d ON p.id = d.polyclinic_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);
    
    if (polyclinic.length === 0) {
      return NextResponse.json(
        { message: "Poli tidak ditemukan" },
        { status: 404 }
      );
    }
    
    // Get related clinics
    const clinics = await query(`
      SELECT c.* 
      FROM clinics c
      JOIN clinic_polyclinics cp ON c.id = cp.clinic_id
      WHERE cp.polyclinic_id = ? AND cp.is_active = TRUE
      ORDER BY c.name ASC
    `, [id]);
    
    // Get related doctors
    const doctors = await query(`
      SELECT d.*, c.name as clinic_name
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      WHERE d.polyclinic_id = ?
      ORDER BY d.name ASC
    `, [id]);
    
    const result = {
      ...polyclinic[0],
      clinics,
      doctors
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching polyclinic:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

// PUT update polyclinic
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const result = await query(`
      UPDATE polyclinics 
      SET name = ?, code = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.name,
      data.code || data.name.toUpperCase().replace(/\s+/g, '-'),
      data.description || null,
      data.status || "Aktif",
      id
    ]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Poli tidak ditemukan" },
        { status: 404 }
      );
    }
    
    const updatedPolyclinic = await query(`
      SELECT * FROM polyclinics WHERE id = ?
    `, [id]);
    
    return NextResponse.json(updatedPolyclinic[0]);
  } catch (error) {
    console.error("Error updating polyclinic:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate poli" },
      { status: 500 }
    );
  }
}

// DELETE polyclinic
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check if polyclinic has related data
    const relatedData = await query(`
      SELECT 
        (SELECT COUNT(*) FROM clinic_polyclinics WHERE polyclinic_id = ?) as clinic_relations,
        (SELECT COUNT(*) FROM doctors WHERE polyclinic_id = ?) as doctor_relations
    `, [id, id]);
    
    if (relatedData[0].clinic_relations > 0 || relatedData[0].doctor_relations > 0) {
      return NextResponse.json(
        { 
          message: "Poli tidak dapat dihapus karena masih terkait dengan klinik atau dokter",
          clinic_relations: relatedData[0].clinic_relations,
          doctor_relations: relatedData[0].doctor_relations
        },
        { status: 400 }
      );
    }
    
    const result = await query(`
      DELETE FROM polyclinics WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Poli tidak ditemukan" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Poli berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting polyclinic:", error);
    return NextResponse.json(
      { message: "Gagal menghapus poli" },
      { status: 500 }
    );
  }
}
