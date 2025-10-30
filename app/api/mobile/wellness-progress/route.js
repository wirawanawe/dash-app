import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let whereParams = [];

    if (search) {
      whereClause += ' AND (mu.name LIKE ? OR mu.email LIKE ?)';
      whereParams.push(`%${search}%`, `%${search}%`);
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
    const countResult = await query(countSql, whereParams);
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
        0 as wellness_activities_count,
        0 as user_missions_count,
        0 as completed_missions_count,
        0 as total_points,
        0 as avg_water_intake,
        0 as avg_sleep_hours,
        0 as avg_mood_score
      FROM mobile_users mu
      ${whereClause}
      ORDER BY mu.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Add pagination parameters
    const queryParams = [...whereParams, limit, offset];

    // Use raw query to avoid parameter binding issues
    const finalSql = sql.replace(/\?/g, (match, index) => {
      const param = queryParams.shift();
      if (typeof param === 'string') {
        return `'${param}'`;
      }
      return param;
    });

    const users = await rawQuery(finalSql);

    // Calculate wellness score for each user
    const usersWithScore = users.map(user => {
      // Calculate actual days since joining wellness program
      let daysSinceJoining = 0;
      if (user.wellness_join_date) {
        try {
          const joinDate = new Date(user.wellness_join_date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - joinDate.getTime());
          daysSinceJoining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {

        }
      }

      // Calculate remaining days in program
      let daysRemaining = 0;
      if (user.wellness_program_duration && daysSinceJoining > 0) {
        daysRemaining = Math.max(0, user.wellness_program_duration - daysSinceJoining);
      }

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
        days_since_joining: daysSinceJoining,
        days_remaining: daysRemaining,
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
