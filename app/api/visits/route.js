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
      id: visit.No_Kunjungan,
      complaint: visit.Rekam_Medis?.[0]?.Subject || "-",
      treatment: visit.Rekam_Medis?.[0]?.Planning || "-",
      notes: visit.Rekam_Medis?.[0]?.Object || "-",
      assessment: visit.Rekam_Medis?.[0]?.Assesment || "-",
      status: visit.Keluar?.[0]?.Status ? "Selesai" : "Aktif",
      room: visit.Unit_Rawat?.[0]?.Nama_Unit || "-",
      visitDate: visit.Tgl_Kunjungan || null,
      createdAt: visit.audittrail?.CreatedDate || null,
      updatedAt: visit.audittrail?.LastModifiedDate || null,
      patient: {
        id: visit.Pasien?.[0]?.No_MR || "",
        name: visit.Pasien?.[0]?.Nama_Pasien || "-",
        mrNumber: visit.Pasien?.[0]?.No_MR || "",
        nip: visit.Pasien?.[0]?.NIP || "",
        employeeName: visit.Pasien?.[0]?.Nama_Karyawan || "",
      },
      doctor: {
        id: visit.Dokter?.[0]?.id || "",
        name: visit.Dokter?.[0]?.Nama_Dokter || "-",
      },
      insurance: {
        id: visit.Penjamin?.[0]?.id || "",
        name: visit.Penjamin?.[0]?.Nama_Penjamin || "-",
      },
      company: {
        id: visit.Perusahaan?.[0]?.id || "",
        name: visit.Perusahaan?.[0]?.Nama_Perusahaan || "-",
      },
      physicalExam: {
        weight: visit.Pemeriksaan_Fisik?.[0]?.Berat_Badan || "0",
        height: visit.Pemeriksaan_Fisik?.[0]?.Tinggi_Badan || "0",
        waistCircumference:
          visit.Pemeriksaan_Fisik?.[0]?.Lingkar_Pinggang || "0",
        temperature: visit.Pemeriksaan_Fisik?.[0]?.Suhu || "0",
        spO2: visit.Pemeriksaan_Fisik?.[0]?.SpO2 || "0",
        bloodPressure: {
          systolic:
            visit.Pemeriksaan_Fisik?.[0]?.Tekanan_Darah?.[0]?.Sistolik || "0",
          diastolic:
            visit.Pemeriksaan_Fisik?.[0]?.Tekanan_Darah?.[0]?.Diastolik || "0",
        },
        pulse: visit.Pemeriksaan_Fisik?.[0]?.Nadi || "0",
        respirationRate: visit.Pemeriksaan_Fisik?.[0]?.Respiration_Rate || "0",
        eyes: visit.Pemeriksaan_Fisik?.[0]?.Mata || "",
        ears: visit.Pemeriksaan_Fisik?.[0]?.Telinga || "",
      },
      referral: {
        source: {
          type: visit.Rujukan_Asal?.[0]?.Jenis || "",
          referrer: visit.Rujukan_Asal?.[0]?.Nama_Perujuk || "",
        },
        destination: {
          notes: visit.Rujukan_Tujuan?.[0]?.Catatan || "",
        },
      },
      sickLeave: {
        status: visit.Surat_Sakit?.[0]?.Status || false,
        days: visit.Surat_Sakit?.[0]?.Jml_Hari || null,
        startDate: visit.Surat_Sakit?.[0]?.Tgl_Awal || null,
        endDate: visit.Surat_Sakit?.[0]?.Tgl_Akhir || null,
      },
      healthCertificate: visit.Surat_Sehat || false,
      cancellation: {
        userId: visit.Batal_Kunjungan?.[0]?.User_ID || null,
        date: visit.Batal_Kunjungan?.[0]?.Tanggal || null,
        reason: visit.Batal_Kunjungan?.[0]?.Alasan || null,
      },
      examinations: [], // Keep for compatibility
    }));

    // Apply client-side date search filtering
    if (searchDate) {
      visits = visits.filter((visit) => {
        const visitDateStr = visit.visitDate;
        const searchDateObj = new Date(searchDate);

        // Check if visitDate matches the searchDate
        if (visitDateStr && visitDateStr !== "1900-01-01 00:00:00") {
          const visitDate = new Date(visitDateStr);
          if (!isNaN(visitDate.getTime()) && !isNaN(searchDateObj.getTime())) {
            // Compare dates (ignore time)
            const visitDateOnly = new Date(
              visitDate.getFullYear(),
              visitDate.getMonth(),
              visitDate.getDate()
            );
            const searchDateOnly = new Date(
              searchDateObj.getFullYear(),
              searchDateObj.getMonth(),
              searchDateObj.getDate()
            );
            return visitDateOnly.getTime() === searchDateOnly.getTime();
          }
        }

        // If no valid visitDate, check createdAt
        if (visit.createdAt) {
          const createdDate = new Date(visit.createdAt);
          if (
            !isNaN(createdDate.getTime()) &&
            !isNaN(searchDateObj.getTime())
          ) {
            const createdDateOnly = new Date(
              createdDate.getFullYear(),
              createdDate.getMonth(),
              createdDate.getDate()
            );
            const searchDateOnly = new Date(
              searchDateObj.getFullYear(),
              searchDateObj.getMonth(),
              searchDateObj.getDate()
            );
            return createdDateOnly.getTime() === searchDateOnly.getTime();
          }
        }

        return false;
      });
    }

    // Apply client-side date filtering if the external API doesn't support it
    if (startDate || endDate) {
      visits = visits.filter((visit) => {
        const visitDateStr = visit.visitDate;

        // Skip empty, null, or default dates
        if (!visitDateStr || visitDateStr === "1900-01-01 00:00:00") {
          // If no specific date is available, use createdAt for filtering
          if (visit.createdAt) {
            const createdDate = new Date(visit.createdAt);
            const startDateObj = startDate ? new Date(startDate) : null;
            const endDateObj = endDate ? new Date(endDate) : null;

            if (isNaN(createdDate.getTime())) return true;

            let matchesStart = true;
            let matchesEnd = true;

            if (startDateObj && !isNaN(startDateObj.getTime())) {
              matchesStart = createdDate >= startDateObj;
            }

            if (endDateObj && !isNaN(endDateObj.getTime())) {
              const endDatePlusOne = new Date(endDateObj);
              endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
              matchesEnd = createdDate < endDatePlusOne;
            }

            return matchesStart && matchesEnd;
          }
          return true; // Include if no date information available
        }

        const visitDate = new Date(visitDateStr);
        const startDateObj = startDate ? new Date(startDate) : null;
        const endDateObj = endDate ? new Date(endDate) : null;

        // Skip invalid dates
        if (isNaN(visitDate.getTime())) return true;

        let matchesStart = true;
        let matchesEnd = true;

        if (startDateObj && !isNaN(startDateObj.getTime())) {
          matchesStart = visitDate >= startDateObj;
        }

        if (endDateObj && !isNaN(endDateObj.getTime())) {
          // Add one day to end date to include the entire end date
          const endDatePlusOne = new Date(endDateObj);
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
          matchesEnd = visitDate < endDatePlusOne;
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
        return visit.doctor.id === doctorId;
      });
    }

    // Sort visits (default: newest first - tanggal terbaru di atas)
    visits.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        // Function to get the best date from visit object
        const getBestDate = (visit) => {
          // Priority: visitDate (if valid) > createdAt > id (as fallback)
          if (visit.visitDate && visit.visitDate !== "1900-01-01 00:00:00") {
            const visitDate = new Date(visit.visitDate);
            if (!isNaN(visitDate.getTime())) {
              return visitDate;
            }
          }

          if (visit.createdAt) {
            const createdDate = new Date(visit.createdAt);
            if (!isNaN(createdDate.getTime())) {
              return createdDate;
            }
          }

          // Fallback to epoch time if no valid dates
          return new Date(0);
        };

        const aDate = getBestDate(a);
        const bDate = getBestDate(b);
        comparison = bDate.getTime() - aDate.getTime(); // Default descending

        // If dates are the same, use ID as secondary sort (higher ID = newer)
        if (comparison === 0) {
          const aId = parseInt(a.id) || 0;
          const bId = parseInt(b.id) || 0;
          comparison = bId - aId; // Descending by ID
        }
      } else if (sortBy === "id") {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        comparison = bId - aId; // Default descending
      } else if (sortBy === "name") {
        const aName = a.patient?.name || "";
        const bName = b.patient?.name || "";
        comparison = aName.localeCompare(bName); // Default ascending for names
      }

      // Apply sort order (desc is default for date and id, asc for names)
      if (sortOrder === "asc" && (sortBy === "date" || sortBy === "id")) {
        comparison = -comparison;
      } else if (sortOrder === "desc" && sortBy === "name") {
        comparison = -comparison;
      }

      return comparison;
    });

    // Use the pagination info from the external API
    const totalFromAPI =
      externalData["total pasien"] || externalData.total || visits.length;
    const totalPages = Math.ceil(totalFromAPI / limit);

    return NextResponse.json({
      data: visits,
      pagination: {
        total: totalFromAPI,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching visits from external API:", error);

    // Fallback to local database if external API fails
    try {
      // Build WHERE clause for date filtering and search
      let whereClause = "";
      let queryParams = [];
      const conditions = [];

      // Add date search condition
      if (searchDate) {
        conditions.push("DATE(v.created_at) = ?");
        queryParams.push(searchDate);
      }

      // Add date range filter conditions
      if (startDate) {
        conditions.push("DATE(v.created_at) >= ?");
        queryParams.push(startDate);
      }
      if (endDate) {
        conditions.push("DATE(v.created_at) <= ?");
        queryParams.push(endDate);
      }

      if (conditions.length > 0) {
        whereClause = "WHERE " + conditions.join(" AND ");
      }

      const visits = await query(
        `
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
        ${whereClause}
        ORDER BY v.created_at DESC, v.id DESC
      `,
        queryParams
      );

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

      return NextResponse.json({
        data: formattedVisits,
        pagination: {
          total: formattedVisits.length,
          page: 1,
          limit: formattedVisits.length,
          totalPages: 1,
        },
      });
    } catch (fallbackError) {
      console.error("Fallback to local database also failed:", fallbackError);
      return NextResponse.json(
        {
          message:
            "Failed to fetch visits from external API and local database",
          error: error.message,
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
