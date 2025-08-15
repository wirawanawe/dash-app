import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry - reduced timeout and better error handling
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15 seconds
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        throw error; // Throw on last attempt
      }
      // Wait before retrying (shorter backoff)
      await delay(1000 * (i + 1));
    }
  }
}

// GET all patients from external API
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build API URL with keyword parameter for server-side filtering
    let apiUrl = `http://api-klinik.doctorphc.id/pasien?page=${page}&limit=${limit}`;

    // Add keyword parameter if search is provided
    if (search) {
      apiUrl += `&keyword=${encodeURIComponent(search)}`;
    }

    // Add clinic_id filter if user is not superadmin and has clinic_id
    if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
      apiUrl += `&clinic_id=${encodeURIComponent(userPayload.clinic_id)}`;
    }

    console.log(`🔍 Fetching patients from external API: ${apiUrl}`);

    try {
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
      let rawPatients = [];
      if (externalData.data && Array.isArray(externalData.data)) {
        rawPatients = externalData.data;
      } else if (Array.isArray(externalData)) {
        rawPatients = externalData;
      }

      // Transform the external API data to match our expected format
      let patients = rawPatients.map((patient) => ({
        id: patient.id || patient.ID,
        mrn: patient.mrn || patient.MRN || patient.mr_number,
        name: patient.name || patient.NAMA,
        nik: patient.nik || patient.NIK,
        birthDate: patient.birthDate || patient.TANGGAL_LAHIR,
        gender: patient.gender || patient.JENIS_KELAMIN,
        nip: patient.nip || patient.NIP,
        status: patient.status || patient.STATUS,
        address: patient.address || patient.ALAMAT,
        phone: patient.phone || patient.TELEPON,
        email: patient.email || patient.EMAIL,
        bloodType: patient.bloodType || patient.GOLONGAN_DARAH,
        religion: patient.religion || patient.AGAMA,
        maritalStatus: patient.maritalStatus || patient.STATUS_PERKAWINAN,
        occupation: patient.occupation || patient.PEKERJAAN,
        insurance: patient.insurance || patient.ASURANSI,
        emergencyContact: patient.emergencyContact || patient.KONTAK_DARURAT,
        clinic_id: patient.clinic_id || patient.CLINIC_ID,
        created_at: patient.created_at || patient.CREATED_AT,
        updated_at: patient.updated_at || patient.UPDATED_AT,
      }));

      // Apply additional client-side filtering based on user role and clinic_id
      if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
        patients = patients.filter(patient => 
          patient.clinic_id == userPayload.clinic_id
        );
      }

      // Apply client-side search if needed (fallback)
      if (search && patients.length > 0) {
        const searchLower = search.toLowerCase();
        patients = patients.filter((patient) => {
          return (
            (patient.name && patient.name.toLowerCase().includes(searchLower)) ||
            (patient.mrn && patient.mrn.toLowerCase().includes(searchLower)) ||
            (patient.nik && patient.nik.includes(search))
          );
        });
      }

      // Calculate pagination
      const totalPatients = patients.length;
      const totalPages = Math.ceil(totalPatients / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = patients.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedPatients,
        pagination: {
          page,
          limit,
          total: totalPatients,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (apiError) {
      console.error("External API error:", apiError);
      
      // Fallback to local database if external API fails
      console.log("🔄 Falling back to local database...");
      
      try {
        const { query } = await import("@/lib/db");
        
        // Build local query with clinic filtering
        let sql = `
          SELECT 
            p.id, p.mrn, p.name, p.nik, p.birth_date, p.gender, 
            p.nip, p.status, p.address, p.phone, p.email,
            p.blood_type, p.religion, p.marital_status, p.occupation,
            p.insurance, p.emergency_contact, p.clinic_id,
            p.created_at, p.updated_at
          FROM patients p
          WHERE 1=1
        `;
        let params = [];
        let conditions = [];

        // Add clinic filter if user is not superadmin and has clinic_id
        if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
          conditions.push("p.clinic_id = ?");
          params.push(userPayload.clinic_id);
        }

        // Add search filter
        if (search) {
          conditions.push("(p.name LIKE ? OR p.mrn LIKE ? OR p.nik LIKE ?)");
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
          sql += " AND " + conditions.join(" AND ");
        }

        // Get total count
        const countSql = sql.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
        const countResult = await query(countSql, params);
        const totalPatients = countResult[0]?.total || 0;

        // Add pagination
        sql += " ORDER BY p.name ASC LIMIT ? OFFSET ?";
        params.push(limit, (page - 1) * limit);

        const localPatients = await query(sql, params);

        const totalPages = Math.ceil(totalPatients / limit);

        return NextResponse.json({
          data: localPatients,
          pagination: {
            page,
            limit,
            total: totalPatients,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        });
      } catch (dbError) {
        console.error("Local database error:", dbError);
        throw new Error("Failed to fetch patients from both external API and local database");
      }
    }
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil data pasien",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST new patient
export async function POST(request) {
  try {
    const data = await request.json();

    // Validasi data
    if (!data.name || !data.nik || !data.birthDate) {
      return new NextResponse(
        JSON.stringify({ error: "Nama, NIK, dan Tanggal Lahir wajib diisi" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate MR Number
    const year = new Date().getFullYear();
    const lastPatientResults = await query(
      "SELECT mr_number FROM patients WHERE mr_number LIKE ? ORDER BY mr_number DESC LIMIT 1",
      [`MR-${year}%`]
    );

    const sequence =
      lastPatientResults.length > 0
        ? parseInt(lastPatientResults[0].mr_number.split("-")[2]) + 1
        : 1;
    const mrNumber = `MR-${year}-${sequence.toString().padStart(4, "0")}`;

    // Create patient
    const patientInsertSql = `
      INSERT INTO patients (
        mr_number, name, nik, birth_date, gender, blood_type, 
        occupation, marital_status, nip, citizenship, address, 
        phone, email, province_id, province_name, city_id, city_name, 
        district_id, district_name, village_id, village_name, 
        postal_code, company_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const patientParams = [
      mrNumber,
      data.name.trim(),
      data.nik.trim(),
      data.birthDate,
      data.gender || null,
      data.bloodType || null,
      data.occupation || null,
      data.maritalStatus || null,
      data.nip || null,
      data.citizenship || "WNI",
      data.address?.trim() || null,
      data.phone?.trim() || null,
      data.email?.trim() || null,
      data.provinceId || null,
      data.provinceName || null,
      data.cityId || null,
      data.cityName || null,
      data.districtId || null,
      data.districtName || null,
      data.villageId || null,
      data.villageName || null,
      data.postalCode || null,
      data.companyId || null,
    ];

    const patientResult = await query(patientInsertSql, patientParams);
    const patientId = patientResult.insertId;

    // Create insurance if provided
    if (data.insurance) {
      const insuranceInsertSql = `
        INSERT INTO insurance (
          patient_id, provider, number, type, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const insuranceParams = [
        patientId,
        data.insurance.provider,
        data.insurance.number || null,
        data.insurance.type || null,
        data.insurance.status || "Aktif",
      ];

      await query(insuranceInsertSql, insuranceParams);
    }

    // Get the created patient
    const [createdPatient] = await query(
      "SELECT * FROM patients WHERE id = ?",
      [patientId]
    );

    // Format dates before sending response
    const formattedPatient = {
      ...createdPatient,
      birth_date: createdPatient.birth_date
        ? new Date(createdPatient.birth_date).toISOString().split("T")[0]
        : null,
      created_at: createdPatient.created_at
        ? createdPatient.created_at.toISOString()
        : null,
      updated_at: createdPatient.updated_at
        ? createdPatient.updated_at.toISOString()
        : null,
    };

    return new NextResponse(JSON.stringify(formattedPatient), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating patient:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return new NextResponse(
        JSON.stringify({ error: "NIK sudah terdaftar" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: "Gagal menambahkan pasien" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
