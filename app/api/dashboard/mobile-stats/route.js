import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get total mobile users
    const totalMobileUsersQuery = `
      SELECT COUNT(*) as count 
      FROM mobile_users
    `;
    
    // Get active mobile users (users who are active)
    const activeMobileUsersQuery = `
      SELECT COUNT(*) as count 
      FROM mobile_users 
      WHERE is_active = 1
    `;
    
    // Get gender distribution
    const genderDistributionQuery = `
      SELECT 
        gender,
        COUNT(*) as count
      FROM mobile_users 
      WHERE gender IS NOT NULL AND gender != ''
      GROUP BY gender
    `;
    
    // Get users who joined habit program
    const habitUsersQuery = `
      SELECT COUNT(*) as count 
      FROM mobile_users 
      WHERE wellness_program_joined = 1
    `;
    
    // Get new users this month
    const newUsersThisMonthQuery = `
      SELECT COUNT(*) as count 
      FROM mobile_users 
      WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) 
      AND MONTH(created_at) = MONTH(CURRENT_DATE())
    `;
    
    // Get users with activity level data
    const activityLevelQuery = `
      SELECT 
        activity_level,
        COUNT(*) as count
      FROM mobile_users 
      WHERE activity_level IS NOT NULL AND activity_level != ''
      GROUP BY activity_level
    `;
    
    // Get users with fitness goals
    const fitnessGoalQuery = `
      SELECT 
        fitness_goal,
        COUNT(*) as count
      FROM mobile_users 
      WHERE fitness_goal IS NOT NULL AND fitness_goal != ''
      GROUP BY fitness_goal
    `;
    
    // Get users who have health data (height/weight)
    const usersWithHealthDataQuery = `
      SELECT COUNT(DISTINCT mu.id) as count
      FROM mobile_users mu
      INNER JOIN health_data hd ON mu.id = hd.user_id
      WHERE hd.data_type IN ('height', 'weight')
    `;
    
    // Get habit activities statistics
    const habitActivitiesQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as active_users,
        SUM(points_earned) as total_points,
        AVG(target_frequency) as avg_frequency
      FROM user_habit_activities 
      WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    // Get fitness tracking statistics
    const fitnessTrackingQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT user_id) as active_users,
        SUM(calories_burned) as total_calories,
        SUM(duration_minutes) as total_minutes,
        SUM(steps) as total_steps
      FROM fitness_tracking 
      WHERE tracking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    
    // Get missions statistics
    const missionsQuery = `
      SELECT 
        COUNT(*) as total_missions,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_missions,
        COUNT(DISTINCT category) as mission_categories
      FROM missions
    `;
    
    // Get user missions statistics
    const userMissionsQuery = `
      SELECT 
        COUNT(*) as total_user_missions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_missions,
        COUNT(DISTINCT user_id) as users_with_missions
      FROM user_missions
    `;

    const [
      totalMobileUsersResult,
      activeMobileUsersResult,
      genderDistributionResult,
      habitUsersResult,
      newUsersThisMonthResult,
      activityLevelResult,
      fitnessGoalResult,
      usersWithHealthDataResult,
      habitActivitiesResult,
      fitnessTrackingResult,
      missionsResult,
      userMissionsResult
    ] = await Promise.all([
      query(totalMobileUsersQuery),
      query(activeMobileUsersQuery),
      query(genderDistributionQuery),
      query(habitUsersQuery),
      query(newUsersThisMonthQuery),
      query(activityLevelQuery),
      query(fitnessGoalQuery),
      query(usersWithHealthDataQuery),
      query(habitActivitiesQuery),
      query(fitnessTrackingQuery),
      query(missionsQuery),
      query(userMissionsQuery)
    ]);

    const totalMobileUsers = totalMobileUsersResult[0].count;
    const activeMobileUsers = activeMobileUsersResult[0].count;
    const habitUsers = habitUsersResult[0].count;
    const newUsersThisMonth = newUsersThisMonthResult[0].count;
    const usersWithHealthData = usersWithHealthDataResult[0].count;
    
    // Process additional mobile app data
    const habitActivities = habitActivitiesResult[0] || { total_activities: 0, active_users: 0, total_points: 0, avg_duration: 0 };
    const fitnessTracking = fitnessTrackingResult[0] || { total_sessions: 0, active_users: 0, total_calories: 0, total_minutes: 0, total_steps: 0 };
    const missions = missionsResult[0] || { total_missions: 0, active_missions: 0, mission_categories: 0 };
    const userMissions = userMissionsResult[0] || { total_user_missions: 0, completed_missions: 0, users_with_missions: 0 };
    
    // Process gender distribution
    const genderDistribution = {};
    genderDistributionResult.forEach(row => {
      // Handle both Indonesian and English gender formats
      if (row.gender === 'Laki-laki' || row.gender === 'male') {
        genderDistribution.male = (genderDistribution.male || 0) + row.count;
      } else if (row.gender === 'Perempuan' || row.gender === 'female') {
        genderDistribution.female = (genderDistribution.female || 0) + row.count;
      } else {
        // For any other gender values, store as is
        genderDistribution[row.gender] = row.count;
      }
    });
    
    // Process activity level distribution
    const activityLevelDistribution = {};
    activityLevelResult.forEach(row => {
      activityLevelDistribution[row.activity_level] = row.count;
    });
    
    // Process fitness goal distribution
    const fitnessGoalDistribution = {};
    fitnessGoalResult.forEach(row => {
      fitnessGoalDistribution[row.fitness_goal] = row.count;
    });

    // Calculate percentages
    const activePercentage = totalMobileUsers > 0 ? Math.round((activeMobileUsers / totalMobileUsers) * 100) : 0;
    const habitPercentage = totalMobileUsers > 0 ? Math.round((habitUsers / totalMobileUsers) * 100) : 0;
    const healthDataPercentage = totalMobileUsers > 0 ? Math.round((usersWithHealthData / totalMobileUsers) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalMobileUsers,
        activeMobileUsers,
        activePercentage,
        genderDistribution,
        habitUsers,
        habitPercentage,
        newUsersThisMonth,
        usersWithHealthData,
        healthDataPercentage,
        activityLevelDistribution,
        fitnessGoalDistribution,
        habitActivities,
        fitnessTracking,
        missions,
        userMissions
      }
    });
  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        message: "Gagal mengambil statistik pengguna mobile",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
