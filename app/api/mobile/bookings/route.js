import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/mobile/bookings - get all bookings for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Build query with optional status filter
    let whereClause = "WHERE b.user_id = ?";
    let params = [user_id];

    if (status) {
      whereClause += " AND b.status = ?";
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM bookings b
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const totalResults = parseInt(countResult[0].total);

    // Get bookings with clinic and doctor information
    const bookingsQuery = `
      SELECT 
        b.id,
        b.user_id,
        b.clinic_id,
        b.service_id,
        b.doctor_id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.notes,
        b.created_at,
        b.updated_at,
        c.name as clinic_name,
        c.address as clinic_address,
        c.city as clinic_city,
        c.phone as clinic_phone,
        d.name as doctor_name,
        d.specialist as doctor_specialization,
        s.name as service_name
      FROM bookings b
      LEFT JOIN clinics c ON b.clinic_id = c.id
      LEFT JOIN doctors d ON b.doctor_id = d.id
      LEFT JOIN services s ON b.service_id = s.id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const bookings = await query(bookingsQuery, params);

    return NextResponse.json({
      success: true,
      data: bookings,
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
        message: "Gagal mengambil data booking",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/mobile/bookings - create new booking
export async function POST(request) {
  try {
    const {
      user_id,
      clinic_id,
      service_id,
      doctor_id,
      booking_date,
      booking_time,
      notes
    } = await request.json();

    if (!user_id || !clinic_id || !booking_date) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, clinic ID, dan tanggal booking wajib diisi",
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO bookings (
        user_id, clinic_id, service_id, doctor_id, 
        booking_date, booking_time, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const result = await query(sql, [
      user_id,
      clinic_id,
      service_id || null,
      doctor_id || null,
      booking_date,
      booking_time || null,
      notes || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Booking berhasil dibuat",
      data: { id: result.insertId },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat booking",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 