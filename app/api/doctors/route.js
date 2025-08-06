import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all doctors with polyclinic and clinic information
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const polyclinicId = searchParams.get("polyclinic_id");
    const clinicId = searchParams.get("clinic_id");

    let sql = `
      SELECT 
        d.id, 
        d.name, 
        d.specialist, 
        d.license_number, 
        d.phone, 
        d.email, 
        d.address,
        d.clinic_id,
        d.polyclinic_id,
        c.name as clinic_name,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        d.created_at as createdAt, 
        d.updated_at as updatedAt
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
    `;
    let params = [];
    let conditions = [];

    if (search) {
      conditions.push("(d.name LIKE ? OR d.specialist LIKE ? OR p.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (polyclinicId) {
      conditions.push("d.polyclinic_id = ?");
      params.push(polyclinicId);
    }

    if (clinicId) {
      conditions.push("d.clinic_id = ?");
      params.push(clinicId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY d.name ASC";

    const doctors = await query(sql, params);

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);

    // Provide more specific error details
    let errorMessage = "Gagal mengambil data dokter";
    let errorCode = 500;

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      errorMessage = "Database connection failed: Access denied";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Database connection failed: Connection refused";
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      errorMessage = "Database error: Table does not exist";
    }

    return NextResponse.json(
      { message: errorMessage, code: error.code, sqlMessage: error.sqlMessage },
      { status: errorCode }
    );
  }
}

// POST new doctor
export async function POST(request) {
  try {
    const data = await request.json();

    // Validasi data
    if (!data.name) {
      return NextResponse.json(
        { message: "Nama dokter harus diisi" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO doctors 
      (name, specialist, license_number, phone, email, address, clinic_id, polyclinic_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      data.name,
      data.specialist || null,
      data.license_number || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.clinic_id || null,
      data.polyclinic_id || null,
    ];

    const result = await query(sql, params);

    // Ambil data yang baru dibuat
    const [newDoctor] = await query(
      `SELECT 
        d.id, 
        d.name, 
        d.specialist, 
        d.license_number, 
        d.phone, 
        d.email, 
        d.address,
        d.clinic_id,
        d.polyclinic_id,
        c.name as clinic_name,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        d.created_at as createdAt, 
        d.updated_at as updatedAt
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
      WHERE d.id = ?`,
      [result.insertId]
    );

    return NextResponse.json(newDoctor, { status: 201 });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan dokter", error: error.message },
      { status: 500 }
    );
  }
}
