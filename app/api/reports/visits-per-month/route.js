import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/reports/visits-per-month
// Returns counts of visits grouped by facility and month. Optional query params:
// - start: YYYY-MM-01 (inclusive)
// - end: YYYY-MM-DD (inclusive)
// - facility_code: filter by facility code
// - employee_status: filter by employee status ('Pensiunan' or 'Pegawai Aktif')
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityCode = searchParams.get('facility_code');
    const employeeStatus = searchParams.get('employee_status'); // 'Pensiunan' or 'Pegawai Aktif'
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Default: last 12 months including current month
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startStr = start || `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}-01`;
    const endStr = end || `${defaultEnd.getFullYear()}-${String(defaultEnd.getMonth() + 1).padStart(2, '0')}-${String(defaultEnd.getDate()).padStart(2, '0')}`;

    // Calculate current year and current YY (2-digit year)
    const currentYear = now.getFullYear();
    const currentYY = currentYear % 100;

    let sql = `
      SELECT 
        DATE_FORMAT(visit_date, '%Y-%m') as month,
        COALESCE(facility_name, '-') as facilityName,
        COUNT(*) as count
      FROM visits
      WHERE DATE(visit_date) BETWEEN ? AND ?
    `;
    const params = [startStr, endStr];

    if (facilityCode) {
      sql += ` AND facility_code = ?`;
      params.push(facilityCode);
    }

    // Add employee status filter based on NIP
    // NIP format: 2 digit awal adalah tahun lahir (YY format)
    // Calculate age from NIP and filter by status
    if (employeeStatus) {
      const minBirthYear = currentYear - 56; // Minimum birth year for Pensiunan (age >= 56)
      const maxBirthYear = currentYear - 55; // Maximum birth year for Pegawai Aktif (age < 56)
      const minBirthYearYY = minBirthYear % 100;
      
      if (employeeStatus === 'Pensiunan') {
        // Age >= 56: born in year <= (currentYear - 56)
        // If YY <= currentYY, it's 2000s, else 1900s
        sql += ` AND (
          patient_nip IS NOT NULL 
          AND patient_nip != ''
          AND LENGTH(patient_nip) >= 2
          AND CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED) BETWEEN 0 AND 99
          AND (
            (CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED) <= ? AND (2000 + CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED)) <= ?)
            OR
            (CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED) > ? AND (1900 + CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED)) <= ?)
          )
        )`;
        params.push(currentYY, minBirthYear, currentYY, minBirthYear);
      } else if (employeeStatus === 'Pegawai Aktif') {
        // Age < 56: born in year >= (currentYear - 55)
        sql += ` AND (
          patient_nip IS NOT NULL 
          AND patient_nip != ''
          AND LENGTH(patient_nip) >= 2
          AND CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED) BETWEEN 0 AND 99
          AND (
            (CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED) <= ? AND (2000 + CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED)) >= ?)
            OR
            (CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED) > ? AND (1900 + CAST(SUBSTRING(patient_nip, 1, 2) AS UNSIGNED)) >= ?)
          )
        )`;
        params.push(currentYY, maxBirthYear, currentYY, maxBirthYear);
      }
    }

    sql += `
      GROUP BY DATE_FORMAT(visit_date, '%Y-%m'), facilityName
      ORDER BY month ASC, facilityName ASC
    `;

    const rows = await query(sql, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


