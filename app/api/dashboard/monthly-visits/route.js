import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET monthly visits statistics with optional clinic filter
export async function GET(request) {
  try {
    // Get facility_code from query params if provided
    const { searchParams } = new URL(request.url);
    const facilityCode = searchParams.get('facility_code');
    
    console.log('Fetching monthly visits with facility filter:', facilityCode);
    
    // Build SQL query with optional facility filter
    let monthlyVisitsSql = `
      SELECT 
        DATE_FORMAT(visit_date, '%Y-%m') as month,
        COUNT(*) as count
      FROM visits
      WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    `;
    
    const params = [];
    
    // Add facility filter if provided
    if (facilityCode) {
      monthlyVisitsSql += ` AND facility_code = ?`;
      params.push(facilityCode);
    }
    
    monthlyVisitsSql += `
      GROUP BY DATE_FORMAT(visit_date, '%Y-%m')
      ORDER BY month ASC
    `;

    const monthlyData = await query(monthlyVisitsSql, params);

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

    console.log(`Monthly visits data points: ${formattedData.length} (facility: ${facilityCode || 'all'})`);

    return NextResponse.json({
      success: true,
      data: formattedData
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

