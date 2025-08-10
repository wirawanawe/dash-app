import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all examinations
export async function GET() {
  try {
    // Use direct MySQL queries instead of Prisma
    const examinations = await query(`
      SELECT 
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
      ORDER BY e.created_at DESC
    `);

    // Transform the results to match the expected format
    const formattedExaminations = examinations.map((exam) => ({
      id: exam.id,
      bloodPressure: exam.bloodPressure,
      heartRate: exam.heartRate,
      temperature: exam.temperature,
      weight: exam.weight,
      height: exam.height,
      notes: exam.notes,
      diagnosis: exam.diagnosis,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      visit: {
        id: exam.visitId,
        complaint: exam.visitComplaint,
        status: exam.visitStatus,
        patient: {
          id: exam.patientId,
          name: exam.patientName,
          mrNumber: exam.patientMRN,
        },
        doctor: {
          id: exam.doctorId,
          name: exam.doctorName,
        },
      },
    }));

    return NextResponse.json(formattedExaminations);
  } catch (error) {
    console.error("Database error:", error);

    // Provide more specific error details
    let errorMessage = "Gagal mengambil data pemeriksaan";
    let errorCode = 500;

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      errorMessage = "Database connection failed: Access denied";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Database connection failed: Connection refused";
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      errorMessage = "Database error: Table does not exist";
    }

    return NextResponse.json(
      { message: errorMessage, code: error.code, sqlMessage: error.sqlMessage },
      { status: errorCode }
    );
  }
}

// POST new examination
export async function POST(request) {
  try {
    const data = await request.json();

    // Insert examination using MySQL query
    const result = await query(
      `INSERT INTO examinations 
        (visit_id, blood_pressure, heart_rate, temperature, weight, height, notes, diagnosis, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.visitId,
        data.bloodPressure,
        data.heartRate,
        data.temperature,
        data.weight,
        data.height,
        data.notes,
        data.diagnosis,
      ]
    );

    const examinationId = result.insertId;

    // Get the newly created examination
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
      [examinationId]
    );

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
      { message: "Gagal menambahkan pemeriksaan" },
      { status: 500 }
    );
  }
}
