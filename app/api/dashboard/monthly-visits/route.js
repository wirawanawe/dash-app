import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET monthly visits statistics with optional clinic filter
export async function GET(request) {
  try {
    // Get facility_code from query params if provided
    const { searchParams } = new URL(request.url);
    const facilityCode = searchParams.get('facility_code');

    // Build the last 12 months timeline (including current month), zero-filled
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // first day 11 months ago
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);    // last day current month

    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      months.push({ month: key, label });
    }

    if (facilityCode) {
      // Single clinic: aggregate by month and zero-fill
      let sql = `
        SELECT 
          DATE_FORMAT(visit_date, '%Y-%m') as month,
          COUNT(*) as count
        FROM visits
        WHERE DATE(visit_date) BETWEEN ? AND ?
          AND facility_code = ?
        GROUP BY DATE_FORMAT(visit_date, '%Y-%m')
        ORDER BY month ASC
      `;
      const rows = await query(sql, [startStr, endStr, facilityCode]);
      const countsByMonth = new Map(rows.map(r => [r.month, parseInt(r.count)]));

      const data = months.map(m => ({
        month: m.month,
        label: m.label,
        count: countsByMonth.get(m.month) || 0,
      }));

      return NextResponse.json({ success: true, data });
    }

    // All clinics: group by facility and month, zero-fill across 12 months
    // Filter out visits without valid facility_code
    let sql = `
      SELECT 
        DATE_FORMAT(visit_date, '%Y-%m') as month,
        facility_code as facilityCode,
        COUNT(*) as count
      FROM visits
      WHERE DATE(visit_date) BETWEEN ? AND ?
        AND facility_code IS NOT NULL
        AND facility_code != ''
      GROUP BY DATE_FORMAT(visit_date, '%Y-%m'), facility_code
      ORDER BY month ASC
    `;
    const rows = await query(sql, [startStr, endStr]);

    // Determine distinct facilities present in the data (sudah pasti valid karena di-filter di SQL)
    const facilitySet = new Set(rows.map(r => r.facilityCode));
    const facilityCodes = Array.from(facilitySet);

    // Build chart rows with each facility as a separate series key
    const monthRowMap = new Map(months.map(m => [m.month, { month: m.month, label: m.label }]));
    // Initialize each month row with zero for each facility
    monthRowMap.forEach(row => {
      facilityCodes.forEach(code => {
        row[code] = 0;
      });
      row.total = 0;
    });

    rows.forEach(r => {
      const row = monthRowMap.get(r.month);
      if (!row) return;
      
      // Skip jika facilityCode tidak valid (seharusnya sudah di-filter di SQL, tapi double check)
      const code = r.facilityCode;
      if (!code) return;
      
      if (row[code] === undefined) {
        // Newly seen code after initialization: extend all rows
        monthRowMap.forEach(rr => { rr[code] = 0; });
        facilitySet.add(code);
      }
      const count = parseInt(r.count);
      row[code] = (row[code] || 0) + count;
      row.total += count;
    });

    const data = Array.from(monthRowMap.values());
    const facilities = Array.from(facilitySet);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        facilities,
      }
    });

  } catch (error) {
    console.error('Error fetching monthly visits:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch monthly visits data",
        message: error.message
      },
      { status: 500 }
    );
  }
}

