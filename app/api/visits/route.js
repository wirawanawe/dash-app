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
  // Extract query parameters outside try-catch so they're accessible in fallback
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const searchDate = searchParams.get("searchDate") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const startDate = searchParams.get("tglawal") || "";
  const endDate = searchParams.get("tglakhir") || "";
  const sortBy = searchParams.get("sortBy") || "date"; // date, id, name
  const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc
  
  try {
    // Extract filter parameters
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");
    const clinic = searchParams.get("clinic");
    
    // Determine if we need to fetch all data for client-side filtering
    // This is needed when we have date filters, status filter, doctor filter, or clinic filter
    const needsClientSideFiltering = searchDate || startDate || endDate || status || doctorId || clinic;
    
    // STRATEGY: Fetch newest data first (external API returns oldest first)
    // 1. First, get total count from API
    // 2. Calculate which pages to fetch from the END to get newest data
    // 3. Fetch multiple pages from the end and combine
    
    // Step 1: Get total count
    const countResponse = await fetchWithRetry(
      `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    
    if (!countResponse.ok) {
      throw new Error(`Failed to fetch count: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const externalTotal = countData["total pasien"] || countData.total || 0;
    
    console.log(`[Visits API] Total in external DB: ${externalTotal}`);
    
    // Step 2: Calculate pages to fetch from the end
    // We want to fetch up to 10000 newest records
    const desiredRecords = 10000;
    const recordsPerPage = 1000; // Fetch 1000 per page for efficiency
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);
    
    console.log(`[Visits API] Fetching ${pagesToFetch} pages from page ${startPage} to ${totalPagesInExternal}`);
    
    // Step 3: Fetch multiple pages from the end in parallel
    const pageFetchPromises = [];
    for (let pageNum = startPage; pageNum <= totalPagesInExternal; pageNum++) {
      let apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${pageNum}&limit=${recordsPerPage}`;
      
      // Add keyword parameter if search is provided
      if (search) {
        apiUrl += `&keyword=${encodeURIComponent(search)}`;
      }
      
      pageFetchPromises.push(
        fetchWithRetry(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).then(res => res.json())
      );
    }
    
    // Wait for all pages to be fetched
    const pageResults = await Promise.all(pageFetchPromises);
    
    // Combine all pages and reverse to get newest first
    let rawVisits = [];
    pageResults.forEach(pageData => {
      if (pageData.data && Array.isArray(pageData.data)) {
        rawVisits = rawVisits.concat(pageData.data);
      }
    });
    
    // Reverse to get newest first (external API returns oldest first)
    rawVisits.reverse();
    
    console.log(`[Visits API] Fetched ${rawVisits.length} visits (newest first) from external API (Total in DB: ${externalTotal})`);
    if (needsClientSideFiltering) {
      console.log(`[Visits API] Client-side filtering active - Filters:`, {
        searchDate,
        startDate,
        endDate,
        status,
        doctorId,
        clinic
      });
    }

    // Transform the external API data to match our expected format
    let visits = rawVisits.map((visit) => ({
      id: visit.No_Kunjungan || visit.ID,
      uniqueId: visit.ID,
      visitNumber: visit.No_Kunjungan,
      complaint: visit.Diagnosa || "-",
      diagnosis: visit.Diagnosa || "-",
      treatment: "-",
      notes: "-",
      assessment: "-",
      status: "Selesai", // Default status since we don't have completion info
      clinic: visit.Klinik || "-",
      room: visit.Klinik || "-",
      visitDate: visit.Tgl_Kunjungan || null,
      createdAt: visit.audittrail?.created_at || null,
      updatedAt: visit.audittrail?.updated_at || null,
      patient: {
        id: visit.Pasien?.[0]?.NIK || "",
        name: visit.Pasien?.[0]?.Nama_Pasien || "-",
        nik: visit.Pasien?.[0]?.NIK || "",
        mrNumber: visit.Pasien?.[0]?.NIK || "",
        nip: visit.Pasien?.[0]?.NIP || "",
        noPeserta: visit.Pasien?.[0]?.No_Peserta || "",
        namaPeserta: visit.Pasien?.[0]?.Nama_Peserta || "",
        gender: visit.Pasien?.[0]?.Jenis_Kelamin || "",
        birthDate: visit.Pasien?.[0]?.Tgl_Lahir || "",
        department: visit.Pasien?.[0]?.Bagian || "",
      },
      doctor: {
        id: "",
        name: visit.Dokter || "-",
      },
      facility: {
        code: visit.Fasilitas_Kesehatan?.[0]?.Kode || "",
        name: visit.Fasilitas_Kesehatan?.[0]?.Nama_Faskes || "-",
      },
      // Keep compatibility with old structure
      insurance: {
        id: "",
        name: "-",
      },
      company: {
        id: "",
        name: "-",
      },
      physicalExam: {
        weight: "0",
        height: "0",
        waistCircumference: "0",
        temperature: "0",
        spO2: "0",
        bloodPressure: {
          systolic: "0",
          diastolic: "0",
        },
        pulse: "0",
        respirationRate: "0",
        eyes: "",
        ears: "",
      },
      referral: {
        source: {
          type: "",
          referrer: "",
        },
        destination: {
          notes: "",
        },
      },
      sickLeave: {
        status: false,
        days: null,
        startDate: null,
        endDate: null,
      },
      healthCertificate: false,
      cancellation: {
        userId: null,
        date: null,
        reason: null,
      },
      examinations: [], // Keep for compatibility
    }));

    // Helper function to normalize date (remove time component)
    const normalizeDate = (dateString) => {
      if (!dateString) return null;
      
      // Parse date string (handle both YYYY-MM-DD and YYYY-MM-DD HH:MM:SS formats)
      let dateStr = dateString;
      if (dateStr.includes(' ')) {
        dateStr = dateStr.split(' ')[0]; // Take only date part
      }
      
      // Validate date format YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(dateStr)) {
        return dateStr;
      }
      
      // Fallback: try to parse and format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Apply client-side date search filtering
    if (searchDate) {
      const searchDateNormalized = normalizeDate(searchDate);
      
      visits = visits.filter((visit) => {
        const visitDateNormalized = normalizeDate(visit.visitDate);
        
        // Check if visitDate matches the searchDate
        if (visitDateNormalized && visitDateNormalized !== "1900-01-01") {
          return visitDateNormalized === searchDateNormalized;
        }

        // If no valid visitDate, check createdAt
        const createdDateNormalized = normalizeDate(visit.createdAt);
        if (createdDateNormalized) {
          return createdDateNormalized === searchDateNormalized;
        }

        return false;
      });
    }

    // Apply client-side date range filtering
    if (startDate || endDate) {
      const startDateNormalized = startDate ? normalizeDate(startDate) : null;
      const endDateNormalized = endDate ? normalizeDate(endDate) : null;
      
      visits = visits.filter((visit) => {
        // Get the visit date (prefer visitDate, fallback to createdAt)
        let dateToCompare = normalizeDate(visit.visitDate);
        
        // If visitDate is invalid or default, use createdAt
        if (!dateToCompare || dateToCompare === "1900-01-01") {
          dateToCompare = normalizeDate(visit.createdAt);
        }
        
        // If no valid date found, include the visit
        if (!dateToCompare) return true;

        let matchesStart = true;
        let matchesEnd = true;

        // Check start date
        if (startDateNormalized) {
          matchesStart = dateToCompare >= startDateNormalized;
        }

        // Check end date
        if (endDateNormalized) {
          matchesEnd = dateToCompare <= endDateNormalized;
        }

        return matchesStart && matchesEnd;
      });
    }

    // Apply client-side status filtering
    if (status) {
      visits = visits.filter((visit) => {
        return visit.status === status;
      });
    }

    // Apply client-side doctor filtering
    if (doctorId) {
      visits = visits.filter((visit) => {
        return visit.doctorId === doctorId;
      });
    }

    // Apply client-side clinic filtering
    if (clinic) {
      visits = visits.filter((visit) => {
        return visit.clinic === clinic || visit.room === clinic;
      });
    }

    // Sort visits (default: newest first - tanggal terbaru di atas)
    console.log(`[Visits API] Sorting by: ${sortBy}, order: ${sortOrder}`);
    
    visits.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        // Function to get the best date from visit object
        const getBestDate = (visit) => {
          // Priority: visitDate (if valid) > createdAt > fallback to old date
          
          // Try visitDate first
          if (visit.visitDate) {
            const dateStr = String(visit.visitDate);
            // Check if not default/invalid date
            if (!dateStr.startsWith('1900-01-01') && dateStr !== '0000-00-00') {
              const visitDate = new Date(visit.visitDate);
              if (!isNaN(visitDate.getTime()) && visitDate.getFullYear() > 1900) {
                return visitDate;
              }
            }
          }

          // Fallback to createdAt
          if (visit.createdAt) {
            const createdDate = new Date(visit.createdAt);
            if (!isNaN(createdDate.getTime()) && createdDate.getFullYear() > 1900) {
              return createdDate;
            }
          }

          // Fallback to very old date (will be sorted to bottom)
          return new Date('1900-01-01');
        };

        const aDate = getBestDate(a);
        const bDate = getBestDate(b);
        comparison = bDate.getTime() - aDate.getTime(); // Descending: newest first

        // If dates are the same, use ID as secondary sort (higher ID = newer)
        if (comparison === 0) {
          const aId = parseInt(a.id) || 0;
          const bId = parseInt(b.id) || 0;
          comparison = bId - aId; // Descending by ID
        }
      } else if (sortBy === "id") {
        comparison = (a.id || 0) - (b.id || 0);
      } else if (sortBy === "name") {
        comparison = (a.patientName || "").localeCompare(b.patientName || "");
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Log first few visits after sorting to verify order
    if (visits.length > 0) {
      console.log(`[Visits API] After sorting (first 3):`, 
        visits.slice(0, 3).map(v => ({
          id: v.id,
          visitDate: v.visitDate,
          createdAt: v.createdAt,
          patient: v.patient?.name
        }))
      );
    }

    // Calculate pagination AFTER all filtering
    // If there's any filtering, use filtered length; otherwise use external total
    const actualTotal = needsClientSideFiltering ? visits.length : externalTotal;
    const totalPages = Math.ceil(actualTotal / limit);
    
    if (needsClientSideFiltering) {
      console.log(`[Visits API] After filtering: ${actualTotal} visits match the criteria (from ${externalTotal} total)`);
    } else {
      console.log(`[Visits API] No filtering applied: returning ${actualTotal} total visits from external API`);
    }
    
    // Apply pagination to filtered results
    let paginatedVisits = visits;
    if (needsClientSideFiltering) {
      // If we fetched all data for client-side filtering, now paginate the results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedVisits = visits.slice(startIndex, endIndex);
      console.log(`[Visits API] Returning page ${page} with ${paginatedVisits.length} visits (total: ${actualTotal}, pages: ${totalPages})`);
    }

    return NextResponse.json({
      data: paginatedVisits,
      pagination: {
        total: actualTotal,
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
