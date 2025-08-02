import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get wellness data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const category = searchParams.get("category");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Get wellness activities completed by user
    let activitiesSql = `
      SELECT 
        id,
        user_id,
        activity_id,
        duration as duration_minutes,
        notes,
        completed_at,
        created_at,
        activity_name as title,
        activity_category as category,
        points_earned as points,
        activity_type as difficulty
      FROM wellness_activities
      WHERE user_id = ?
    `;
    let activitiesParams = [user_id];

    if (category) {
      activitiesSql += " AND activity_category = ?";
      activitiesParams.push(category);
    }

    if (start_date) {
      activitiesSql += " AND DATE(completed_at) >= ?";
      activitiesParams.push(start_date);
    }

    if (end_date) {
      activitiesSql += " AND DATE(completed_at) <= ?";
      activitiesParams.push(end_date);
    }

    activitiesSql += " ORDER BY completed_at DESC";

    const activities = await query(activitiesSql, activitiesParams);

    // Get mood tracking data
    let moodSql = `
      SELECT 
        id, user_id, mood_level as mood, energy_level, tracking_date, notes, created_at
      FROM mood_tracking
      WHERE user_id = ?
    `;
    let moodParams = [user_id];

    if (start_date) {
      moodSql += " AND DATE(tracking_date) >= ?";
      moodParams.push(start_date);
    }

    if (end_date) {
      moodSql += " AND DATE(tracking_date) <= ?";
      moodParams.push(end_date);
    }

    moodSql += " ORDER BY tracking_date DESC";

    const moodData = await query(moodSql, moodParams);

    // Get sleep tracking data
    let sleepSql = `
      SELECT 
        id, user_id, sleep_date, FLOOR(sleep_duration_minutes / 60) as sleep_hours, MOD(sleep_duration_minutes, 60) as sleep_minutes, sleep_quality, 
        bedtime, wake_time, notes, created_at
      FROM sleep_tracking
      WHERE user_id = ?
    `;
    let sleepParams = [user_id];

    if (start_date) {
      sleepSql += " AND DATE(sleep_date) >= ?";
      sleepParams.push(start_date);
    }

    if (end_date) {
      sleepSql += " AND DATE(sleep_date) <= ?";
      sleepParams.push(end_date);
    }

    sleepSql += " ORDER BY sleep_date DESC";

    const sleepData = await query(sleepSql, sleepParams);

    // Calculate wellness statistics
    const wellnessStats = {
      total_activities_completed: activities.length,
      total_points_earned: 0,
      total_duration_minutes: 0,
      average_mood_score: 0,
      average_sleep_hours: 0,
      category_breakdown: {},
      mood_distribution: {
        excellent: 0,
        good: 0,
        okay: 0,
        bad: 0,
        terrible: 0,
      },
      sleep_quality_distribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
    };

    // Process activities
    activities.forEach(activity => {
      wellnessStats.total_points_earned += activity.points || 0;
      wellnessStats.total_duration_minutes += activity.duration_minutes || 0;

      if (!wellnessStats.category_breakdown[activity.category]) {
        wellnessStats.category_breakdown[activity.category] = {
          count: 0,
          points: 0,
          duration: 0,
        };
      }
      wellnessStats.category_breakdown[activity.category].count++;
      wellnessStats.category_breakdown[activity.category].points += activity.points || 0;
      wellnessStats.category_breakdown[activity.category].duration += activity.duration_minutes || 0;
    });

    // Process mood data
    let totalMoodScore = 0;
    moodData.forEach(mood => {
      const moodScore = getMoodScore(mood.mood);
      totalMoodScore += moodScore;
      wellnessStats.mood_distribution[mood.mood]++;
    });

    if (moodData.length > 0) {
      wellnessStats.average_mood_score = totalMoodScore / moodData.length;
    }

    // Process sleep data
    let totalSleepHours = 0;
    sleepData.forEach(sleep => {
      const sleepHours = (sleep.sleep_hours || 0) + ((sleep.sleep_minutes || 0) / 60);
      totalSleepHours += sleepHours;
      wellnessStats.sleep_quality_distribution[sleep.sleep_quality]++;
    });

    if (sleepData.length > 0) {
      wellnessStats.average_sleep_hours = totalSleepHours / sleepData.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        activities,
        mood_data: moodData,
        sleep_data: sleepData,
        statistics: wellnessStats,
      },
    });
  } catch (error) {
    console.error("Error fetching wellness data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil wellness data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create wellness data entry
export async function POST(request) {
  try {
    const {
      user_id,
      activity_id,
      duration_minutes,
      notes,
      completed_at
    } = await request.json();

    if (!user_id || !activity_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan activity ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if activity exists
    const activityCheck = await query(
      "SELECT id, activity_name as title, points_earned as points FROM wellness_activities WHERE id = ?",
      [activity_id]
    );

    if (activityCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const activity = activityCheck[0];

    const sql = `
      INSERT INTO wellness_activities (
        user_id, activity_id, activity_name, activity_type, activity_category, duration, points_earned, notes, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    // Format the completed_at datetime properly for MySQL
    const formatDateTime = (dateString) => {
      if (!dateString) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      // Convert ISO string to MySQL datetime format
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const result = await query(sql, [
      user_id,
      activity_id,
      activity.title,
      'wellness',
      'general',
      duration_minutes || 30,
      activity.points || 0,
      notes || null,
      formatDateTime(completed_at),
    ]);

    return NextResponse.json({
      success: true,
      message: "Wellness data berhasil ditambahkan",
      data: {
        id: result.insertId,
        activity_title: activity.title,
        points_earned: activity.points,
      },
    });
  } catch (error) {
    console.error("Error creating wellness data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan wellness data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to convert mood to numeric score
function getMoodScore(mood) {
  const scores = {
    excellent: 5,
    good: 4,
    okay: 3,
    bad: 2,
    terrible: 1,
  };
  return scores[mood] || 0;
} 