import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single doctor
export async function GET(request, { params }) {
  try {
    const [doctor] = await query(
      `SELECT 
        id, 
        name, 
        specialist, 
        license_number, 
        phone, 
        email, 
        address,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM doctors
      WHERE id = ?`,
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
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data dokter", error: error.message },
      { status: 500 }
    );
  }
}

// PUT update doctor
export async function PUT(request, { params }) {
  try {
    const { name, specialist, license_number, phone, email, address } =
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
        updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        specialist || null,
        license_number || null,
        phone || null,
        email || null,
        address || null,
        params.id,
      ]
    );

    // Get updated doctor data
    const [updatedDoctor] = await query(
      `SELECT 
        id, 
        name, 
        specialist, 
        license_number, 
        phone, 
        email, 
        address,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM doctors
      WHERE id = ?`,
      [params.id]
    );

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error("Error updating doctor:", error);
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
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { message: "Gagal menghapus dokter", error: error.message },
      { status: 500 }
    );
  }
}
