import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days")) || 7;
    const year = searchParams.get("year");
    const month = searchParams.get("month"); // 1-12
    
    // Build WHERE clause for date filtering
    let dateFilter = '';
    const queryParams = [];
    
    if (year && month) {
      // Filter by specific year and month
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      if (yearInt && monthInt >= 1 && monthInt <= 12) {
        dateFilter = `AND YEAR(visit_date) = ? AND MONTH(visit_date) = ?`;
        queryParams.push(yearInt, monthInt);
      }
    } else if (year) {
      // Filter by year only
      const yearInt = parseInt(year);
      if (yearInt) {
        dateFilter = `AND YEAR(visit_date) = ?`;
        queryParams.push(yearInt);
      }
    } else {
      // Default: last N days
      dateFilter = `AND visit_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
      queryParams.push(days);
    }
    
    // Query to find patients who visited multiple facilities within the specified days
    // Group by patient_no_peserta (insurance card number) and count distinct facilities
    // Filter: all visits must be within the last N days AND within a 1-7 day window
    // Also check for NULL/empty values and handle them properly
    // Use COALESCE to handle NULL values in GROUP BY
    const sqlQuery = `
      SELECT 
        patient_no_peserta as card_number,
        COALESCE(MAX(patient_name), 'Nama tidak diketahui') as patient_name,
        COALESCE(MAX(patient_nik), '') as patient_nik,
        COUNT(DISTINCT facility_name) as facility_count,
        GROUP_CONCAT(DISTINCT facility_name ORDER BY facility_name SEPARATOR ', ') as facilities,
        MIN(visit_date) as first_visit_date,
        MAX(visit_date) as last_visit_date,
        DATEDIFF(MAX(visit_date), MIN(visit_date)) as days_between,
        COUNT(*) as total_visits
      FROM visits
      WHERE patient_no_peserta IS NOT NULL 
        AND patient_no_peserta != ''
        AND patient_no_peserta != 'null'
        AND TRIM(COALESCE(patient_no_peserta, '')) != ''
        AND facility_name IS NOT NULL
        AND facility_name != ''
        AND facility_name != 'null'
        AND TRIM(COALESCE(facility_name, '')) != ''
        AND visit_date IS NOT NULL
        ${dateFilter}
      GROUP BY patient_no_peserta
      HAVING facility_count >= 2
        AND days_between >= 0
        AND days_between <= 7
      ORDER BY facility_count DESC, total_visits DESC, last_visit_date DESC
      LIMIT 100
    `;
    
    const results = await query(sqlQuery, queryParams);
    
    // Log for debugging
    const filterInfo = year && month 
      ? `in ${year}-${String(month).padStart(2, '0')}`
      : year 
        ? `in year ${year}`
        : `in last ${days} days`;
    console.log(`[Multiple Facilities API] Found ${results.length} patients with multiple facilities ${filterInfo}`);
    
    // Get detailed visits for each patient
    const detailedResults = await Promise.all(
      results.map(async (patient) => {
        // Build date filter for visits query
        let visitsDateFilter = '';
        const visitsQueryParams = [patient.card_number];
        
        if (year && month) {
          visitsDateFilter = `AND YEAR(visit_date) = ? AND MONTH(visit_date) = ? AND visit_date BETWEEN ? AND ?`;
          visitsQueryParams.push(year, month, patient.first_visit_date, patient.last_visit_date);
        } else if (year) {
          visitsDateFilter = `AND YEAR(visit_date) = ? AND visit_date BETWEEN ? AND ?`;
          visitsQueryParams.push(year, patient.first_visit_date, patient.last_visit_date);
        } else {
          visitsDateFilter = `AND visit_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND visit_date BETWEEN ? AND ?`;
          visitsQueryParams.push(days, patient.first_visit_date, patient.last_visit_date);
        }
        
        const visitsQuery = `
          SELECT 
            id,
            visit_date,
            visit_time,
            facility_name,
            facility_code,
            clinic,
            room,
            doctor_name,
            diagnosis,
            complaint,
            status,
            visit_number,
            prescriptions
          FROM visits
          WHERE patient_no_peserta = ?
            ${visitsDateFilter}
            AND facility_name IS NOT NULL
            AND facility_name != ''
            AND TRIM(facility_name) != ''
          ORDER BY visit_date DESC, visit_time DESC
        `;
        
        const visits = await query(visitsQuery, visitsQueryParams);
        
        // Filter visits to only include those with facility_name and ensure we have multiple facilities
        const validVisits = (visits || []).filter(v => v.facility_name && v.facility_name.trim() !== '');
        
        // Get unique facilities from visits to verify
        const uniqueFacilities = [...new Set(validVisits.map(v => v.facility_name.trim()))];
        
        // Only return if patient has visits with multiple facilities
        if (uniqueFacilities.length >= 2) {
          return {
            ...patient,
            visits: validVisits,
            facilities: uniqueFacilities.join(', '),
            facility_count: uniqueFacilities.length
          };
        }
        
        return null;
      })
    );
    
    // Filter out null results
    const filteredResults = detailedResults.filter(patient => patient !== null);
    
    console.log(`[Multiple Facilities API] Returning ${filteredResults.length} valid patients with multiple facilities`);
    
    return NextResponse.json({
      success: true,
      data: filteredResults,
      total: filteredResults.length,
      period_days: days,
      filter: {
        year: year || null,
        month: month || null
      }
    });
    
  } catch (error) {
    console.error('[Multiple Facilities API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch patients with multiple facilities",
        message: error.message
      },
      { status: 500 }
    );
  }
}

