import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get new users this month
    const newUsersThisMonthSql = `
      SELECT COUNT(*) as count 
      FROM mobile_users 
      WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) 
      AND MONTH(created_at) = MONTH(CURRENT_DATE())
    `;
    
    // Get gender distribution
    const genderDistributionSql = `
      SELECT 
        gender,
        COUNT(*) as count
      FROM mobile_users 
      WHERE gender IS NOT NULL AND gender != ''
      GROUP BY gender
    `;
    
    // Get total active users
    const activeUsersSql = `
      SELECT COUNT(*) as count 
      FROM mobile_users 
      WHERE is_active = 1
    `;
    
    // Get total users
    const totalUsersSql = `
      SELECT COUNT(*) as count 
      FROM mobile_users
    `;

    const [newUsersResult, genderResult, activeUsersResult, totalUsersResult] = await Promise.all([
      query(newUsersThisMonthSql),
      query(genderDistributionSql),
      query(activeUsersSql),
      query(totalUsersSql)
    ]);

    const newUsersThisMonth = newUsersResult[0].count;
    const activeUsers = activeUsersResult[0].count;
    const totalUsers = totalUsersResult[0].count;
    
    // Process gender distribution
    const genderDistribution = {};
    genderResult.forEach(row => {
      genderDistribution[row.gender] = row.count;
    });

    return NextResponse.json({
      success: true,
      stats: {
        newUsersThisMonth,
        activeUsers,
        totalUsers,
        genderDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching mobile users stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mobile users stats', message: error.message },
      { status: 500 }
    );
  }
}
