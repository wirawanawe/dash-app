import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all doctors
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";

    let sql = `
      SELECT 
        id, 
        name, 
        specialist, 
        license_number, 
        phone, 
        email, 
        address,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM doctors
    `;
    let params = [];

    if (search) {
      sql += " WHERE name LIKE ? OR specialist LIKE ?";
      params = [`%${search}%`, `%${search}%`];
    }

    sql += " ORDER BY name ASC";

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
      (name, specialist, license_number, phone, email, address, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      data.name,
      data.specialist || null,
      data.license_number || null,
      data.phone || null,
      data.email || null,
      data.address || null,
    ];

    const result = await query(sql, params);

    // Ambil data yang baru dibuat
    const [newDoctor] = await query(
      `SELECT 
        id, 
        name, 
        specialist, 
        license_number, 
        phone, 
        email, 
        address,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM doctors 
      WHERE id = ?`,
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
