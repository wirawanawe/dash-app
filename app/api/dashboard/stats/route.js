import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { responseCache } from "@/lib/cache";
import { apiRateLimiter } from "@/lib/rateLimiter";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

// GET - Get dashboard statistics
export async function GET(request) {
  // Rate limiting
  const rateLimitResult = await apiRateLimiter(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.message },
      { 
        status: rateLimitResult.status,
        headers: rateLimitResult.headers
      }
    );
  }

  // Check cache
  const cacheKey = responseCache.generateKey('GET', '/api/dashboard/stats', {});
  const cached = responseCache.get(cacheKey);
  if (cached) {
    const response = NextResponse.json(cached);
    Object.entries(rateLimitResult.headers || {}).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Cache', 'HIT');
    return response;
  }

  try {
    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthStart = startOfMonth.toISOString().split("T")[0];
    const monthEnd = endOfMonth.toISOString().split("T")[0];

    // Get today's visits
    const todayVisitsQuery = `
      SELECT COUNT(*) as count
      FROM visits 
      WHERE DATE(visit_date) = ?
    `;
    const todayVisitsResult = await query(todayVisitsQuery, [todayString]);
    const dailyVisits = todayVisitsResult[0]?.count || 0;

    // Get this month's visits
    const monthlyVisitsQuery = `
      SELECT COUNT(*) as count
      FROM visits 
      WHERE DATE(visit_date) BETWEEN ? AND ?
    `;
    const monthlyVisitsResult = await query(monthlyVisitsQuery, [monthStart, monthEnd]);
    const monthlyVisits = monthlyVisitsResult[0]?.count || 0;

    // Get active visits (visits with status 'Aktif')
    const activeVisitsQuery = `
      SELECT COUNT(*) as count
      FROM visits 
      WHERE status = 'Aktif'
    `;
    const activeVisitsResult = await query(activeVisitsQuery);
    const activeVisits = activeVisitsResult[0]?.count || 0;

    // Get total visits today (including completed)
    const totalVisitsTodayQuery = `
      SELECT COUNT(*) as count
      FROM visits 
      WHERE DATE(visit_date) = ?
    `;
    const totalVisitsTodayResult = await query(totalVisitsTodayQuery, [todayString]);
    const totalVisitsToday = totalVisitsTodayResult[0]?.count || 0;

    // Calculate average wait time (estimated based on active visits)
    const avgWaitTime = activeVisits > 0 ? Math.ceil(activeVisits * 15) : 0;

    // Get room statistics
    const roomStatsQuery = `
      SELECT 
        COUNT(*) as total_rooms,
        SUM(CASE WHEN room_status = 'occupied' THEN 1 ELSE 0 END) as occupied_rooms,
        SUM(CASE WHEN room_status = 'available' THEN 1 ELSE 0 END) as available_rooms
      FROM clinic_rooms 
      WHERE is_active = 1
    `;
    const roomStatsResult = await query(roomStatsQuery);
    const roomStats = roomStatsResult[0] || { total_rooms: 0, occupied_rooms: 0, available_rooms: 0 };

    // Get doctor statistics
    const doctorStatsQuery = `
      SELECT COUNT(*) as total_doctors
      FROM doctors 
      WHERE is_available_for_consultation = 1
    `;
    const doctorStatsResult = await query(doctorStatsQuery);
    const totalDoctors = doctorStatsResult[0]?.total_doctors || 0;

    // Get patient statistics
    const patientStatsQuery = `
      SELECT COUNT(*) as total_patients
      FROM patients 
    `;
    const patientStatsResult = await query(patientStatsQuery);
    const totalPatients = patientStatsResult[0]?.total_patients || 0;

    // Calculate trends (simple comparison with previous period)
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthStart = previousMonthStart.toISOString().split("T")[0];
    const prevMonthEnd = previousMonthEnd.toISOString().split("T")[0];

    const previousMonthVisitsQuery = `
      SELECT COUNT(*) as count
      FROM visits 
      WHERE DATE(visit_date) BETWEEN ? AND ?
    `;
    const previousMonthVisitsResult = await query(previousMonthVisitsQuery, [prevMonthStart, prevMonthEnd]);
    const previousMonthVisits = previousMonthVisitsResult[0]?.count || 0;

    // Calculate percentage change
    const monthlyChange = previousMonthVisits > 0 
      ? Math.round(((monthlyVisits - previousMonthVisits) / previousMonthVisits) * 100)
      : 0;

    const dailyChange = dailyVisits > 0 ? 12 : 0; // Simplified for now

    const stats = {
      dailyVisits,
      monthlyVisits,
      activeVisits,
      totalVisitsToday,
      avgWaitTime,
      roomStats,
      totalDoctors,
      totalPatients,
      trends: {
        monthlyChange,
        dailyChange
      }
    };

    const responseData = {
      success: true,
      data: stats,
      period: {
        today: todayString,
        monthStart,
        monthEnd
      }
    };

    // Cache the response (1 minute TTL for stats)
    responseCache.set(cacheKey, responseData, 60 * 1000);

    const response = NextResponse.json(responseData);
    Object.entries(rateLimitResult.headers || {}).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil statistik dashboard",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 