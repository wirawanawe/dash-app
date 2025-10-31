import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/reports/diagnoses-per-month
// Returns counts of diagnoses grouped by diagnosis string and month
// Optional params: start, end (YYYY-MM-DD), facility_code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityCode = searchParams.get('facility_code');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startStr = start || `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}-01`;
    const endStr = end || `${defaultEnd.getFullYear()}-${String(defaultEnd.getMonth() + 1).padStart(2, '0')}-${String(defaultEnd.getDate()).padStart(2, '0')}`;

    let sql = `
      SELECT 
        DATE_FORMAT(visit_date, '%Y-%m') as month,
        TRIM(COALESCE(NULLIF(diagnosis, ''), '-')) as diagnosis,
        COUNT(*) as count
      FROM visits
      WHERE DATE(visit_date) BETWEEN ? AND ?
        AND diagnosis IS NOT NULL
        AND diagnosis <> '-'
    `;
    const params = [startStr, endStr];

    if (facilityCode) {
      sql += ` AND facility_code = ?`;
      params.push(facilityCode);
    }

    sql += `
      GROUP BY DATE_FORMAT(visit_date, '%Y-%m'), diagnosis
      ORDER BY month ASC, count DESC
    `;

    const rows = await query(sql, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


