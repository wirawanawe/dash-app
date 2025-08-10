import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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
      const patients = rawPatients.map((patient) => ({
        id: patient.No_MR,
        mrn: patient.No_MR,
        name: patient.Nama_Pasien,
        gender: patient.Jenis_Kelamin?.[0]?.name || "-",
        birthDate: patient.Tgl_Lahir ? patient.Tgl_Lahir.split(" ")[0] : null,
        nik: patient.Identitas?.find((id) => id.type === "nik")?.id || "",
        nip: patient.Identitas?.find((id) => id.type === "nip")?.id || "",
        phone: "", // Not available in external API
        address: patient.Alamat_Rumah?.[0]?.Alamat || "",
        city: patient.Alamat_Rumah?.[0]?.Kota?.[0]?.name || "",
        province: patient.Alamat_Rumah?.[0]?.Propinsi?.[0]?.name || "",
        bloodType: patient.Golongan_Darah?.[0]?.name || "-",
        religion: patient.Agama?.[0]?.name || "-",
        maritalStatus: patient.Status_Marital?.[0]?.name || "-",
        occupation: patient.Pekerjaan?.[0]?.name || "-",
        education: patient.Pendidikan?.[0]?.name || "-",
        created_at: patient.audittrail?.CreatedDate || null,
        updated_at: patient.audittrail?.LastModifiedDate || null,
      }));

      // Use the pagination info from the external API
      const totalFromAPI =
        externalData["total pasien"] || externalData.total || patients.length;
      const totalPages = Math.ceil(totalFromAPI / limit);

      console.log(`✅ Successfully fetched ${patients.length} patients from external API`);

      return NextResponse.json({
        data: patients,
        pagination: {
          total: totalFromAPI,
          page,
          limit,
          totalPages,
        },
      });
    } catch (externalApiError) {
      console.error("External API failed, trying local database fallback:", externalApiError.message);
      
      // Fallback to local database if external API fails
      try {
        let sql = "SELECT * FROM patients WHERE 1=1";
        const params = [];
        
        if (search) {
          sql += " AND (name LIKE ? OR mr_number LIKE ? OR nik LIKE ?)";
          const searchTerm = `%${search}%`;
          params.push(searchTerm, searchTerm, searchTerm);
        }
        
        sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const localPatients = await query(sql, params);
        
        // Get total count for pagination
        let countSql = "SELECT COUNT(*) as total FROM patients WHERE 1=1";
        const countParams = [];
        
        if (search) {
          countSql += " AND (name LIKE ? OR mr_number LIKE ? OR nik LIKE ?)";
          const searchTerm = `%${search}%`;
          countParams.push(searchTerm, searchTerm, searchTerm);
        }
        
        const [{ total }] = await query(countSql, countParams);
        const totalPages = Math.ceil(total / limit);
        
        console.log(`✅ Fallback: Found ${localPatients.length} patients in local database`);
        
        return NextResponse.json({
          data: localPatients,
          pagination: {
            total,
            page,
            limit,
            totalPages,
          },
          note: "Data from local database (external API unavailable)"
        });
      } catch (localDbError) {
        console.error("Local database fallback also failed:", localDbError);
        
        // Return empty result with error message
        return NextResponse.json({
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
          error: "External API and local database both unavailable",
          note: "Please try again later or contact support"
        }, { status: 503 });
      }
    }
  } catch (error) {
    console.error("Error in patients API:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch patients",
        error: error.message,
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
