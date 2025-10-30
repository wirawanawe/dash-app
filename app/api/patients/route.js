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
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const sortBy = searchParams.get("sortBy") || "name"; // name, nik, created
  const sortOrder = searchParams.get("sortOrder") || "asc"; // asc, desc
  
  try {
    // Determine if we need to fetch all data for client-side filtering
    const needsClientSideFiltering = search !== "";
    
    // If we need client-side filtering, fetch a large batch or all data
    const fetchLimit = needsClientSideFiltering ? 10000 : limit;
    const fetchPage = needsClientSideFiltering ? 1 : page;

    // Build API URL - using the new API endpoint
    let apiUrl = `https://api-ehr-klinik.doctorphc.id/pasien?page=${fetchPage}&limit=${fetchLimit}`;

    console.log(`[Patients API] Fetching from: ${apiUrl}`);

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
    
    console.log(`[Patients API] Fetched ${rawPatients.length} patients from external API`);

    // Log first patient for debugging
    if (rawPatients.length > 0) {
      console.log('[Patients API] Sample patient data:', JSON.stringify(rawPatients[0], null, 2));
    }

    // Transform the external API data to match our expected format
    let patients = rawPatients.map((patient) => {
      // Extract NIK and NIP from Identitas array with multiple approaches
      let nik = "";
      let nip = "";
      
      if (patient.Identitas && Array.isArray(patient.Identitas)) {
        const nikObj = patient.Identitas.find((id) => 
          id.type === "nik" || id.Type === "nik" || id.TYPE === "NIK" || 
          id.type === "NIK" || id.nama === "NIK" || id.Nama === "NIK"
        );
        const nipObj = patient.Identitas.find((id) => 
          id.type === "nip" || id.Type === "nip" || id.TYPE === "NIP" || 
          id.type === "NIP" || id.nama === "NIP" || id.Nama === "NIP"
        );
        
        nik = nikObj?.id || nikObj?.Id || nikObj?.ID || nikObj?.value || nikObj?.Value || "";
        nip = nipObj?.id || nipObj?.Id || nipObj?.ID || nipObj?.value || nipObj?.Value || "";
      }
      
      // Fallback: check if NIK/NIP exist as direct properties
      if (!nik && patient.NIK) nik = patient.NIK;
      if (!nip && patient.NIP) nip = patient.NIP;
      
      // Extract gender with multiple approaches
      let gender = "";
      if (patient.Jenis_Kelamin) {
        if (Array.isArray(patient.Jenis_Kelamin) && patient.Jenis_Kelamin.length > 0) {
          gender = patient.Jenis_Kelamin[0]?.name || patient.Jenis_Kelamin[0]?.Name || patient.Jenis_Kelamin[0];
        } else if (typeof patient.Jenis_Kelamin === 'string') {
          gender = patient.Jenis_Kelamin;
        } else if (typeof patient.Jenis_Kelamin === 'object') {
          gender = patient.Jenis_Kelamin?.name || patient.Jenis_Kelamin?.Name || "";
        }
      }
      
      // Additional fallbacks for gender
      if (!gender && patient.Gender) gender = patient.Gender;
      if (!gender && patient.gender) gender = patient.gender;
      
      return {
        id: patient.No_MR || patient.ID || patient.id,
        mrn: patient.No_MR || patient.No_RM || patient.MRN || "-",
        name: patient.Nama_Pasien || patient.Nama || patient.Name || "-",
        gender: gender || "-",
        birthDate: patient.Tgl_Lahir ? patient.Tgl_Lahir.split(" ")[0] : null,
        age: patient.Umur || patient.Age || "-",
        nik: nik,
        nip: nip,
        noPeserta: patient.No_Peserta || "",
        namaPeserta: patient.Nama_Peserta || "",
        phone: patient.No_Telepon || patient.No_HP || patient.Phone || "",
        address: patient.Alamat_Rumah?.[0]?.Alamat || patient.Alamat || "",
        rt: patient.Alamat_Rumah?.[0]?.RT || "",
        rw: patient.Alamat_Rumah?.[0]?.RW || "",
        kelurahan: patient.Alamat_Rumah?.[0]?.Kelurahan?.[0]?.name || "",
        kecamatan: patient.Alamat_Rumah?.[0]?.Kecamatan?.[0]?.name || "",
        city: patient.Alamat_Rumah?.[0]?.Kota?.[0]?.name || patient.Kota || "",
        province: patient.Alamat_Rumah?.[0]?.Propinsi?.[0]?.name || patient.Propinsi || "",
        postalCode: patient.Alamat_Rumah?.[0]?.Kode_Pos || "",
        bloodType: patient.Golongan_Darah?.[0]?.name || patient.Golongan_Darah || "-",
        religion: patient.Agama?.[0]?.name || patient.Agama || "-",
        maritalStatus: patient.Status_Marital?.[0]?.name || patient.Status_Marital || "-",
        occupation: patient.Pekerjaan?.[0]?.name || patient.Pekerjaan || "-",
        education: patient.Pendidikan?.[0]?.name || patient.Pendidikan || "-",
        nationality: patient.Kewarganegaraan?.[0]?.name || patient.Kewarganegaraan || "-",
        department: patient.Bagian || patient.Department || "",
        company: patient.Perusahaan || patient.Company || "",
        createdAt: patient.audittrail?.CreatedDate || patient.audittrail?.created_at || null,
        updatedAt: patient.audittrail?.LastModifiedDate || patient.audittrail?.updated_at || null,
      };
    });

    // Apply client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter((patient) => {
        return (
          patient.name?.toLowerCase().includes(searchLower) ||
          patient.nik?.toLowerCase().includes(searchLower) ||
          patient.nip?.toLowerCase().includes(searchLower) ||
          patient.mrn?.toLowerCase().includes(searchLower) ||
          patient.noPeserta?.toLowerCase().includes(searchLower)
        );
      });
      console.log(`[Patients API] After search filter: ${patients.length} patients match`);
    }

    // Sort patients
    console.log(`[Patients API] Sorting by: ${sortBy}, order: ${sortOrder}`);
    
    patients.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        const aName = a.name || "";
        const bName = b.name || "";
        comparison = aName.localeCompare(bName);
      } else if (sortBy === "nik") {
        const aNik = a.nik || "";
        const bNik = b.nik || "";
        comparison = aNik.localeCompare(bNik);
      } else if (sortBy === "created") {
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        comparison = bDate.getTime() - aDate.getTime(); // Default descending for date
      } else if (sortBy === "mrn") {
        const aMrn = a.mrn || "";
        const bMrn = b.mrn || "";
        comparison = aMrn.localeCompare(bMrn);
      }

      // Apply sort order
      if (sortOrder === "desc" && (sortBy === "name" || sortBy === "nik" || sortBy === "mrn")) {
        comparison = -comparison;
      } else if (sortOrder === "asc" && sortBy === "created") {
        comparison = -comparison;
      }

      return comparison;
    });

    // Calculate pagination AFTER all filtering
    const actualTotal = patients.length;
    const totalPages = Math.ceil(actualTotal / limit);
    
    console.log(`[Patients API] Total after filtering: ${actualTotal} patients`);
    
    // Apply pagination to filtered results
    let paginatedPatients = patients;
    if (needsClientSideFiltering) {
      // If we fetched all data for client-side filtering, now paginate the results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedPatients = patients.slice(startIndex, endIndex);
      console.log(`[Patients API] Returning page ${page} with ${paginatedPatients.length} patients`);
    }

    return NextResponse.json({
      data: paginatedPatients,
      pagination: {
        total: actualTotal,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching patients from external API:", error);

    // Fallback to local database if external API fails
    try {
      const patients = await query(
        `
        SELECT 
          id, mr_number as mrn, name, nik, nip, birth_date as birthDate,
          gender, blood_type as bloodType, phone, address, city, province,
          occupation, marital_status as maritalStatus, created_at as createdAt,
          updated_at as updatedAt
        FROM patients
        ORDER BY name ASC
      `
      );

      return NextResponse.json({
        data: patients,
        pagination: {
          total: patients.length,
          page: 1,
          limit: patients.length,
          totalPages: 1,
        },
      });
    } catch (fallbackError) {
      console.error("Fallback to local database also failed:", fallbackError);
      return NextResponse.json(
        {
          message: "Failed to fetch patients from external API and local database",
          error: error.message,
        },
        { status: 500 }
      );
    }
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
