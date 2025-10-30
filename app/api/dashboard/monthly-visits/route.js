import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET monthly visits statistics
export async function GET(request) {
  try {
    // Get the last 12 months of data
    const monthlyVisitsSql = `
      SELECT 
        DATE_FORMAT(visit_date, '%Y-%m') as month,
        COUNT(*) as count
      FROM visits
      WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(visit_date, '%Y-%m')
      ORDER BY month ASC
    `;

    const monthlyData = await query(monthlyVisitsSql);

    // Format data for chart
    const formattedData = monthlyData.map(item => ({
      month: item.month,
      count: parseInt(item.count),
      // Format bulan untuk display (e.g., "Jan 2024")
      label: new Date(item.month + '-01').toLocaleDateString('id-ID', { 
        month: 'short', 
        year: 'numeric' 
      })
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
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

