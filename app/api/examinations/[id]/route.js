import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single examination
export async function GET(request, { params }) {
  try {
    const [examination] = await query(
      `SELECT 
        e.id, 
        e.blood_pressure as bloodPressure, 
        e.heart_rate as heartRate, 
        e.temperature, 
        e.weight, 
        e.height, 
        e.notes,
        e.diagnosis,
        e.created_at as createdAt,
        e.updated_at as updatedAt,
        v.id as visitId,
        v.complaint as visitComplaint,
        v.status as visitStatus,
        p.id as patientId,
        p.name as patientName,
        p.mrn as patientMRN,
        d.id as doctorId,
        d.name as doctorName
      FROM examinations e
      LEFT JOIN visits v ON e.visit_id = v.id
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE e.id = ?`,
      [params.id]
    );

    if (!examination) {
      return NextResponse.json(
        { message: "Pemeriksaan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Format the examination data
    const formattedExamination = {
      id: examination.id,
      bloodPressure: examination.bloodPressure,
      heartRate: examination.heartRate,
      temperature: examination.temperature,
      weight: examination.weight,
      height: examination.height,
      notes: examination.notes,
      diagnosis: examination.diagnosis,
      createdAt: examination.createdAt,
      updatedAt: examination.updatedAt,
      visit: {
        id: examination.visitId,
        complaint: examination.visitComplaint,
        status: examination.visitStatus,
        patient: {
          id: examination.patientId,
          name: examination.patientName,
          mrNumber: examination.patientMRN,
        },
        doctor: {
          id: examination.doctorId,
          name: examination.doctorName,
        },
      },
    };

    return NextResponse.json(formattedExamination);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data pemeriksaan" },
      { status: 500 }
    );
  }
}

// PUT update examination
export async function PUT(request, { params }) {
  try {
    const data = await request.json();

    // Update the examination in the database
    await query(
      `UPDATE examinations 
       SET 
        blood_pressure = ?, 
        heart_rate = ?, 
        temperature = ?, 
        weight = ?, 
        height = ?, 
        notes = ?,
        diagnosis = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        data.bloodPressure,
        data.heartRate,
        data.temperature,
        data.weight,
        data.height,
        data.notes,
        data.diagnosis,
        params.id,
      ]
    );

    // Get the updated examination
    const [examination] = await query(
      `SELECT 
        e.id, 
        e.blood_pressure as bloodPressure, 
        e.heart_rate as heartRate, 
        e.temperature, 
        e.weight, 
        e.height, 
        e.notes,
        e.diagnosis,
        e.created_at as createdAt,
        e.updated_at as updatedAt,
        v.id as visitId,
        v.complaint as visitComplaint,
        v.status as visitStatus,
        p.id as patientId,
        p.name as patientName,
        p.mrn as patientMRN,
        d.id as doctorId,
        d.name as doctorName
      FROM examinations e
      LEFT JOIN visits v ON e.visit_id = v.id
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE e.id = ?`,
      [params.id]
    );

    // Format the examination data
    const formattedExamination = {
      id: examination.id,
      bloodPressure: examination.bloodPressure,
      heartRate: examination.heartRate,
      temperature: examination.temperature,
      weight: examination.weight,
      height: examination.height,
      notes: examination.notes,
      diagnosis: examination.diagnosis,
      createdAt: examination.createdAt,
      updatedAt: examination.updatedAt,
      visit: {
        id: examination.visitId,
        complaint: examination.visitComplaint,
        status: examination.visitStatus,
        patient: {
          id: examination.patientId,
          name: examination.patientName,
          mrNumber: examination.patientMRN,
        },
        doctor: {
          id: examination.doctorId,
          name: examination.doctorName,
        },
      },
    };

    return NextResponse.json(formattedExamination);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate pemeriksaan" },
      { status: 500 }
    );
  }
}

// DELETE examination
export async function DELETE(request, { params }) {
  try {
    await query("DELETE FROM examinations WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "Pemeriksaan berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus pemeriksaan" },
      { status: 500 }
    );
  }
}
