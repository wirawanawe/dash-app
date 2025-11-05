import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single polyclinic
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    const [polyclinic] = await query(
      'SELECT id, name, code, description, status, created_at, updated_at FROM polyclinics WHERE id = ?',
      [id]
    );

    if (!polyclinic) {
      return NextResponse.json(
        { error: "Poli tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(polyclinic);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

// PUT update polyclinic
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.code) {
      return NextResponse.json(
        { error: "Nama dan kode poli harus diisi" },
        { status: 400 }
      );
    }
    
    // Check if new code conflicts with other polyclinics
    const [existingWithCode] = await query(
      'SELECT id, name, code FROM polyclinics WHERE code = ? AND id != ?',
      [data.code, id]
    );
    
    if (existingWithCode) {
      return NextResponse.json(
        { 
          error: `Kode poli "${data.code}" sudah digunakan oleh "${existingWithCode.name}". Gunakan kode yang berbeda.`,
          existingPoli: existingWithCode
        },
        { status: 409 }
      );
    }
    
    await query(
      `UPDATE polyclinics 
       SET name = ?, code = ?, description = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        data.name,
        data.code.toUpperCase(), // Uppercase untuk consistency
        data.description || null,
        data.status || 'Aktif',
        id
      ]
    );
    
    // Get updated polyclinic
    const [updated] = await query(
      'SELECT id, name, code, description, status, created_at, updated_at FROM polyclinics WHERE id = ?',
      [id]
    );
    
    return NextResponse.json(updated);
  } catch (error) {
    // Handle duplicate key error
    if (error.message.includes('Duplicate entry') || error.message.includes('unique_code')) {
      return NextResponse.json(
        { error: "Kode poli sudah ada. Gunakan kode yang berbeda." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Gagal mengupdate poli" },
      { status: 500 }
    );
  }
}

// DELETE polyclinic
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    // Check if polyclinic exists
    const [polyclinic] = await query(
      'SELECT id, name FROM polyclinics WHERE id = ?',
      [id]
    );
    
    if (!polyclinic) {
      return NextResponse.json(
        { error: "Poli tidak ditemukan" },
        { status: 404 }
      );
    }
    
    // Check if polyclinic is used by doctors
    const [doctorCount] = await query(
      'SELECT COUNT(*) as count FROM doctors WHERE polyclinic_id = ?',
      [id]
    );
    
    if (doctorCount.count > 0) {
      return NextResponse.json(
        { 
          error: `Tidak dapat menghapus poli "${polyclinic.name}" karena masih digunakan oleh ${doctorCount.count} dokter.`,
          doctorCount: doctorCount.count
        },
        { status: 400 }
      );
    }
    
    await query('DELETE FROM polyclinics WHERE id = ?', [id]);
    
    return NextResponse.json({ 
      success: true,
      message: "Poli berhasil dihapus" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus poli" },
      { status: 500 }
    );
  }
}
