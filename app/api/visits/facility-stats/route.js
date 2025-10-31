import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET visit statistics grouped by facility
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, total, monthly, today
    
    // Get date range for monthly stats
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthStart = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
    const monthEnd = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

    let sql = "";
    let params = [];

    if (type === "total") {
      // Total visits by facility (all time)
      sql = `
        SELECT 
          facility_code as facilityCode,
          facility_name as facilityName,
          COUNT(*) as count
        FROM visits
        WHERE facility_code IS NOT NULL AND facility_code != ''
        GROUP BY facility_code, facility_name
        ORDER BY count DESC
      `;
    } else if (type === "monthly") {
      // Monthly visits by facility
      sql = `
        SELECT 
          facility_code as facilityCode,
          facility_name as facilityName,
          COUNT(*) as count
        FROM visits
        WHERE facility_code IS NOT NULL AND facility_code != ''
          AND DATE(visit_date) >= ? AND DATE(visit_date) <= ?
        GROUP BY facility_code, facility_name
        ORDER BY count DESC
      `;
      params = [monthStart, monthEnd];
    } else if (type === "today") {
      // Today's visits by facility
      sql = `
        SELECT 
          facility_code as facilityCode,
          facility_name as facilityName,
          COUNT(*) as count
        FROM visits
        WHERE facility_code IS NOT NULL AND facility_code != ''
          AND DATE(visit_date) = ?
        GROUP BY facility_code, facility_name
        ORDER BY count DESC
      `;
      params = [todayString];
    } else {
      // All stats
      const [totalStats, monthlyStats, todayStats] = await Promise.all([
        query(`
          SELECT 
            facility_code as facilityCode,
            facility_name as facilityName,
            COUNT(*) as count
          FROM visits
          WHERE facility_code IS NOT NULL AND facility_code != ''
          GROUP BY facility_code, facility_name
          ORDER BY count DESC
        `, []),
        query(`
          SELECT 
            facility_code as facilityCode,
            facility_name as facilityName,
            COUNT(*) as count
          FROM visits
          WHERE facility_code IS NOT NULL AND facility_code != ''
            AND DATE(visit_date) >= ? AND DATE(visit_date) <= ?
          GROUP BY facility_code, facility_name
          ORDER BY count DESC
        `, [monthStart, monthEnd]),
        query(`
          SELECT 
            facility_code as facilityCode,
            facility_name as facilityName,
            COUNT(*) as count
          FROM visits
          WHERE facility_code IS NOT NULL AND facility_code != ''
            AND DATE(visit_date) = ?
          GROUP BY facility_code, facility_name
          ORDER BY count DESC
        `, [todayString])
      ]);

      // Merge all stats by facility
      const facilityMap = new Map();
      
      // Add total stats
      totalStats.forEach(stat => {
        facilityMap.set(stat.facilityCode, {
          facilityCode: stat.facilityCode,
          facilityName: stat.facilityName,
          total: parseInt(stat.count),
          monthly: 0,
          today: 0
        });
      });
      
      // Add monthly stats
      monthlyStats.forEach(stat => {
        const existing = facilityMap.get(stat.facilityCode);
        if (existing) {
          existing.monthly = parseInt(stat.count);
        } else {
          // Facility has monthly visits but no total (rare edge case)
          facilityMap.set(stat.facilityCode, {
            facilityCode: stat.facilityCode,
            facilityName: stat.facilityName,
            total: 0,
            monthly: parseInt(stat.count),
            today: 0
          });
        }
      });
      
      // Add today stats
      todayStats.forEach(stat => {
        const existing = facilityMap.get(stat.facilityCode);
        if (existing) {
          existing.today = parseInt(stat.count);
        } else {
          // Facility has today visits but no total (rare edge case)
          facilityMap.set(stat.facilityCode, {
            facilityCode: stat.facilityCode,
            facilityName: stat.facilityName,
            total: 0,
            monthly: 0,
            today: parseInt(stat.count)
          });
        }
      });
      
      const allStats = Array.from(facilityMap.values());
      
      return NextResponse.json({
        success: true,
        data: allStats
      });
    }

    const stats = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      data: stats.map(stat => ({
        facilityCode: stat.facilityCode,
        facilityName: stat.facilityName,
        count: parseInt(stat.count)
      }))
    });

  } catch (error) {
    console.error('Error fetching facility stats:', error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil statistik faskes",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

