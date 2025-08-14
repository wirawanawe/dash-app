import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

// GET /api/mobile/visits - get user's medical visit history
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE v.user_id = ?";
    let params = [userId];

    if (status) {
      whereClause += " AND v.status = ?";
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM mobile_visits v
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const totalResults = parseInt(countResult[0].total);

    // Get visits with clinic and doctor information
    const visitsQuery = `
      SELECT 
        v.id,
        v.user_id,
        v.visit_date,
        v.visit_time,
        v.visit_type,
        v.clinic_name,
        v.doctor_name,
        v.diagnosis,
        v.treatment,
        v.prescription,
        v.notes,
        v.status,
        v.cost,
        v.payment_status,
        v.created_at,
        v.updated_at
      FROM mobile_visits v
      ${whereClause}
      ORDER BY v.visit_date DESC, v.visit_time DESC
      LIMIT ? OFFSET ?
    `;

    const visits = await query(visitsQuery, [...params, limit, offset]);

    // Transform visits to match expected format
    const transformedVisits = visits.map(visit => ({
      id: visit.id,
      date: visit.visit_date,
      clinicName: visit.clinic_name || "Klinik Utama",
      doctorName: visit.doctor_name || "Dokter",
      visitType: visit.visit_type || "Konsultasi Umum",
      diagnosis: visit.diagnosis || "Tidak ada diagnosis",
      treatment: visit.treatment || "Tidak ada treatment",
      prescription: visit.prescription ? JSON.parse(visit.prescription) : [],
      notes: visit.notes || "",
      status: visit.status || "completed",
      cost: visit.cost || 0,
      paymentStatus: visit.payment_status || "paid"
    }));

    return NextResponse.json({
      success: true,
      data: transformedVisits,
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages: Math.ceil(totalResults / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching medical visits:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil riwayat medis",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/mobile/visits - create new medical visit record
export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const body = await request.json();
    
    const {
      visit_date,
      visit_time,
      visit_type,
      clinic_name,
      doctor_name,
      diagnosis,
      treatment,
      prescription,
      notes,
      status = "completed",
      cost = 0,
      payment_status = "paid"
    } = body;

    // Validate required fields
    if (!visit_date || !clinic_name || !doctor_name) {
      return NextResponse.json(
        {
          success: false,
          message: "visit_date, clinic_name, dan doctor_name harus diisi",
        },
        { status: 400 }
      );
    }

    // Insert new visit record
    const insertQuery = `
      INSERT INTO mobile_visits (
        user_id, visit_date, visit_time, visit_type, clinic_name, 
        doctor_name, diagnosis, treatment, prescription, notes, 
        status, cost, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertParams = [
      userId,
      visit_date,
      visit_time || null,
      visit_type || "Konsultasi Umum",
      clinic_name,
      doctor_name,
      diagnosis || null,
      treatment || null,
      prescription ? JSON.stringify(prescription) : null,
      notes || null,
      status,
      cost,
      payment_status
    ];

    const [result] = await query(insertQuery, insertParams);

    return NextResponse.json({
      success: true,
      message: "Riwayat medis berhasil ditambahkan",
      data: {
        id: result.insertId,
        visit_date,
        clinic_name,
        doctor_name
      }
    });

  } catch (error) {
    console.error("Error creating medical visit:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan riwayat medis",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
