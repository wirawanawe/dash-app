import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log(`[${new Date().toISOString()}] Starting user missions status update via API`);
    console.log(`Current date: ${currentDate}`);

    // Find active user_missions where created_at date is different from current date
    const updateQuery = `
      UPDATE user_missions 
      SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE 
        status = 'active' 
        AND DATE(created_at) != ?
        AND DATE(created_at) < ?
    `;

    const result = await query(updateQuery, [currentDate, currentDate]);
    
    const updatedCount = result.affectedRows;
    console.log(`Updated ${updatedCount} user missions from active to completed`);

    // Get details of updated missions for response
    let updatedMissions = [];
    if (updatedCount > 0) {
      const detailsQuery = `
        SELECT 
          um.id,
          um.user_id,
          um.mission_id,
          um.created_at,
          um.completed_at,
          u.name as user_name,
          m.title as mission_title
        FROM user_missions um
        LEFT JOIN mobile_users u ON um.user_id = u.id
        LEFT JOIN missions m ON um.mission_id = m.id
        WHERE 
          um.status = 'completed' 
          AND DATE(um.completed_at) = ?
        ORDER BY um.completed_at DESC
      `;

      updatedMissions = await query(detailsQuery, [currentDate]);
    }

    // Get summary statistics
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM user_missions 
      GROUP BY status
    `;

    const stats = await query(statsQuery);
    
    console.log(`[${new Date().toISOString()}] User missions status update completed successfully`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} user missions`,
      data: {
        updatedCount,
        updatedMissions,
        currentDate,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Error updating user missions status via API:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get current statistics without updating
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM user_missions 
      GROUP BY status
    `;

    const stats = await query(statsQuery);
    
    // Get active missions that would be updated
    const currentDate = new Date().toISOString().split('T')[0];
    const pendingUpdateQuery = `
      SELECT 
        um.id,
        um.user_id,
        um.mission_id,
        um.created_at,
        u.name as user_name,
        m.title as mission_title
      FROM user_missions um
      LEFT JOIN mobile_users u ON um.user_id = u.id
      LEFT JOIN missions m ON um.mission_id = m.id
      WHERE 
        um.status = 'active' 
        AND DATE(um.created_at) != ?
        AND DATE(um.created_at) < ?
      ORDER BY um.created_at ASC
    `;

    const pendingUpdates = await query(pendingUpdateQuery, [currentDate, currentDate]);

    return NextResponse.json({
      success: true,
      data: {
        currentDate,
        statistics: stats,
        pendingUpdates: pendingUpdates,
        pendingCount: pendingUpdates.length
      }
    });

  } catch (error) {
    console.error('Error getting user missions status info:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 