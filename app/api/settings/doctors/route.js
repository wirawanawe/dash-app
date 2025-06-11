import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all doctors
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";

    let sql = "SELECT * FROM doctors";
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
    return NextResponse.json(
      { message: "Failed to fetch doctors" },
      { status: 500 }
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
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO doctors 
      (name, specialist, license_number, phone, email, address) 
      VALUES (?, ?, ?, ?, ?, ?)
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
    const newDoctor = await query("SELECT * FROM doctors WHERE id = ?", [
      result.insertId,
    ]);

    return NextResponse.json(newDoctor[0], { status: 201 });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { message: "Failed to create doctor" },
      { status: 500 }
    );
  }
}
