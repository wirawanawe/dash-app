import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate that userId is a number
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get user basic info from mobile_users table
    let userResult = [];
    try {
      const userQuery = `
        SELECT id, name, email, wellness_program_joined, wellness_join_date, wellness_program_duration,
               date_of_birth, gender, activity_level, fitness_goal
        FROM mobile_users 
        WHERE id = ?
      `;
      userResult = await query(userQuery, [numericUserId]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json(
        { success: false, message: 'Database error while fetching user data', error: error.message },
        { status: 500 }
      );
    }
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    
    // Calculate age from date_of_birth
    let age = null;
    if (user.date_of_birth) {
      const birthDate = new Date(user.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Calculate actual days since joining wellness program
    let daysSinceJoining = 0;
    if (user.wellness_join_date) {
      try {
        const joinDate = new Date(user.wellness_join_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - joinDate.getTime());
        daysSinceJoining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (error) {
        console.error('Error calculating days since joining wellness program:', error);
      }
    }

    // Calculate remaining days in program
    let daysRemaining = 0;
    if (user.wellness_program_duration && daysSinceJoining > 0) {
      daysRemaining = Math.max(0, user.wellness_program_duration - daysSinceJoining);
    }

    // Get wellness activities with better error handling
    let activities = [];
    try {
      const activitiesQuery = `
        SELECT 
          id, activity_name as title, activity_type, activity_category as category,
          duration as duration_minutes, points_earned as points, notes,
          completed_at, created_at
        FROM wellness_activities 
        WHERE user_id = ?
        ORDER BY completed_at DESC
        LIMIT 100
      `;
      activities = await query(activitiesQuery, [numericUserId]);
    } catch (error) {
      console.error('Error fetching wellness activities:', error);
      // Continue with empty activities array
    }

    // Get user missions with better error handling and fallback columns
    let missions = [];
    try {
      // First try with all columns
      const missionsQuery = `
        SELECT 
          um.id, um.mission_id, um.status, um.progress, 
          COALESCE(um.current_value, 0) as current_value,
          COALESCE(um.start_date, um.created_at) as start_date, 
          COALESCE(um.completed_date, um.completed_at) as completed_date, 
          COALESCE(um.points_earned, 0) as points_earned, 
          COALESCE(um.streak_count, 0) as streak_count,
          um.last_completed_date, um.notes,
          m.title, m.description, m.category, m.type, m.target_value, m.unit, m.points
        FROM user_missions um
        LEFT JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = ?
        ORDER BY um.created_at DESC
      `;
      missions = await query(missionsQuery, [numericUserId]);
    } catch (error) {
      console.error('Error fetching user missions:', error);
      // Try with minimal columns if the full query fails
      try {
        const fallbackMissionsQuery = `
          SELECT 
            um.id, um.mission_id, um.status, um.progress, 
            um.created_at as start_date, um.completed_at as completed_date,
            um.notes,
            m.title, m.description, m.category, m.type, m.target_value, m.unit, m.points
          FROM user_missions um
          LEFT JOIN missions m ON um.mission_id = m.id
          WHERE um.user_id = ?
          ORDER BY um.created_at DESC
        `;
        missions = await query(fallbackMissionsQuery, [numericUserId]);
      } catch (fallbackError) {
        console.error('Error fetching user missions with fallback:', fallbackError);
        // Continue with empty missions array
      }
    }

    // Get tracking data (water, mood, sleep, etc.) with better error handling
    let trackingData = [];
    try {
      const trackingQuery = `
        SELECT 
          'water' as type,
          COALESCE(water_intake, amount_ml) as value,
          COALESCE(target_water, 2000) as target,
          created_at as date
        FROM water_tracking 
        WHERE user_id = ?
        UNION ALL
        SELECT 
          'mood' as type,
          COALESCE(mood_score, 
            CASE mood_level
              WHEN 'very_happy' THEN 10
              WHEN 'happy' THEN 8
              WHEN 'neutral' THEN 5
              WHEN 'sad' THEN 3
              WHEN 'very_sad' THEN 1
              ELSE 5
            END
          ) as value,
          10 as target,
          created_at as date
        FROM mood_tracking 
        WHERE user_id = ?
        UNION ALL
        SELECT 
          'sleep' as type,
          COALESCE(sleep_hours, 
            CASE 
              WHEN sleep_duration_minutes IS NOT NULL THEN sleep_duration_minutes / 60.0
              WHEN bedtime IS NOT NULL AND wake_time IS NOT NULL THEN 
                (TIME_TO_SEC(wake_time) - TIME_TO_SEC(bedtime)) / 3600.0
              ELSE 0
            END
          ) as value,
          8 as target,
          created_at as date
        FROM sleep_tracking 
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 50
      `;
      trackingData = await query(trackingQuery, [numericUserId, numericUserId, numericUserId]);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      // Try individual queries if the union fails
      try {
        const waterQuery = `
          SELECT 
            'water' as type,
            COALESCE(water_intake, amount_ml) as value,
            COALESCE(target_water, 2000) as target,
            created_at as date
          FROM water_tracking 
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 20
        `;
        const waterData = await query(waterQuery, [numericUserId]);
        
        const moodQuery = `
          SELECT 
            'mood' as type,
            COALESCE(mood_score, 
              CASE mood_level
                WHEN 'very_happy' THEN 10
                WHEN 'happy' THEN 8
                WHEN 'neutral' THEN 5
                WHEN 'sad' THEN 3
                WHEN 'very_sad' THEN 1
                ELSE 5
              END
            ) as value,
            10 as target,
            created_at as date
          FROM mood_tracking 
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 20
        `;
        const moodData = await query(moodQuery, [numericUserId]);
        
        const sleepQuery = `
          SELECT 
            'sleep' as type,
            COALESCE(sleep_hours, 
              CASE 
                WHEN sleep_duration_minutes IS NOT NULL THEN sleep_duration_minutes / 60.0
                WHEN bedtime IS NOT NULL AND wake_time IS NOT NULL THEN 
                  (TIME_TO_SEC(wake_time) - TIME_TO_SEC(bedtime)) / 3600.0
                ELSE 0
              END
            ) as value,
            8 as target,
            created_at as date
          FROM sleep_tracking 
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 20
        `;
        const sleepData = await query(sleepQuery, [numericUserId]);
        
        trackingData = [...waterData, ...moodData, ...sleepData].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        ).slice(0, 50);
      } catch (individualError) {
        console.error('Error fetching individual tracking data:', individualError);
        // Continue with empty tracking data array
      }
    }

    // Calculate statistics with null checks
    const totalActivities = activities.length || 0;
    const completedMissions = missions.filter(m => m.status === 'completed').length || 0;
    const totalMissions = missions.length || 0;
    const totalPoints = missions.reduce((sum, m) => sum + (m.points_earned || 0), 0) || 0;
    
    // Calculate weekly progress
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weeklyActivities = activities.filter(a => 
      a.completed_at && new Date(a.completed_at) >= lastWeek
    ).length || 0;

    // Calculate activity distribution with null checks
    const activityDistribution = {};
    activities.forEach(activity => {
      const category = activity.category || 'other';
      activityDistribution[category] = (activityDistribution[category] || 0) + 1;
    });

    // Calculate tracking averages with null checks
    const waterData = trackingData.filter(t => t.type === 'water') || [];
    const moodData = trackingData.filter(t => t.type === 'mood') || [];
    const sleepData = trackingData.filter(t => t.type === 'sleep') || [];

    const avgWaterIntake = waterData.length > 0 
      ? waterData.reduce((sum, w) => sum + (w.value || 0), 0) / waterData.length 
      : 0;
    const avgMoodScore = moodData.length > 0 
      ? moodData.reduce((sum, m) => sum + (m.value || 0), 0) / moodData.length 
      : 0;
    const avgSleepHours = sleepData.length > 0 
      ? sleepData.reduce((sum, s) => sum + (s.value || 0), 0) / sleepData.length 
      : 0;

    // Calculate completion rate
    const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // Get recent activities (last 10)
    const recentActivities = activities.slice(0, 10) || [];

    // Calculate wellness score with better logic
    let wellnessScore = 0;
    let scoreFactors = 0;

    // Activity completion factor (weekly activities)
    if (weeklyActivities > 0) {
      wellnessScore += Math.min((weeklyActivities / 7) * 100, 100);
      scoreFactors++;
    }

    // Mission completion factor
    if (totalMissions > 0) {
      wellnessScore += completionRate;
      scoreFactors++;
    }

    // Water intake factor
    if (avgWaterIntake > 0) {
      const waterScore = Math.min((avgWaterIntake / 2000) * 100, 100); // 2L target
      wellnessScore += waterScore;
      scoreFactors++;
    }

    // Sleep factor
    if (avgSleepHours > 0) {
      const sleepScore = Math.min((avgSleepHours / 8) * 100, 100); // 8 hours target
      wellnessScore += sleepScore;
      scoreFactors++;
    }

    // Mood factor
    if (avgMoodScore > 0) {
      const moodScore = (avgMoodScore / 10) * 100; // 10 point scale
      wellnessScore += moodScore;
      scoreFactors++;
    }

    const finalWellnessScore = scoreFactors > 0 ? Math.round(wellnessScore / scoreFactors) : 0;

    return NextResponse.json({
      success: true,
      user: {
        id: numericUserId,
        name: user.name || 'Nama tidak tersedia',
        email: user.email || 'Email tidak tersedia',
        wellness_program_joined: user.wellness_program_joined || false,
        wellness_join_date: user.wellness_join_date,
        wellness_program_duration: user.wellness_program_duration,
        days_since_joining: daysSinceJoining,
        days_remaining: daysRemaining,
        age: age,
        gender: user.gender,
        activity_level: user.activity_level,
        fitness_goal: user.fitness_goal
      },
      progress: {
        totalActivities,
        completedMissions,
        totalMissions,
        totalPoints,
        weeklyActivities,
        completionRate,
        wellnessScore: finalWellnessScore,
        activityDistribution,
        recentActivities,
        missions,
        trackingData: {
          avgWaterIntake: Math.round(avgWaterIntake),
          avgMoodScore: Math.round(avgMoodScore * 10) / 10,
          avgSleepHours: Math.round(avgSleepHours * 10) / 10,
          waterData: waterData.slice(0, 7), // Last 7 days
          moodData: moodData.slice(0, 7),
          sleepData: sleepData.slice(0, 7)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching wellness progress:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch wellness progress',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 