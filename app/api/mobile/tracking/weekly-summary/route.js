import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get weekly summary data (accumulated daily data for 7 days)
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Calculate date range for the last 7 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get nutrition data for the week
    const nutritionSql = `
      SELECT 
        tracking_date as date,
        SUM(calories) as total_calories,
        COUNT(*) as meal_count
      FROM meal_tracking
      WHERE user_id = ? AND tracking_date BETWEEN ? AND ?
      GROUP BY tracking_date
    `;

    // Get water intake data for the week
    const waterSql = `
      SELECT 
        tracking_date as date,
        SUM(amount_ml) as total_ml,
        COUNT(*) as entries
      FROM water_tracking
      WHERE user_id = ? AND tracking_date BETWEEN ? AND ?
      GROUP BY tracking_date
    `;

    // Get fitness data for the week
    const fitnessSql = `
      SELECT 
        tracking_date as date,
        SUM(steps) as total_steps,
        SUM(duration_minutes) as total_exercise_minutes,
        SUM(distance_km) as total_distance_km
      FROM fitness_tracking
      WHERE user_id = ? AND tracking_date BETWEEN ? AND ?
      GROUP BY tracking_date
    `;

    // Get sleep data for the week
    const sleepSql = `
      SELECT 
        tracking_date as date,
        SUM(sleep_hours) as total_hours,
        AVG(sleep_quality) as avg_quality
      FROM sleep_tracking
      WHERE user_id = ? AND tracking_date BETWEEN ? AND ?
      GROUP BY tracking_date
    `;

    // Execute all queries
    const [nutritionData, waterData, fitnessData, sleepData] = await Promise.all([
      query(nutritionSql, [user_id, startDate, endDate]),
      query(waterSql, [user_id, startDate, endDate]),
      query(fitnessSql, [user_id, startDate, endDate]),
      query(sleepSql, [user_id, startDate, endDate])
    ]);

    // Calculate weekly totals
    const weeklyTotals = {
      calories: 0,
      water_ml: 0,
      steps: 0,
      exercise_minutes: 0,
      distance_km: 0,
      sleep_hours: 0,
      meal_count: 0,
      days_with_activity: 0
    };

    // Process nutrition data
    nutritionData.forEach(day => {
      weeklyTotals.calories += day.total_calories || 0;
      weeklyTotals.meal_count += day.meal_count || 0;
    });

    // Process water data
    waterData.forEach(day => {
      weeklyTotals.water_ml += day.total_ml || 0;
    });

    // Process fitness data
    fitnessData.forEach(day => {
      weeklyTotals.steps += day.total_steps || 0;
      weeklyTotals.exercise_minutes += day.total_exercise_minutes || 0;
      weeklyTotals.distance_km += day.total_distance_km || 0;
    });

    // Process sleep data
    sleepData.forEach(day => {
      weeklyTotals.sleep_hours += day.total_hours || 0;
    });

    // Calculate days with activity (any data recorded)
    const allDates = new Set([
      ...nutritionData.map(d => d.date),
      ...waterData.map(d => d.date),
      ...fitnessData.map(d => d.date),
      ...sleepData.map(d => d.date)
    ]);
    weeklyTotals.days_with_activity = allDates.size;

    // Calculate averages
    const weeklyAverages = {
      calories_per_day: weeklyTotals.days_with_activity > 0 ? Math.round(weeklyTotals.calories / weeklyTotals.days_with_activity) : 0,
      water_ml_per_day: weeklyTotals.days_with_activity > 0 ? Math.round(weeklyTotals.water_ml / weeklyTotals.days_with_activity) : 0,
      steps_per_day: weeklyTotals.days_with_activity > 0 ? Math.round(weeklyTotals.steps / weeklyTotals.days_with_activity) : 0,
      exercise_minutes_per_day: weeklyTotals.days_with_activity > 0 ? Math.round(weeklyTotals.exercise_minutes / weeklyTotals.days_with_activity) : 0,
      distance_km_per_day: weeklyTotals.days_with_activity > 0 ? Math.round(weeklyTotals.distance_km * 100) / 100 : 0,
      sleep_hours_per_day: weeklyTotals.days_with_activity > 0 ? Math.round(weeklyTotals.sleep_hours * 10) / 10 : 0
    };

    // Calculate wellness score based on weekly averages
    const wellnessScore = calculateWeeklyWellnessScore(weeklyAverages);

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate,
          days: 7
        },
        weekly_totals: weeklyTotals,
        weekly_averages: weeklyAverages,
        wellness_score: wellnessScore,
        daily_breakdown: {
          nutrition: nutritionData,
          water: waterData,
          fitness: fitnessData,
          sleep: sleepData
        }
      },
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil weekly summary",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

function calculateWeeklyWellnessScore(averages) {
  let score = 0;
  
  // Steps score (max 25 points) - target: 10,000 steps per day
  const stepsScore = Math.min((averages.steps_per_day / 10000) * 25, 25);
  score += stepsScore;
  
  // Exercise score (max 25 points) - target: 30 minutes per day
  const exerciseScore = Math.min((averages.exercise_minutes_per_day / 30) * 25, 25);
  score += exerciseScore;
  
  // Water intake score (max 25 points) - target: 2000ml per day
  const waterScore = Math.min((averages.water_ml_per_day / 2000) * 25, 25);
  score += waterScore;
  
  // Calories score (max 25 points) - target: 2000 calories per day
  const calorieScore = averages.calories_per_day > 0 ? Math.min((averages.calories_per_day / 2000) * 25, 25) : 0;
  score += calorieScore;
  
  return Math.round(score);
} 