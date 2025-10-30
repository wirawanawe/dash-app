import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single doctor
export async function GET(request, { params }) {
  try {
    const [doctor] = await query(
      "SELECT d.*, p.name as polyclinic_name FROM doctors d LEFT JOIN polyclinics p ON d.polyclinic_id = p.id WHERE d.id = ?",
      [parseInt(params.id)]
    );

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to fetch doctor" },
      { status: 500 }
    );
  }
}

// PUT update doctor
export async function PUT(request, { params }) {
  try {
    const data = await request.json();

    await query(
      `UPDATE doctors SET 
       nip = ?, nik = ?, name = ?, speciality = ?, phone = ?, 
       email = ?, polyclinic_id = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        data.nip?.trim(),
        data.nik?.trim() || null,
        data.name?.trim(),
        data.speciality?.trim(),
        data.phone?.trim() || null,
        data.email?.trim() || null,
        data.polyclinicId ? parseInt(data.polyclinicId) : null,
        data.status,
        parseInt(params.id),
      ]
    );

    // Get updated doctor with polyclinic
    const [doctor] = await query(
      "SELECT d.*, p.name as polyclinic_name FROM doctors d LEFT JOIN polyclinics p ON d.polyclinic_id = p.id WHERE d.id = ?",
      [parseInt(params.id)]
    );

    return NextResponse.json(doctor);
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

// DELETE doctor
export async function DELETE(request, { params }) {
  try {
    await query("DELETE FROM doctors WHERE id = ?", [parseInt(params.id)]);
    return NextResponse.json({ message: "Doctor deleted successfully" });
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    );
  }
}
