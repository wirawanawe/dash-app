import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single doctor with polyclinic and clinic information
export async function GET(request, { params }) {
  try {
    const [doctor] = await query(
      `SELECT 
        d.id, 
        d.name, 
        d.specialist, 
        d.license_number, 
        d.phone, 
        d.email, 
        d.address,
        d.clinic_id,
        d.polyclinic_id,
        c.name as clinic_name,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        d.created_at as createdAt, 
        d.updated_at as updatedAt
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
      WHERE d.id = ?`,
      [params.id]
    );

    if (!doctor) {
      return NextResponse.json(
        { message: "Dokter tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal mengambil data dokter", error: error.message },
      { status: 500 }
    );
  }
}

// PUT update doctor
export async function PUT(request, { params }) {
  try {
    const { name, specialist, license_number, phone, email, address, clinic_id, polyclinic_id } =
      await request.json();

    // Validasi data
    if (!name) {
      return NextResponse.json(
        { message: "Nama dokter harus diisi" },
        { status: 400 }
      );
    }

    // Get current doctor data
    const [existingDoctor] = await query("SELECT * FROM doctors WHERE id = ?", [
      params.id,
    ]);

    if (!existingDoctor) {
      return NextResponse.json(
        { message: "Dokter tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update doctor based on provided fields
    await query(
      `UPDATE doctors SET 
        name = ?, 
        specialist = ?, 
        license_number = ?, 
        phone = ?, 
        email = ?, 
        address = ?,
        clinic_id = ?,
        polyclinic_id = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        specialist || null,
        license_number || null,
        phone || null,
        email || null,
        address || null,
        clinic_id || null,
        polyclinic_id || null,
        params.id,
      ]
    );

    // Get updated doctor data
    const [updatedDoctor] = await query(
      `SELECT 
        d.id, 
        d.name, 
        d.specialist, 
        d.license_number, 
        d.phone, 
        d.email, 
        d.address,
        d.clinic_id,
        d.polyclinic_id,
        c.name as clinic_name,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        d.created_at as createdAt, 
        d.updated_at as updatedAt
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
      WHERE d.id = ?`,
      [params.id]
    );

    return NextResponse.json(updatedDoctor);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal mengupdate dokter", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE doctor
export async function DELETE(request, { params }) {
  try {
    // Check if doctor exists
    const [doctor] = await query("SELECT id FROM doctors WHERE id = ?", [
      params.id,
    ]);

    if (!doctor) {
      return NextResponse.json(
        { message: "Dokter tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete doctor
    await query("DELETE FROM doctors WHERE id = ?", [params.id]);

    return NextResponse.json({
      success: true,
      message: "Dokter berhasil dihapus",
    });
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal menghapus dokter", error: error.message },
      { status: 500 }
    );
  }
}
