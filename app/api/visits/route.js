import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { responseCache, queryCache } from "@/lib/cache";
import { apiRateLimiter } from "@/lib/rateLimiter";

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

const normalizePrescriptionList = (value) => {
  if (!value) return [];

  const parseSegment = (segment, overrides = {}) => {
    const raw = (segment || "").trim();
    if (!raw) return null;

    let name = raw;
    let quantity = "";
    let unit = "";

    const parenMatch = raw.match(/\(([^)]+)\)\s*$/);
    if (parenMatch) {
      name = raw.slice(0, parenMatch.index).trim();
      const inner = parenMatch[1].trim();
      const tokens = inner.split(/\s+/).filter(Boolean);

      if (tokens.length >= 2) {
        const qtyIndex = tokens.findIndex(
          (token, idx) => /^\d+(\.\d+)?$/.test(token) && idx < tokens.length - 1
        );
        if (qtyIndex !== -1) {
          quantity = tokens[qtyIndex];
          unit = tokens.slice(qtyIndex + 1).join(" ") || "";
        } else if (/^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
          quantity = tokens[tokens.length - 1];
          unit = tokens.slice(0, tokens.length - 1).join(" ");
        } else {
          unit = tokens.join(" ");
        }
      } else if (tokens.length === 1) {
        if (/^\d+(\.\d+)?$/.test(tokens[0])) {
          quantity = tokens[0];
        } else {
          unit = tokens[0];
        }
      }
  }

    const normalized = {
      name: overrides.name || name || raw,
      quantity: overrides.quantity || quantity,
      unit: overrides.unit || unit,
      raw: overrides.raw || raw,
    };

    return normalized;
  };

  const pushRaw = (list, raw) => {
    if (!raw) return;
    raw
      .split(/;/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const parsed = parseSegment(part);
        if (parsed) list.push(parsed);
      });
  };

  const result = [];

  const handleValue = (input) => {
    if (!input) return;

    if (Array.isArray(input)) {
      input.forEach((item) => {
        if (item && typeof item === "object") {
          const rawString = (item.raw || item.name || "").trim();
          if (rawString && rawString.includes(";")) {
            rawString
              .split(/;/)
              .map((part) => part.trim())
              .filter(Boolean)
              .forEach((part) => {
                const parsed = parseSegment(part, {
                  ...item,
                  raw: part,
                  name: undefined,
                });
                if (parsed) {
                  result.push(parsed);
                }
              });
          } else {
            const parsed = parseSegment(rawString || item.raw || item.name || "", item);
            if (parsed) result.push(parsed);
          }
        } else if (typeof item === "string") {
          pushRaw(result, item);
        }
      });
      return;
    }

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          handleValue(parsed);
          return;
        }
      } catch {
        // ignore JSON parse errors
      }
      pushRaw(result, trimmed);
      return;
    }

    if (typeof input === "object") {
      handleValue(Object.values(input));
    }
  };

  handleValue(value);
  return result;
};

const normalizeDiagnoses = (value) => {
  if (!value) return [];

  const pushRaw = (list, raw) => {
    if (!raw) return;
    const cleaned = raw.replace(/^\(|\)$/g, "");
    cleaned
      .split(/;/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const match = part.match(/^\(?\s*([A-Za-z0-9\.\-]+)\s*-\s*(.+?)\)?$/);
        if (match) {
          list.push({
            icd: match[1].trim(),
            description: match[2].trim(),
            raw: part.replace(/^\(|\)$/g, "").trim(),
          });
        } else {
          list.push({
            icd: "",
            description: part.replace(/^\(|\)$/g, "").trim(),
            raw: part.replace(/^\(|\)$/g, "").trim(),
          });
        }
      });
  };

  const result = [];

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        pushRaw(result, item);
      } else if (typeof item === "object") {
        pushRaw(result, item.raw || item.description || item.icd || "");
      }
    });
    return result;
  }

  if (typeof value === "string") {
    pushRaw(result, value);
    return result;
  }

  if (typeof value === "object") {
    pushRaw(result, Object.values(value).join("; "));
    return result;
  }

  return result;
};

const parsePrescriptionsField = (value) => {
  if (!value) return [];

  // Handle case where value is already array of structured objects
  if (Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null)) {
    return value.map((item) => ({
      name: item.name || item.raw || "",
      quantity: item.quantity || "",
      unit: item.unit || "",
      raw: item.raw || item.name || "",
    }));
  }

  return normalizePrescriptionList(value);
};

// GET all visits from local cache database (fast loading)
export async function GET(request) {
  // Rate limiting
  const rateLimitResult = await apiRateLimiter(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.message },
      { 
        status: rateLimitResult.status,
        headers: rateLimitResult.headers
      }
    );
  }

  // Extract query parameters outside try-catch so they're accessible in fallback
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const searchDate = searchParams.get("searchDate") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const rawLimit = searchParams.get("limit");
  const isFetchAll = (searchParams.get("fetchAll") === "true") || (rawLimit && rawLimit.toLowerCase && rawLimit.toLowerCase() === "all");
  const requestedLimit = parseInt(rawLimit || "10");
  // No limit cap - allow fetching all data; when fetch-all, we'll skip LIMIT/OFFSET
  const limit = requestedLimit;
  const startDate = searchParams.get("tglawal") || "";
  const endDate = searchParams.get("tglakhir") || "";
  const sortBy = searchParams.get("sortBy") || "date"; // date, id, name
  const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc
  
  // Extract filter parameters (outside try-catch for fallback access)
  const status = searchParams.get("status");
  const doctorId = searchParams.get("doctorId");
  const clinic = searchParams.get("clinic");
  const facilityName = searchParams.get("facilityName");
  
  // Check cache only for non-search queries (searches should be fresh)
  const hasSearchOrFilters = !!(search || searchDate || startDate || endDate || status || doctorId || clinic || facilityName);
  const cacheKey = responseCache.generateKey('GET', '/api/visits', {
    page, limit, sortBy, sortOrder, search, searchDate, startDate, endDate, status, doctorId, clinic, facilityName
  });
  
  if (!hasSearchOrFilters) {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      Object.entries(rateLimitResult.headers || {}).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set('X-Cache', 'HIT');
      return response;
    }
  }
  
  try {
    // Build SQL query
    let sql = `SELECT * FROM visits WHERE 1=1`;
    let params = [];
    
    // Apply search filter
    if (search) {
      sql += ` AND (
        patient_name LIKE ? OR 
        patient_nik LIKE ? OR 
        doctor_name LIKE ? OR 
        diagnosis LIKE ? OR
        visit_number LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Apply date search filter
    if (searchDate) {
      sql += ` AND visit_date = ?`;
      params.push(searchDate);
    }
    
    // Apply date range filter
    if (startDate) {
      sql += ` AND visit_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND visit_date <= ?`;
      params.push(endDate);
    }
    
    // Apply status filter
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    // Apply doctor filter (use LIKE for flexible matching)
    if (doctorId) {
      sql += ` AND doctor_name LIKE ?`;
      params.push(`%${doctorId}%`);
    }
    
    // Apply clinic filter (use LIKE for flexible matching)
    if (clinic) {
      sql += ` AND (clinic LIKE ? OR room LIKE ?)`;
      params.push(`%${clinic}%`, `%${clinic}%`);
    }
    
    // Apply facility name filter
    if (facilityName) {
      sql += ` AND facility_name = ?`;
      params.push(facilityName);
    }
    
    // Get total count for pagination (with caching)
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    
    // Create cache key from where clause
    const whereClause = sql.includes('WHERE') ? sql.split('WHERE')[1].split('ORDER BY')[0].trim() : '';
    const cacheKey = queryCache.generateKey('visits', whereClause, params);
    
    // Try cache first
    let totalVisits = queryCache.get(cacheKey);
    
    if (totalVisits === null || totalVisits === undefined) {
      const [countResult] = await query(countSql, params);
      totalVisits = countResult?.total || 0;
      // Cache for 2 minutes (shorter TTL for filtered queries)
      queryCache.set(cacheKey, totalVisits, 2 * 60 * 1000);
    }
    
    // Apply sorting
    if (sortBy === "date") {
      sql += ` ORDER BY visit_date ${sortOrder === "asc" ? "ASC" : "DESC"}, id ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    } else if (sortBy === "id") {
      sql += ` ORDER BY id ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    } else if (sortBy === "name") {
      sql += ` ORDER BY patient_name ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    }
    
    // Apply pagination unless fetch-all requested
    if (!isFetchAll) {
      const offset = Math.floor((page - 1) * limit);
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    }
    
    // Execute query (no params for LIMIT/OFFSET when interpolated)
    const cachedVisits = await query(sql, params);

    // Transform cached data to match expected format
    let visits = cachedVisits.map((visit) => {
      let physicalExam = {};
      try {
        physicalExam = JSON.parse(visit.physical_exam || '{}');
      } catch (e) {
        physicalExam = {
          weight: "0",
          height: "0",
          waistCircumference: "0",
          temperature: "0",
          spO2: "0",
          bloodPressure: { systolic: "0", diastolic: "0" },
          pulse: "0",
          respirationRate: "0",
          eyes: "",
          ears: "",
        };
      }
      
      const prescriptions = parsePrescriptionsField(visit.prescriptions || visit.resep);
      const diagnoses = normalizeDiagnoses(visit.diagnosis);
      return {
        id: visit.visit_number || visit.external_id,
        uniqueId: visit.unique_id || visit.external_id,
        visitNumber: visit.visit_number,
        complaint: visit.complaint || "-",
        diagnosis: visit.diagnosis || "-",
        diagnoses,
        treatment: visit.treatment || "-",
        notes: visit.notes || "-",
        assessment: visit.assessment || "-",
        status: visit.status || "Selesai",
        clinic: visit.clinic || "-",
        room: visit.room || "-",
        visitDate: visit.visit_date || null,
        createdAt: visit.external_created_at || visit.synced_at,
        updatedAt: visit.external_updated_at || visit.updated_at,
        patient: {
          id: visit.patient_nik || "",
          name: visit.patient_name || "-",
          nik: visit.patient_nik || "",
          mrNumber: visit.patient_nik || "",
          nip: visit.patient_nip || "",
          noPeserta: visit.patient_no_peserta || "",
          namaPeserta: visit.patient_nama_peserta || "",
          gender: visit.patient_gender || "",
          birthDate: visit.patient_birth_date || "",
          department: visit.patient_department || "",
        },
        doctor: {
          id: "",
          name: visit.doctor_name || "-",
        },
        facility: {
          code: visit.facility_code || "",
          name: visit.facility_name || "-",
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
        physicalExam,
        prescriptions,
        diagnoses,
        prescriptionCount: prescriptions.length || visit.prescription_count || 0,
        diagnoses,
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
      };
    });

    // Calculate pagination
    const totalPages = isFetchAll ? 1 : Math.ceil(totalVisits / limit);

    const responseData = {
      data: visits,
      pagination: {
        total: totalVisits,
        page: isFetchAll ? 1 : page,
        limit: isFetchAll ? totalVisits : limit,
        totalPages,
        hasNextPage: isFetchAll ? false : page < totalPages,
        hasPrevPage: isFetchAll ? false : page > 1,
      },
    };

    // Cache response only for non-search queries (30 seconds TTL)
    if (!hasSearchOrFilters) {
      responseCache.set(cacheKey, responseData, 30 * 1000);
    }

    const response = NextResponse.json(responseData);
    Object.entries(rateLimitResult.headers || {}).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Cache', hasSearchOrFilters ? 'BYPASS' : 'MISS');
    
    return response;
  } catch (error) {

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

        }
      }

      // Build local query (using updated visits structure with patient_name, doctor_name columns)
      let sql = `
        SELECT 
          id, visit_date, visit_time, status, diagnosis, 
          treatment, notes, complaint, assessment,
          patient_name, patient_nik, doctor_name,
          clinic, room, visit_number,
          facility_name, facility_code,
          prescriptions, prescription_count,
          created_at, updated_at
        FROM visits
        WHERE external_id IS NOT NULL
      `;
      let params = [];
      let conditions = [];

      // Add search filter
      if (search) {
        conditions.push("(patient_name LIKE ? OR doctor_name LIKE ? OR diagnosis LIKE ? OR visit_number LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Add searchDate filter (exact date match)
      if (searchDate) {
        conditions.push("DATE(visit_date) = ?");
        params.push(searchDate);
      }
      
      // Add date range filters
      if (startDate && !searchDate) {
        conditions.push("visit_date >= ?");
        params.push(startDate);
      }
      if (endDate && !searchDate) {
        conditions.push("visit_date <= ?");
        params.push(endDate);
      }

      // Add status filter
      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }

      // Add clinic filter (use LIKE for flexible matching)
      if (clinic) {
        conditions.push("(clinic LIKE ? OR room LIKE ?)");
        params.push(`%${clinic}%`, `%${clinic}%`);
      }

      // Add doctor filter (use LIKE for flexible matching)
      if (doctorId) {
        conditions.push("doctor_name LIKE ?");
        params.push(`%${doctorId}%`);
      }
      
      // Add facility name filter (exact match)
      if (facilityName) {
        conditions.push("facility_name = ?");
        params.push(facilityName);
      }

      if (conditions.length > 0) {
        sql += " AND " + conditions.join(" AND ");
      }

      // Get total count
      const countSql = sql.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
      const countResult = await query(countSql, params);
      const totalVisits = countResult[0]?.total || 0;

      // Add ordering and optional pagination
      sql += " ORDER BY visit_date DESC, id DESC";
      if (!isFetchAll) {
        const safeLimit = limit;
        const offset = (page - 1) * safeLimit;
        sql += " LIMIT ? OFFSET ?";
        params.push(safeLimit, offset);
      }

      const localVisits = await query(sql, params);

      // Transform local visits to match expected format
      const transformedVisits = localVisits.map((visit) => {
        const prescriptions = parsePrescriptionsField(visit.prescriptions);

        return {
          id: visit.visit_number || visit.id,
          uniqueId: visit.visit_number || visit.id,
          visitNumber: visit.visit_number,
          complaint: visit.complaint || visit.diagnosis || "-",
          diagnosis: visit.diagnosis || "-",
          diagnoses: normalizeDiagnoses(visit.diagnosis),
          treatment: visit.treatment || "-",
          notes: visit.notes || "-",
          assessment: visit.assessment || "-",
          status: visit.status || "Selesai",
          clinic: visit.clinic || "-",
          room: visit.room || "-",
          visitDate: visit.visit_date || null,
          createdAt: visit.created_at,
          updatedAt: visit.updated_at,
          patient: {
            id: "",
            name: visit.patient_name || "-",
            nik: visit.patient_nik || "",
            mrNumber: visit.patient_nik || "",
            nip: "",
            noPeserta: "",
            namaPeserta: "",
            gender: "",
            birthDate: "",
            department: "",
          },
          doctor: {
            id: "",
            name: visit.doctor_name || "-",
          },
          facility: {
            code: visit.facility_code || "",
            name: visit.facility_name || "-",
          },
          physicalExam: {},
          referral: {
            source: { type: "", referrer: "" },
            destination: { notes: "" },
          },
          sickLeave: { status: false, days: null, startDate: null, endDate: null },
          healthCertificate: false,
          cancellation: { userId: null, date: null, reason: null },
          examinations: [],
          prescriptions,
          prescriptionCount: prescriptions.length || visit.prescription_count || 0,
        };
      });

      const totalPages = isFetchAll ? 1 : Math.ceil(totalVisits / (limit || 1));

      return NextResponse.json({
        data: transformedVisits,
        pagination: {
          page: isFetchAll ? 1 : page,
          limit: isFetchAll ? totalVisits : limit,
          total: totalVisits,
          totalPages,
          hasNextPage: isFetchAll ? false : page < totalPages,
          hasPrevPage: isFetchAll ? false : page > 1,
        },
      });
    } catch (dbError) {

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

    return NextResponse.json(
      { message: "Gagal menambahkan kunjungan" },
      { status: 500 }
    );
  }
}
