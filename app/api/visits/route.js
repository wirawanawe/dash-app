import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 30000, // 30 second timeout
      });
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error; // Throw on last attempt
      }
      // Wait before retrying (exponential backoff)
      await delay(Math.pow(2, i) * 1000);
    }
  }
}

// GET all visits from external API
export async function GET(request) {
  try {
    // Get user information from token to check role and clinic_id
    const token = request.cookies.get("token");
    let userPayload = null;
    
    if (token) {
      try {
        const { verifyJwtToken } = await import("@/lib/auth");
        userPayload = await verifyJwtToken(token.value);
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const searchDate = searchParams.get("searchDate") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("tglawal") || "";
    const endDate = searchParams.get("tglakhir") || "";
    const sortBy = searchParams.get("sortBy") || "date"; // date, id, name
    const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc

    // Build API URL with pagination
    let apiUrl = `http://api-klinik.doctorphc.id/transaksi/kunjungan?page=${page}&limit=${limit}`;

    // Add keyword parameter if search is provided
    if (search) {
      apiUrl += `&keyword=${encodeURIComponent(search)}`;
    }

    // Add date search parameter if provided
    if (searchDate) {
      apiUrl += `&search_date=${encodeURIComponent(searchDate)}`;
    }

    // Add date filters if provided
    if (startDate) {
      apiUrl += `&tglawal=${encodeURIComponent(startDate)}`;
    }
    if (endDate) {
      apiUrl += `&tglakhir=${encodeURIComponent(endDate)}`;
    }

    // Add clinic_id filter if user is not superadmin and has clinic_id
    if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
      apiUrl += `&clinic_id=${encodeURIComponent(userPayload.clinic_id)}`;
    }

    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add any required headers here (e.g., Authorization if needed)
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from external API: ${response.status} ${response.statusText}`
      );
    }

    const externalData = await response.json();

    // Process the external data - the API returns data in a specific format
    let rawVisits = [];
    if (externalData.data && Array.isArray(externalData.data)) {
      rawVisits = externalData.data;
    } else if (Array.isArray(externalData)) {
      rawVisits = externalData;
    }

    // Transform the external API data to match our expected format
    let visits = rawVisits.map((visit) => ({
      id: visit.id || visit.ID,
      visitDate: visit.visitDate || visit.TANGGAL_KUNJUNGAN,
      patientName: visit.patientName || visit.NAMA_PASIEN,
      patientId: visit.patientId || visit.ID_PASIEN,
      doctorName: visit.doctorName || visit.NAMA_DOKTER,
      doctorId: visit.doctorId || visit.ID_DOKTER,
      clinicName: visit.clinicName || visit.NAMA_KLINIK,
      clinicId: visit.clinicId || visit.ID_KLINIK,
      status: visit.status || visit.STATUS,
      complaint: visit.complaint || visit.KELUHAN,
      diagnosis: visit.diagnosis || visit.DIAGNOSIS,
      treatment: visit.treatment || visit.PENGOBATAN,
      notes: visit.notes || visit.CATATAN,
      room: visit.room || visit.RUANGAN,
      cost: visit.cost || visit.BIAYA,
      paymentStatus: visit.paymentStatus || visit.STATUS_PEMBAYARAN,
      created_at: visit.created_at || visit.CREATED_AT,
      updated_at: visit.updated_at || visit.UPDATED_AT,
    }));

    // Apply additional client-side filtering based on user role and clinic_id
    if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
      visits = visits.filter(visit => 
        visit.clinicId == userPayload.clinic_id
      );
    }

    // Apply date filtering
    if (startDate || endDate) {
      visits = visits.filter((visit) => {
        const visitDateStr = visit.visitDate;
        if (!visitDateStr) return false;

        const visitDate = new Date(visitDateStr);
        if (isNaN(visitDate.getTime())) return false;

        let matchesStart = true;
        let matchesEnd = true;

        if (startDate) {
          const startDateObj = new Date(startDate);
          if (!isNaN(startDateObj.getTime())) {
            matchesStart = visitDate >= startDateObj;
          }
        }

        if (endDate) {
          const endDateObj = new Date(endDate);
          if (!isNaN(endDateObj.getTime())) {
            // Add one day to end date to include the entire end date
            const endDatePlusOne = new Date(endDateObj);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            matchesEnd = visitDate < endDatePlusOne;
          }
        }

        return matchesStart && matchesEnd;
      });
    }

    // Apply client-side status filtering
    const status = searchParams.get("status");
    if (status) {
      visits = visits.filter((visit) => {
        return visit.status === status;
      });
    }

    // Apply client-side doctor filtering
    const doctorId = searchParams.get("doctorId");
    if (doctorId) {
      visits = visits.filter((visit) => {
        return visit.doctorId === doctorId;
      });
    }

    // Sort visits (default: newest first - tanggal terbaru di atas)
    visits.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        const dateA = new Date(a.visitDate || 0);
        const dateB = new Date(b.visitDate || 0);
        comparison = dateA - dateB;
      } else if (sortBy === "id") {
        comparison = (a.id || 0) - (b.id || 0);
      } else if (sortBy === "name") {
        comparison = (a.patientName || "").localeCompare(b.patientName || "");
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Calculate pagination
    const totalVisits = visits.length;
    const totalPages = Math.ceil(totalVisits / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVisits = visits.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedVisits,
      pagination: {
        page,
        limit,
        total: totalVisits,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    
    // Fallback to local database if external API fails
    try {
      const { query } = await import("@/lib/db");
      
      // Get user information from token to check role and clinic_id
      const token = request.cookies.get("token");
      let userPayload = null;
      
      if (token) {
        try {
          const { verifyJwtToken } = await import("@/lib/auth");
          userPayload = await verifyJwtToken(token.value);
        } catch (error) {
          console.error("Error verifying token:", error);
        }
      }

      // Build local query with clinic filtering
      let sql = `
        SELECT 
          v.id, v.visit_date, v.visit_time, v.status, v.complaint, 
          v.treatment, v.notes, v.room, v.cost, v.payment_status,
          v.created_at, v.updated_at,
          p.name as patient_name, p.id as patient_id,
          d.name as doctor_name, d.id as doctor_id,
          c.name as clinic_name, c.id as clinic_id
        FROM visits v
        LEFT JOIN patients p ON v.patient_id = p.id
        LEFT JOIN doctors d ON v.doctor_id = d.id
        LEFT JOIN clinics c ON v.clinic_id = c.id
        WHERE 1=1
      `;
      let params = [];
      let conditions = [];

      // Add clinic filter if user is not superadmin and has clinic_id
      if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
        conditions.push("v.clinic_id = ?");
        params.push(userPayload.clinic_id);
      }

      // Add search filter
      if (search) {
        conditions.push("(p.name LIKE ? OR d.name LIKE ? OR v.complaint LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Add date filters
      if (startDate) {
        conditions.push("v.visit_date >= ?");
        params.push(startDate);
      }
      if (endDate) {
        conditions.push("v.visit_date <= ?");
        params.push(endDate);
      }

      // Add status filter
      const status = searchParams.get("status");
      if (status) {
        conditions.push("v.status = ?");
        params.push(status);
      }

      if (conditions.length > 0) {
        sql += " AND " + conditions.join(" AND ");
      }

      // Get total count
      const countSql = sql.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
      const countResult = await query(countSql, params);
      const totalVisits = countResult[0]?.total || 0;

      // Add ordering and pagination
      sql += " ORDER BY v.visit_date DESC, v.visit_time DESC LIMIT ? OFFSET ?";
      params.push(limit, (page - 1) * limit);

      const localVisits = await query(sql, params);

      // Transform local visits to match expected format
      const transformedVisits = localVisits.map(visit => ({
        id: visit.id,
        visitDate: visit.visit_date,
        patientName: visit.patient_name,
        patientId: visit.patient_id,
        doctorName: visit.doctor_name,
        doctorId: visit.doctor_id,
        clinicName: visit.clinic_name,
        clinicId: visit.clinic_id,
        status: visit.status,
        complaint: visit.complaint,
        diagnosis: null, // Not available in local schema
        treatment: visit.treatment,
        notes: visit.notes,
        room: visit.room,
        cost: visit.cost,
        paymentStatus: visit.payment_status,
        created_at: visit.created_at,
        updated_at: visit.updated_at,
      }));

      const totalPages = Math.ceil(totalVisits / limit);

      return NextResponse.json({
        data: transformedVisits,
        pagination: {
          page,
          limit,
          total: totalVisits,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (dbError) {
      console.error("Local database error:", dbError);
      return NextResponse.json(
        { 
          success: false,
          message: "Gagal mengambil data kunjungan",
          error: error.message 
        },
        { status: 500 }
      );
    }
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
