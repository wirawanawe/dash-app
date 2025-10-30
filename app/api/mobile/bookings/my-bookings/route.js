import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/mobile/bookings/my-bookings - get user's own bookings
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

    // Handle string user IDs (like "user-001") by converting to integer
    let numericUserId;
    if (user_id.startsWith("user-")) {
      // Extract numeric part from "user-001" -> 1
      const numericPart = user_id.replace("user-", "");
      numericUserId = parseInt(numericPart);
      if (isNaN(numericUserId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user ID format",
          },
          { status: 400 }
        );
      }
    } else {
      // If it's already a number, use it directly
      numericUserId = parseInt(user_id);
      if (isNaN(numericUserId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user ID format",
          },
          { status: 400 }
        );
      }
    }

    // Build query with optional status filter
    let whereClause = "WHERE b.user_id = ?";
    let params = [numericUserId];

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

    // Get user's bookings with clinic and doctor information
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
        c.rating as clinic_rating,
        d.name as doctor_name,
        d.specialist as doctor_specialization,
        d.phone as doctor_phone,
        s.name as service_name,
        s.description as service_description
      FROM bookings b
      LEFT JOIN clinics c ON b.clinic_id = c.id
      LEFT JOIN doctors d ON b.doctor_id = d.id
      LEFT JOIN services s ON b.service_id = s.id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const bookings = await query(bookingsQuery, params);

    // Group bookings by status for better mobile UI
    const groupedBookings = {
      upcoming: [],
      completed: [],
      cancelled: [],
      pending: []
    };

    bookings.forEach(booking => {
      if (booking.status === 'confirmed' && new Date(booking.booking_date) >= new Date()) {
        groupedBookings.upcoming.push(booking);
      } else if (booking.status === 'completed') {
        groupedBookings.completed.push(booking);
      } else if (booking.status === 'cancelled') {
        groupedBookings.cancelled.push(booking);
      } else if (booking.status === 'pending') {
        groupedBookings.pending.push(booking);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings,
        grouped: groupedBookings,
        summary: {
          total: totalResults,
          upcoming: groupedBookings.upcoming.length,
          completed: groupedBookings.completed.length,
          cancelled: groupedBookings.cancelled.length,
          pending: groupedBookings.pending.length
        }
      },
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
        message: "Gagal mengambil data booking pengguna",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/mobile/bookings/my-bookings - not supported (use /api/mobile/bookings for creating)
export async function POST(request) {
  return NextResponse.json(
    {
      success: false,
      message: "Use /api/mobile/bookings to create new bookings",
    },
    { status: 405 }
  );
} 