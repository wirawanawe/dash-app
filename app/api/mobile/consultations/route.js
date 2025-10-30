import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/mobile/consultations - get user's consultations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Build WHERE clause
    let whereClause = "WHERE c.user_id = ?";
    const params = [userId];

    if (status) {
      whereClause += " AND c.status = ?";
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM consultations c
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const totalResults = parseInt(countResult[0].total);

    // Get consultations with doctor and chat info
    const consultationsQuery = `
      SELECT 
        c.id, c.type, c.status, c.scheduled_at, c.started_at, c.ended_at,
        c.consultation_notes, c.prescription, c.follow_up_required,
        c.follow_up_date, c.fee, c.payment_status, c.created_at,
        d.id as doctor_id, d.name as doctor_name, d.specialist as doctor_specialist,
        d.qualification as doctor_qualification, d.image_url as doctor_image,
        ch.id as chat_id, ch.status as chat_status
      FROM consultations c
      LEFT JOIN doctors d ON c.doctor_id = d.id
      LEFT JOIN chats ch ON c.chat_id = ch.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const consultations = await query(consultationsQuery, params);

    return NextResponse.json({
      success: true,
      data: consultations,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data konsultasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/mobile/consultations/book - book a new consultation
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      doctor_id,
      type = 'general',
      scheduled_at,
      complaint,
      user_id
    } = body;

    if (!doctor_id || !user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor ID and User ID are required",
        },
        { status: 400 }
      );
    }

    // Check if doctor exists and is available for consultation
    const doctorCheck = await query(
      "SELECT id, consultation_fee FROM doctors WHERE id = ? AND is_available_for_consultation = 1",
      [doctor_id]
    );

    if (doctorCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor not found or not available for consultation",
        },
        { status: 404 }
      );
    }

    const consultationFee = doctorCheck[0].consultation_fee || 0;

    // Create consultation
    const insertQuery = `
      INSERT INTO consultations (
        user_id, doctor_id, type, status, scheduled_at,
        consultation_notes, fee, payment_status, created_at
      ) VALUES (?, ?, ?, 'scheduled', ?, ?, ?, 'pending', NOW())
    `;

    const result = await query(insertQuery, [
      user_id,
      doctor_id,
      type,
      scheduled_at,
      complaint,
      consultationFee
    ]);

    const consultationId = result.insertId;

    // Create chat for the consultation
    const chatQuery = `
      INSERT INTO chats (user_id, doctor_id, title, status, created_at)
      VALUES (?, ?, ?, 'waiting', NOW())
    `;

    const chatResult = await query(chatQuery, [
      user_id,
      doctor_id,
      `Consultation with Dr. ${doctorCheck[0].name}`
    ]);

    const chatId = chatResult.insertId;

    // Update consultation with chat_id
    await query(
      "UPDATE consultations SET chat_id = ? WHERE id = ?",
      [chatId, consultationId]
    );

    // Get the created consultation
    const consultation = await query(
      `SELECT 
        c.id, c.type, c.status, c.scheduled_at, c.consultation_notes,
        c.fee, c.payment_status, c.created_at,
        d.name as doctor_name, d.specialist as doctor_specialist
      FROM consultations c
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE c.id = ?`,
      [consultationId]
    );

    return NextResponse.json({
      success: true,
      message: "Consultation booked successfully",
      data: consultation[0],
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membooking konsultasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 