import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET doctors by polyclinic
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const polyclinicId = searchParams.get("polyclinic_id");
    const polyclinicName = searchParams.get("polyclinic_name");
    const clinicId = searchParams.get("clinic_id");
    const city = searchParams.get("city");

    if (!polyclinicId && !polyclinicName) {
      return NextResponse.json(
        { message: "ID atau nama poli diperlukan" },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        d.*,
        c.name as clinic_name,
        c.city as clinic_city,
        p.name as polyclinic_name,
        p.code as polyclinic_code
      FROM doctors d
      JOIN polyclinics p ON d.polyclinic_id = p.id
      LEFT JOIN clinics c ON d.clinic_id = c.id
      WHERE d.polyclinic_id IS NOT NULL
    `;
    let params = [];
    let conditions = [];

    if (polyclinicId) {
      conditions.push("d.polyclinic_id = ?");
      params.push(polyclinicId);
    }

    if (polyclinicName) {
      conditions.push("p.name LIKE ?");
      params.push(`%${polyclinicName}%`);
    }

    if (clinicId) {
      conditions.push("d.clinic_id = ?");
      params.push(clinicId);
    }

    if (city) {
      conditions.push("c.city LIKE ?");
      params.push(`%${city}%`);
    }

    if (conditions.length > 0) {
      sql += " AND " + conditions.join(" AND ");
    }

    sql += " ORDER BY d.name ASC";

    const doctors = await query(sql, params);

    return NextResponse.json({
      doctors,
      total: doctors.length,
      polyclinic: polyclinicId ? 
        await query("SELECT * FROM polyclinics WHERE id = ?", [polyclinicId]).then(r => r[0]) : 
        null
    });
  } catch (error) {
    console.error("Error fetching doctors by polyclinic:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data dokter berdasarkan poli" },
      { status: 500 }
    );
  }
} 