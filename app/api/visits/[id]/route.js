import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single visit
export async function GET(request, { params }) {
  try {
    const [visit] = await query(
      `SELECT 
        v.id, 
        v.complaint, 
        v.treatment, 
        v.notes, 
        v.status, 
        v.room,
        v.created_at as createdAt,
        v.updated_at as updatedAt,
        p.id as patientId, 
        p.name as patientName, 
        p.mrn as patientMRN,
        d.id as doctorId, 
        d.name as doctorName
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE v.id = ?`,
      [params.id]
    );

    if (!visit) {
      return NextResponse.json(
        { message: "Kunjungan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Format the visit data
    const formattedVisit = {
      id: visit.id,
      complaint: visit.complaint,
      treatment: visit.treatment,
      notes: visit.notes,
      status: visit.status,
      room: visit.room,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
      patient: {
        id: visit.patientId,
        name: visit.patientName,
        mrNumber: visit.patientMRN,
      },
      doctor: {
        id: visit.doctorId,
        name: visit.doctorName,
      },
      examinations: [],
    };

    return NextResponse.json(formattedVisit);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data kunjungan" },
      { status: 500 }
    );
  }
}

// PUT update visit
export async function PUT(request, { params }) {
  try {
    const data = await request.json();

    // Update the visit in the database
    await query(
      `UPDATE visits 
       SET 
        patient_id = ?, 
        doctor_id = ?, 
        room = ?, 
        complaint = ?, 
        treatment = ?, 
        notes = ?, 
        status = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        data.patientId,
        data.doctorId,
        data.room,
        data.complaint,
        data.treatment,
        data.notes,
        data.status,
        params.id,
      ]
    );

    // Get the updated visit
    const [visit] = await query(
      `SELECT 
        v.id, 
        v.complaint, 
        v.treatment, 
        v.notes, 
        v.status, 
        v.room,
        v.created_at as createdAt,
        v.updated_at as updatedAt,
        p.id as patientId, 
        p.name as patientName, 
        p.mrn as patientMRN,
        d.id as doctorId, 
        d.name as doctorName
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE v.id = ?`,
      [params.id]
    );

    // Format the visit data
    const formattedVisit = {
      id: visit.id,
      complaint: visit.complaint,
      treatment: visit.treatment,
      notes: visit.notes,
      status: visit.status,
      room: visit.room,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
      patient: {
        id: visit.patientId,
        name: visit.patientName,
        mrNumber: visit.patientMRN,
      },
      doctor: {
        id: visit.doctorId,
        name: visit.doctorName,
      },
      examinations: [],
    };

    return NextResponse.json(formattedVisit);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate kunjungan" },
      { status: 500 }
    );
  }
}

// DELETE visit
export async function DELETE(request, { params }) {
  try {
    await query("DELETE FROM visits WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "Kunjungan berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus kunjungan" },
      { status: 500 }
    );
  }
}
