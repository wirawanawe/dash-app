import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all visits
export async function GET() {
  try {
    // Use direct MySQL queries instead of Prisma
    const visits = await query(`
      SELECT 
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
      ORDER BY v.created_at DESC
    `);

    // Transform the results to match the expected format
    const formattedVisits = visits.map((visit) => ({
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
    }));

    return NextResponse.json(formattedVisits);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data kunjungan" },
      { status: 500 }
    );
  }
}

// POST new visit
export async function POST(request) {
  try {
    const data = await request.json();

    // Insert visit using MySQL query
    const result = await query(
      `INSERT INTO visits 
        (patient_id, doctor_id, room, complaint, treatment, notes, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.patientId,
        data.doctorId,
        data.room,
        data.complaint,
        data.treatment,
        data.notes,
        data.status || "Menunggu",
      ]
    );

    const visitId = result.insertId;

    // Get the newly created visit
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
      [visitId]
    );

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
      { message: "Gagal menambahkan kunjungan" },
      { status: 500 }
    );
  }
}
