import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Get available missions for the date
    const availableMissionsQuery = `
      SELECT 
        m.id,
        m.title,
        m.description,
        m.category,
        m.points,
        m.target_value,
        m.unit,
        m.is_active,
        m.type,
        m.difficulty,
        m.icon,
        m.color,
        CASE 
          WHEN um.id IS NOT NULL THEN 'accepted'
          ELSE 'available'
        END as user_status,
        um.id as user_mission_id,
        um.status as user_mission_status,
        um.progress,
        um.mission_date
      FROM missions m
      LEFT JOIN user_missions um ON m.id = um.mission_id 
        AND um.user_id = ? 
        AND um.mission_date = ?
      WHERE m.is_active = 1
      ORDER BY m.category, m.difficulty, m.title
    `;

    const missions = await query(availableMissionsQuery, [userId, targetDate]);

    // Group missions by category
    const missionsByCategory = missions.reduce((acc, mission) => {
      const category = mission.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(mission);
      return acc;
    }, {});

    // Get user's accepted missions for the date
    const userMissionsQuery = `
      SELECT 
        um.id as user_mission_id,
        um.status,
        um.progress,
        um.current_value,
        um.mission_date,
        m.id as mission_id,
        m.title,
        m.description,
        m.category,
        m.points,
        m.target_value,
        m.icon,
        m.color,
        m.difficulty
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ? AND um.mission_date = ?
      ORDER BY um.created_at DESC
    `;

    const userMissions = await query(userMissionsQuery, [userId, targetDate]);

    // Calculate summary
    const summary = {
      total_available: missions.filter(m => m.user_status === 'available').length,
      total_accepted: missions.filter(m => m.user_status === 'accepted').length,
      total_completed: userMissions.filter(m => m.status === 'completed').length,
      total_active: userMissions.filter(m => m.status === 'active').length,
      total_points_earned: userMissions
        .filter(m => m.status === 'completed')
        .reduce((sum, m) => sum + (m.points || 0), 0),
      completion_rate: userMissions.length > 0 
        ? (userMissions.filter(m => m.status === 'completed').length / userMissions.length) * 100 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        available_missions: missions,
        user_missions: userMissions,
        missions_by_category: missionsByCategory,
        summary,
        target_date: targetDate
      }
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch missions by date',
        error: error.message
      },
      { status: 500 }
    );
  }
} 