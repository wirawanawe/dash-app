import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all doctors
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";

    // First try to get doctors from local database
    let doctors = await query(
      "SELECT * FROM doctors ORDER BY name ASC"
    );

    // If no doctors in local DB, try external API
    if (!doctors || doctors.length === 0) {
      try {
        const externalResponse = await fetch(
          `${process.env.EXTERNAL_API_URL}/doctors`,
          {
            headers: {
              "Authorization": `Bearer ${process.env.EXTERNAL_API_TOKEN}`,
            },
          }
        );

        if (externalResponse.ok) {
          const externalDoctors = await externalResponse.json();
          return NextResponse.json({
            success: true,
            doctors: externalDoctors,
            source: "external",
          });
        }
      } catch (externalError) {
        console.error("External API error:", externalError);
      }
    }

    return NextResponse.json({
      success: true,
      doctors: doctors,
      source: "local",
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
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
