import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all doctors with polyclinic and clinic information
export async function GET(request) {
  try {
    // Get user information from token to check role and clinic_id
    const token = request.cookies.get("token");
    let userPayload = null;
    
    if (token) {
      try {
        const { verifyJwtToken } = await import("@/lib/auth");
        userPayload = await verifyJwtToken(token.value);
      } catch (error) {

      }
    }

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
        COALESCE(c.name, cf.name, df.facility_name) as clinic_name,
        COALESCE(c.code, cf.code, df.facility_code) as clinic_code,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        d.created_at as createdAt, 
        d.updated_at as updatedAt,
        (
          SELECT GROUP_CONCAT(DISTINCT 
            CASE 
              WHEN vc.name IS NOT NULL AND vc.name != '' THEN vc.name
              ELSE v.facility_name
            END
          SEPARATOR ', ')
          FROM visits v 
          LEFT JOIN clinics vc ON v.facility_code IS NOT NULL 
            AND v.facility_code != '' 
            AND v.facility_code != '-'
            AND vc.code = v.facility_code
          WHERE v.doctor_name = d.name
            AND (
              (v.facility_name IS NOT NULL AND v.facility_name != '' AND v.facility_name != '-')
              OR (vc.name IS NOT NULL AND vc.name != '')
            )
        ) as clinics_from_visits,
        (
          SELECT GROUP_CONCAT(DISTINCT 
            CASE 
              WHEN v.clinic IS NOT NULL AND v.clinic != '' AND v.clinic != '-' THEN v.clinic
              WHEN v.room IS NOT NULL AND v.room != '' AND v.room != '-' THEN v.room
              ELSE NULL
            END
          SEPARATOR ', ')
          FROM visits v 
          WHERE v.doctor_name = d.name
        ) as polyclinics_from_visits
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      LEFT JOIN (
        SELECT 
          v.doctor_name,
          MAX(
            CASE 
              WHEN v.facility_code IS NOT NULL AND v.facility_code != '' AND v.facility_code != '-' 
              THEN v.facility_code 
              ELSE NULL 
            END
          ) AS facility_code,
          MAX(
            CASE 
              WHEN vc.name IS NOT NULL AND vc.name != '' 
              THEN vc.name 
              WHEN v.facility_name IS NOT NULL AND v.facility_name != '' AND v.facility_name != '-' 
              THEN v.facility_name 
              ELSE NULL 
            END
          ) AS facility_name
        FROM visits v
        LEFT JOIN clinics vc ON v.facility_code IS NOT NULL 
          AND v.facility_code != '' 
          AND v.facility_code != '-'
          AND vc.code = v.facility_code
        GROUP BY v.doctor_name
      ) df ON df.doctor_name = d.name
      LEFT JOIN clinics cf ON (
        df.facility_code IS NOT NULL 
        AND df.facility_code != '' 
        AND cf.code = df.facility_code
      )
      LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
    `;
    let params = [];
    let conditions = [];

    // Add clinic filter if user is not superadmin and has clinic_id
    if (userPayload && userPayload.role !== "SUPERADMIN" && userPayload.clinic_id) {
      conditions.push("d.clinic_id = ?");
      params.push(userPayload.clinic_id);
    }

    if (search) {
      conditions.push("(d.name LIKE ? OR d.specialist LIKE ? OR p.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (polyclinicId) {
      conditions.push("d.polyclinic_id = ?");
      params.push(polyclinicId);
    }

    if (clinicId) {
      conditions.push("(d.clinic_id = ? OR cf.id = ?)");
      params.push(clinicId, clinicId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY d.name ASC";

    const doctors = await query(sql, params);

    return NextResponse.json(doctors);
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil data dokter",
        error: error.message 
      },
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
        COALESCE(c.name, cf.name, df.facility_name) as clinic_name,
        COALESCE(c.code, cf.code, df.facility_code) as clinic_code,
        p.name as polyclinic_name,
        p.code as polyclinic_code,
        d.created_at as createdAt, 
        d.updated_at as updatedAt,
        (
          SELECT GROUP_CONCAT(DISTINCT 
            CASE 
              WHEN vc.name IS NOT NULL AND vc.name != '' THEN vc.name
              ELSE v.facility_name
            END
          SEPARATOR ', ')
          FROM visits v 
          LEFT JOIN clinics vc ON v.facility_code IS NOT NULL 
            AND v.facility_code != '' 
            AND v.facility_code != '-'
            AND vc.code = v.facility_code
          WHERE v.doctor_name = d.name
            AND (
              (v.facility_name IS NOT NULL AND v.facility_name != '' AND v.facility_name != '-')
              OR (vc.name IS NOT NULL AND vc.name != '')
            )
        ) as clinics_from_visits,
        (
          SELECT GROUP_CONCAT(DISTINCT 
            CASE 
              WHEN v.clinic IS NOT NULL AND v.clinic != '' AND v.clinic != '-' THEN v.clinic
              WHEN v.room IS NOT NULL AND v.room != '' AND v.room != '-' THEN v.room
              ELSE NULL
            END
          SEPARATOR ', ')
          FROM visits v 
          WHERE v.doctor_name = d.name
        ) as polyclinics_from_visits
      FROM doctors d
      LEFT JOIN clinics c ON d.clinic_id = c.id
      LEFT JOIN (
        SELECT 
          v.doctor_name,
          MAX(
            CASE 
              WHEN v.facility_code IS NOT NULL AND v.facility_code != '' AND v.facility_code != '-' 
              THEN v.facility_code 
              ELSE NULL 
            END
          ) AS facility_code,
          MAX(
            CASE 
              WHEN vc.name IS NOT NULL AND vc.name != '' 
              THEN vc.name 
              WHEN v.facility_name IS NOT NULL AND v.facility_name != '' AND v.facility_name != '-' 
              THEN v.facility_name 
              ELSE NULL 
            END
          ) AS facility_name
        FROM visits v
        LEFT JOIN clinics vc ON v.facility_code IS NOT NULL 
          AND v.facility_code != '' 
          AND v.facility_code != '-'
          AND vc.code = v.facility_code
        GROUP BY v.doctor_name
      ) df ON df.doctor_name = d.name
      LEFT JOIN clinics cf ON (
        df.facility_code IS NOT NULL 
        AND df.facility_code != '' 
        AND cf.code = df.facility_code
      )
      LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
      WHERE d.id = ?`,
      [result.insertId]
    );

    return NextResponse.json(newDoctor, { status: 201 });
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal menambahkan dokter", error: error.message },
      { status: 500 }
    );
  }
}
