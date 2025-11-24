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
    const page = parseInt(searchParams.get("page"), 10) || 1;
    const limit = parseInt(searchParams.get("limit"), 10) || 20;
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const insuranceNumber = searchParams.get("insurance_number");
    const ktpNumber = searchParams.get("ktp_number");
    
    // Validate pagination
    const safeLimit = Math.max(1, Math.min(100, limit));
    const safeOffset = Math.max(0, (page - 1) * safeLimit);

    // Get mobile user profile to find KTP/Insurance number (prioritize KTP)
    let patientNik = null;
    let patientInsuranceNumber = null;
    
    try {
      const [userProfile] = await query(
        `SELECT ktp_number, insurance_card_number 
         FROM mobile_users 
         WHERE id = ?`,
        [userId]
      );
      
      if (userProfile) {
        // Prioritize KTP number
        patientNik = userProfile.ktp_number || ktpNumber;
        patientInsuranceNumber = userProfile.insurance_card_number || insuranceNumber;
      }
    } catch (userError) {
      console.warn('⚠️ Could not fetch user profile:', userError.message);
    }

    // Build WHERE clause - search by NIK (priority) or insurance number in visits table
    let whereConditions = [];
    let params = [];

    // Priority 1: Search by NIK (patient_nik in visits table) - most reliable
    if (patientNik && patientNik.trim() !== '') {
      whereConditions.push("v.patient_nik = ?");
      params.push(patientNik.trim());
    } else if (patientInsuranceNumber && patientInsuranceNumber.trim() !== '') {
      // Priority 2: If no NIK, try searching by insurance number (if available in visits table)
      whereConditions.push("(v.insurance_number = ? OR v.insurance_card_number = ? OR v.patient_no_peserta = ?)");
      params.push(patientInsuranceNumber.trim(), patientInsuranceNumber.trim(), patientInsuranceNumber.trim());
    } else {
      // If no identifiers found, return empty result
      return NextResponse.json({
        success: true,
        data: [],
        message: "No patient identifier found. Please sync your patient data first.",
        pagination: {
          page,
          limit: safeLimit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Add additional filters
    if (status) {
      whereConditions.push("v.status = ?");
      params.push(status);
    }

    if (date) {
      whereConditions.push("DATE(v.visit_date) = DATE(?)");
      params.push(date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count from visits table
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM visits v
      ${whereClause}
    `;

    let countResult;
    try {
      countResult = await query(countQuery, params);
    } catch (countError) {
      // If table doesn't exist or error, return empty result
      if (countError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({
          success: true,
          data: [],
          message: "Visits table not found",
          pagination: {
            page,
            limit: safeLimit,
            total: 0,
            totalPages: 0
          }
        });
      }
      throw countError;
    }

    const totalResults = parseInt(countResult[0]?.total || 0);

    // Get visits from visits table with proper column mapping
    const visitsQuery = `
      SELECT 
        v.id,
        v.patient_nik,
        v.patient_name,
        v.visit_date,
        v.visit_time,
        v.clinic as clinic_name,
        v.room as polyclinic_name,
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
      FROM visits v
      ${whereClause}
      ORDER BY v.visit_date DESC, v.visit_time DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    let visits;
    try {
      visits = await query(visitsQuery, params);
    } catch (queryError) {
      if (queryError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({
          success: true,
          data: [],
          message: "Visits table not found",
          pagination: {
            page,
            limit: safeLimit,
            total: 0,
            totalPages: 0
          }
        });
      }
      throw queryError;
    }

    // Transform visits to match expected format (from visits table structure)
    const transformedVisits = (visits || []).map(visit => ({
      id: visit.id,
      date: visit.visit_date,
      clinicName: visit.clinic_name || visit.clinic || "Klinik Utama",
      polyclinicName: visit.polyclinic_name || visit.room || null,
      doctorName: visit.doctor_name || "Dokter",
      visitType: visit.visit_type || visit.polyclinic_name || visit.room || "Konsultasi Umum",
      diagnosis: visit.diagnosis || "Tidak ada diagnosis",
      treatment: visit.treatment || "Tidak ada treatment",
      prescription: visit.prescription ? (
        typeof visit.prescription === 'string' 
          ? (() => {
              try { return JSON.parse(visit.prescription); } 
              catch { return [visit.prescription]; }
            })()
          : visit.prescription
      ) : [],
      notes: visit.notes || "",
      status: visit.status || "completed",
      cost: visit.cost || 0,
      paymentStatus: visit.payment_status || "paid",
      patientName: visit.patient_name || null,
      patientNik: visit.patient_nik || null
    }));

    return NextResponse.json({
      success: true,
      data: transformedVisits,
      pagination: {
        page,
        limit: safeLimit,
        total: totalResults,
        totalPages: Math.ceil(totalResults / safeLimit)
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/mobile/visits:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });

    // Check if it's a table doesn't exist error
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Visits table not found in database",
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      }, { status: 200 });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil riwayat medis",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
