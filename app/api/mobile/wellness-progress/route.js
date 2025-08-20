import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (mu.name LIKE ? OR mu.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status === 'active') {
      whereClause += ' AND mu.wellness_program_joined = 1';
    } else if (status === 'inactive') {
      whereClause += ' AND (mu.wellness_program_joined = 0 OR mu.wellness_program_joined IS NULL)';
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM mobile_users mu
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get users with wellness progress summary
    const sql = `
      SELECT 
        mu.id,
        mu.name,
        mu.email,
        mu.wellness_program_joined,
        mu.wellness_join_date,
        mu.wellness_program_duration,
        mu.date_of_birth,
        mu.gender,
        mu.activity_level,
        mu.fitness_goal,
        mu.weight,
        mu.height,
        mu.created_at,
        COALESCE(activity_stats.total_activities, 0) as wellness_activities_count,
        COALESCE(mission_stats.total_missions, 0) as user_missions_count,
        COALESCE(mission_stats.completed_missions, 0) as completed_missions_count,
        COALESCE(mission_stats.total_points, 0) as total_points,
        COALESCE(tracking_stats.avg_water_intake, 0) as avg_water_intake,
        COALESCE(tracking_stats.avg_sleep_hours, 0) as avg_sleep_hours,
        COALESCE(tracking_stats.avg_mood_score, 0) as avg_mood_score
      FROM mobile_users mu
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_activities
        FROM user_wellness_activities
        WHERE completed_at IS NOT NULL
        GROUP BY user_id
      ) activity_stats ON mu.id = activity_stats.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_missions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
          SUM(points_earned) as total_points
        FROM user_missions
        GROUP BY user_id
      ) mission_stats ON mu.id = mission_stats.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          AVG(COALESCE(water_intake, amount_ml)) as avg_water_intake
        FROM water_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY user_id
      ) water_stats ON mu.id = water_stats.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          AVG(COALESCE(sleep_hours, 
            CASE 
              WHEN sleep_duration_minutes IS NOT NULL THEN sleep_duration_minutes / 60.0
              WHEN bedtime IS NOT NULL AND wake_time IS NOT NULL THEN 
                (TIME_TO_SEC(wake_time) - TIME_TO_SEC(bedtime)) / 3600.0
              ELSE 0
            END
          )) as avg_sleep_hours
        FROM sleep_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY user_id
      ) sleep_stats ON mu.id = sleep_stats.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          AVG(COALESCE(mood_score, 
            CASE mood_level
              WHEN 'very_happy' THEN 10
              WHEN 'happy' THEN 8
              WHEN 'neutral' THEN 5
              WHEN 'sad' THEN 3
              WHEN 'very_sad' THEN 1
              ELSE 5
            END
          )) as avg_mood_score
        FROM mood_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY user_id
      ) mood_stats ON mu.id = mood_stats.user_id
      LEFT JOIN (
        SELECT 
          water_stats.user_id,
          water_stats.avg_water_intake,
          sleep_stats.avg_sleep_hours,
          mood_stats.avg_mood_score
        FROM (
          SELECT 
            user_id,
            AVG(COALESCE(water_intake, amount_ml)) as avg_water_intake
          FROM water_tracking
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY user_id
        ) water_stats
        LEFT JOIN (
          SELECT 
            user_id,
            AVG(COALESCE(sleep_hours, 
              CASE 
                WHEN sleep_duration_minutes IS NOT NULL THEN sleep_duration_minutes / 60.0
                WHEN bedtime IS NOT NULL AND wake_time IS NOT NULL THEN 
                  (TIME_TO_SEC(wake_time) - TIME_TO_SEC(bedtime)) / 3600.0
                ELSE 0
              END
            )) as avg_sleep_hours
          FROM sleep_tracking
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY user_id
        ) sleep_stats ON water_stats.user_id = sleep_stats.user_id
        LEFT JOIN (
          SELECT 
            user_id,
            AVG(COALESCE(mood_score, 
              CASE mood_level
                WHEN 'very_happy' THEN 10
                WHEN 'happy' THEN 8
                WHEN 'neutral' THEN 5
                WHEN 'sad' THEN 3
                WHEN 'very_sad' THEN 1
                ELSE 5
              END
            )) as avg_mood_score
          FROM mood_tracking
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY user_id
        ) mood_stats ON water_stats.user_id = mood_stats.user_id
      ) tracking_stats ON mu.id = tracking_stats.user_id
      ${whereClause}
      ORDER BY mu.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Add pagination parameters
    params.push(limit, offset);

    const users = await query(sql, params);

    // Calculate wellness score for each user
    const usersWithScore = users.map(user => {
      let wellnessScore = 0;
      let scoreFactors = 0;

      // Activity completion factor
      if (user.wellness_activities_count > 0) {
        wellnessScore += Math.min((user.wellness_activities_count / 10) * 100, 100);
        scoreFactors++;
      }

      // Mission completion factor
      if (user.user_missions_count > 0) {
        const completionRate = (user.completed_missions_count / user.user_missions_count) * 100;
        wellnessScore += completionRate;
        scoreFactors++;
      }

      // Water intake factor
      if (user.avg_water_intake > 0) {
        const waterScore = Math.min((user.avg_water_intake / 2000) * 100, 100);
        wellnessScore += waterScore;
        scoreFactors++;
      }

      // Sleep factor
      if (user.avg_sleep_hours > 0) {
        const sleepScore = Math.min((user.avg_sleep_hours / 8) * 100, 100);
        wellnessScore += sleepScore;
        scoreFactors++;
      }

      // Mood factor
      if (user.avg_mood_score > 0) {
        const moodScore = (user.avg_mood_score / 10) * 100;
        wellnessScore += moodScore;
        scoreFactors++;
      }

      const finalWellnessScore = scoreFactors > 0 ? Math.round(wellnessScore / scoreFactors) : 0;

      return {
        ...user,
        wellness_score: finalWellnessScore
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithScore,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching wellness progress list:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch wellness progress list',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
