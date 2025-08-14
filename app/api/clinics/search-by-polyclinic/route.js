import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET clinics by polyclinic
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const polyclinicId = searchParams.get("polyclinic_id");
    const polyclinicName = searchParams.get("polyclinic_name");
    const city = searchParams.get("city");

    if (!polyclinicId && !polyclinicName) {
      return NextResponse.json(
        { message: "ID atau nama poli diperlukan" },
        { status: 400 }
      );
    }

    let sql = `
      SELECT DISTINCT
        c.*,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        COUNT(DISTINCT d.id) as doctor_count
      FROM clinics c
      JOIN clinic_polyclinics cp ON c.id = cp.clinic_id
      JOIN polyclinics p ON cp.polyclinic_id = p.id
      LEFT JOIN doctors d ON c.id = d.clinic_id AND p.id = d.polyclinic_id
      WHERE cp.is_active = TRUE AND c.is_active = TRUE
    `;
    let params = [];
    let conditions = [];

    if (polyclinicId) {
      conditions.push("cp.polyclinic_id = ?");
      params.push(polyclinicId);
    }

    if (polyclinicName) {
      conditions.push("p.name LIKE ?");
      params.push(`%${polyclinicName}%`);
    }

    if (city) {
      conditions.push("c.city LIKE ?");
      params.push(`%${city}%`);
    }

    if (conditions.length > 0) {
      sql += " AND " + conditions.join(" AND ");
    }

    sql += " GROUP BY c.id ORDER BY c.name ASC";

    const clinics = await query(sql, params);

    return NextResponse.json({
      clinics,
      total: clinics.length,
      polyclinic: polyclinicId ? 
        await query("SELECT * FROM polyclinics WHERE id = ?", [polyclinicId]).then(r => r[0]) : 
        null
    });
  } catch (error) {
    console.error("Error searching clinics by polyclinic:", error);
    return NextResponse.json(
      { message: "Gagal mencari klinik berdasarkan poli" },
      { status: 500 }
    );
  }
} 