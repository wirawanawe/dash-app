import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all patients from local database (all data is stored locally)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const sortBy = searchParams.get("sortBy") || "name"; // name, nik, created
  const sortOrder = searchParams.get("sortOrder") || "asc"; // asc, desc
  
  try {
    // Build SQL query
    let sql = `SELECT * FROM patients WHERE 1=1`;
    let params = [];
    
    // Apply search filter
    if (search) {
      sql += ` AND (
        name LIKE ? OR 
        mrn LIKE ? OR 
        nik LIKE ? OR
        nip LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Get user information for role-based filtering
    const token = request.cookies.get("token");
    let userPayload = null;
    
    if (token) {
      try {
        const { verifyJwtToken } = await import("@/lib/auth");
        userPayload = await verifyJwtToken(token.value);
      } catch (error) {
        // Error verifying token
      }
    }
    
    // Apply clinic filter based on user role
    if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
      sql += ` AND clinic_id = ?`;
      params.push(userPayload.clinic_id);
    }
    
    // Get total count for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await query(countSql, params);
    const totalPatients = countResult?.total || 0;
    
    // Apply sorting
    if (sortBy === "name") {
      sql += ` ORDER BY name ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    } else if (sortBy === "nik") {
      sql += ` ORDER BY nik ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    } else if (sortBy === "created") {
      sql += ` ORDER BY synced_at ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    }
    
    // Apply pagination - interpolate integers directly  
    const offset = Math.floor((page - 1) * limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    // Execute query
    const cachedPatients = await query(sql, params);
    
    // Transform cached data to match expected format
    let patients = cachedPatients.map((patient) => ({
      id: patient.external_id || patient.id,
      mrn: patient.nip, // Use NIP as No. RM
      name: patient.name,
      nik: patient.nik,
      birthDate: patient.birthdate, // Column name in DB is 'birthdate' not 'birth_date'
      gender: patient.gender,
      nip: patient.nip,
      noPeserta: patient.no_peserta, // No. Peserta PLN Insurance
      namaPeserta: patient.nama_peserta, // Nama Peserta
      bagian: patient.bagian, // Perusahaan/Bagian
      status: patient.status,
      address: patient.address,
      phone: patient.phone,
      email: patient.email,
      bloodType: patient.blood_type,
      religion: patient.religion,
      maritalStatus: patient.marital_status,
      occupation: patient.occupation,
      insurance: patient.insurance_number,
      emergencyContact: patient.emergency_contact,
      clinic_id: patient.clinic_id,
      created_at: patient.external_created_at || patient.created_at,
      updated_at: patient.external_updated_at || patient.updated_at,
    }));

    // Calculate pagination
    const totalPages = Math.ceil(totalPatients / limit);

    return NextResponse.json({
      data: patients,
      pagination: {
        page,
        limit,
        total: totalPatients,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    // Error handling - retry with simplified query
    try {
      const { query } = await import("@/lib/db");
      
      // Build local query with clinic filtering
      let sql = `
        SELECT 
          p.id, p.mrn, p.name, p.nik, p.birthdate, p.gender, 
          p.address, p.phone, p.email, p.insurance_number,
          p.created_at, p.updated_at
        FROM patients p
        WHERE 1=1
      `;
      let params = [];
      let conditions = [];

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

      // Add pagination - interpolate integers directly
      const fallbackOffset = Math.floor((page - 1) * limit);
      sql += ` ORDER BY name ASC LIMIT ${parseInt(limit)} OFFSET ${parseInt(fallbackOffset)}`;

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
      return NextResponse.json(
        {
          error: "Failed to fetch patients",
          message: dbError.message
        },
        { status: 500 }
      );
    }
  }
}

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
