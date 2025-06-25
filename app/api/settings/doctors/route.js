import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all doctors
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";

    // First try to get from local database
    let sql = "SELECT * FROM doctors";
    let params = [];

    if (search) {
      sql += " WHERE name LIKE ? OR specialist LIKE ?";
      params = [`%${search}%`, `%${search}%`];
    }

    sql += " ORDER BY name ASC";

    const doctors = await query(sql, params);

    // If no doctors in local database, fetch from external API
    if (doctors.length === 0) {
      try {
        console.log("No doctors in local DB, fetching from external API...");

        // Fetch visits data to extract unique doctors
        const apiUrl = `http://api-klinik.doctorphc.id/transaksi/kunjungan?limit=100`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const externalData = await response.json();
          let rawVisits = [];

          if (externalData.data && Array.isArray(externalData.data)) {
            rawVisits = externalData.data;
          } else if (Array.isArray(externalData)) {
            rawVisits = externalData;
          }

          // Extract unique doctors from visits data
          const uniqueDoctors = [];
          const doctorMap = new Map();

          rawVisits.forEach((visit) => {
            if (visit.Dokter && visit.Dokter[0]) {
              const doctor = visit.Dokter[0];
              const doctorId = doctor.id || doctor.Id || "unknown";
              const doctorName = doctor.Nama_Dokter || doctor.name || "";

              if (doctorName && !doctorMap.has(doctorId)) {
                doctorMap.set(doctorId, {
                  id: doctorId,
                  name: doctorName,
                  specialist: doctor.Spesialist || "",
                });
                uniqueDoctors.push(doctorMap.get(doctorId));
              }
            }
          });

          // Filter by search if provided
          let filteredDoctors = uniqueDoctors;
          if (search) {
            filteredDoctors = uniqueDoctors.filter(
              (doctor) =>
                doctor.name.toLowerCase().includes(search.toLowerCase()) ||
                (doctor.specialist &&
                  doctor.specialist
                    .toLowerCase()
                    .includes(search.toLowerCase()))
            );
          }

          // Sort by name
          filteredDoctors.sort((a, b) => a.name.localeCompare(b.name));

          return NextResponse.json(filteredDoctors);
        }
      } catch (apiError) {
        console.error("Error fetching from external API:", apiError);
      }
    }

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
