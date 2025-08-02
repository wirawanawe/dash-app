import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

// GET - Get quick actions for mobile app
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      const userId = payload.userId;

      // Get user's wellness program status
      let userWellness = { wellness_program_joined: false, fitness_goal: null, activity_level: null };
      try {
        const wellnessQuery = `
          SELECT wellness_program_joined, fitness_goal, activity_level
          FROM users 
          WHERE id = ?
        `;
        const wellnessResult = await query(wellnessQuery, [userId]);
        userWellness = wellnessResult[0] || userWellness;
      } catch (error) {
        console.log("🔍 Quick-actions: Wellness query failed, using defaults");
      }

      // Get user's recent activities to determine which quick actions to show
      let recentActivities = [];
      try {
        const recentActivitiesQuery = `
          SELECT 
            'water' as type,
            COUNT(*) as count,
            MAX(created_at) as last_activity
          FROM water_tracking 
          WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT 
            'meal' as type,
            COUNT(*) as count,
            MAX(created_at) as last_activity
          FROM meal_tracking 
          WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT 
            'fitness' as type,
            COUNT(*) as count,
            MAX(created_at) as last_activity
          FROM fitness_tracking 
          WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT 
            'mood' as type,
            COUNT(*) as count,
            MAX(created_at) as last_activity
          FROM mood_tracking 
          WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT 
            'sleep' as type,
            COUNT(*) as count,
            MAX(created_at) as last_activity
          FROM sleep_tracking 
          WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
        
        recentActivities = await query(recentActivitiesQuery, [userId, userId, userId, userId, userId]);
      } catch (error) {
        console.log("🔍 Quick-actions: Recent activities query failed, using empty array");
      }

      // Get today's summary to show priority actions
      let todayData = { water_intake: 0, calories: 0, steps: 0, exercise_minutes: 0 };
      try {
        const todaySummaryQuery = `
          SELECT 
            COALESCE(SUM(wt.amount_ml), 0) as water_intake,
            COALESCE(SUM(mt.calories), 0) as calories,
            COALESCE(SUM(ft.steps), 0) as steps,
            COALESCE(SUM(ft.exercise_minutes), 0) as exercise_minutes
          FROM users u
          LEFT JOIN water_tracking wt ON u.id = wt.user_id AND DATE(wt.tracking_date) = CURDATE()
          LEFT JOIN meal_tracking mt ON u.id = mt.user_id AND DATE(mt.meal_date) = CURDATE()
          LEFT JOIN fitness_tracking ft ON u.id = ft.user_id AND DATE(ft.tracking_date) = CURDATE()
          WHERE u.id = ?
          GROUP BY u.id
        `;
        
        const todaySummary = await query(todaySummaryQuery, [userId]);
        todayData = todaySummary[0] || todayData;
      } catch (error) {
        console.log("🔍 Quick-actions: Today summary query failed, using defaults");
      }

      // Define quick actions based on user's wellness program and recent activities
      const quickActions = [
        {
          id: "1",
          title: "Auto Fitness",
          subtitle: "Deteksi aktivitas otomatis",
          icon: "radar",
          color: "#38A169",
          gradient: ["#38A169", "#2F855A"],
          priority: 1,
          enabled: true,
          route: "RealtimeFitness"
        },
        {
          id: "2",
          title: "Log Meal",
          subtitle: "Catat asupan kalori harian",
          icon: "food-apple",
          color: "#38A169",
          gradient: ["#38A169", "#2F855A"],
          priority: 2,
          enabled: true,
          route: "MealLogging",
          today_count: todayData.calories || 0
        },
        {
          id: "3",
          title: "Track Water",
          subtitle: "Monitor konsumsi air minum",
          icon: "water",
          color: "#3182CE",
          gradient: ["#3182CE", "#2B6CB0"],
          priority: 3,
          enabled: true,
          route: "WaterTracking",
          today_count: todayData.water_intake || 0,
          target: 2000
        },
        {
          id: "4",
          title: "Log Exercise",
          subtitle: "Catat aktivitas fisik",
          icon: "dumbbell",
          color: "#E53E3E",
          gradient: ["#E53E3E", "#C53030"],
          priority: 4,
          enabled: true,
          route: "FitnessTracking",
          today_count: todayData.exercise_minutes || 0
        },
        {
          id: "5",
          title: "Mood Check",
          subtitle: "Monitor suasana hati",
          icon: "emoticon",
          color: "#D69E2E",
          gradient: ["#D69E2E", "#B7791F"],
          priority: 5,
          enabled: true,
          route: "MoodTracking"
        },
        {
          id: "6",
          title: "Sleep Track",
          subtitle: "Lacak pola tidur",
          icon: "sleep",
          color: "#9F7AEA",
          gradient: ["#9F7AEA", "#805AD5"],
          priority: 6,
          enabled: true,
          route: "SleepTracking"
        }
      ];

      // Sort by priority and add activity indicators
      const sortedQuickActions = quickActions
        .sort((a, b) => a.priority - b.priority)
        .map(action => {
          // Find recent activity for this action type
          const activityType = action.route.toLowerCase().replace('tracking', '').replace('logging', '');
          const recentActivity = recentActivities.find(activity => 
            activity.type === activityType
          );

          return {
            ...action,
            recent_activity: recentActivity ? {
              count: recentActivity.count,
              last_activity: recentActivity.last_activity
            } : null,
            has_recent_activity: recentActivity && recentActivity.count > 0
          };
        });

      return NextResponse.json({
        success: true,
        data: sortedQuickActions,
        user_wellness: {
          has_joined: userWellness.wellness_program_joined || false,
          fitness_goal: userWellness.fitness_goal,
          activity_level: userWellness.activity_level
        },
        today_summary: {
          water_intake: todayData.water_intake || 0,
          calories: todayData.calories || 0,
          steps: todayData.steps || 0,
          exercise_minutes: todayData.exercise_minutes || 0
        }
      });
          } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return NextResponse.json(
          {
            success: false,
            message: "Invalid token",
          },
          { status: 401 }
        );
      }
  } catch (error) {
    console.error("Error fetching quick actions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil quick actions",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 