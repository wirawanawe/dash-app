import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

/**
 * Calculate fatigue score based on multiple factors
 * Score ranges from 0 (severe fatigue) to 100 (excellent condition)
 */
function calculateFatigueScore(data) {
  const {
    sleep_hours,
    sleep_quality,
    mood_level,
    stress_level,
    energy_level,
    focus_level,
    physical_activity,
    activity_type,
    caffeine_intake
  } = data;

  // Normalize sleep hours (optimal: 7-9 hours)
  let sleepScore = 0;
  if (sleep_hours >= 7 && sleep_hours <= 9) {
    sleepScore = 10;
  } else if (sleep_hours >= 6 && sleep_hours < 7) {
    sleepScore = 8;
  } else if (sleep_hours >= 9 && sleep_hours <= 10) {
    sleepScore = 8;
  } else if (sleep_hours >= 5 && sleep_hours < 6) {
    sleepScore = 6;
  } else {
    sleepScore = 4;
  }

  // Normalize physical activity
  let activityScore = 0;
  if (activity_type === 'steps') {
    // Normalize steps (0-15000 steps)
    activityScore = Math.min((physical_activity / 15000) * 10, 10);
  } else {
    // Normalize minutes (0-60 minutes)
    activityScore = Math.min((physical_activity / 60) * 10, 10);
  }

  // Caffeine penalty (too much caffeine indicates dependency/fatigue)
  const caffeinePenalty = Math.min(caffeine_intake * 0.5, 3); // Max -3 points

  // Weighted formula
  // Total possible: 100 points
  const score = (
    (sleepScore * 0.15) +           // 15% - Sleep hours
    (sleep_quality * 0.15) +        // 15% - Sleep quality (1-10)
    (mood_level * 2 * 0.10) +       // 10% - Mood (1-5, normalized to 10)
    ((11 - stress_level) * 0.15) +  // 15% - Stress (inverted, 1-10)
    (energy_level * 0.25) +         // 25% - Energy (1-10) - most important
    (focus_level * 0.15) +          // 15% - Focus (1-10)
    (activityScore * 0.05) +        // 5% - Physical activity
    (-caffeinePenalty)              // Penalty for excess caffeine
  ) * 10; // Scale to 0-100

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

/**
 * Determine fatigue level based on score
 */
function getFatigueLevel(score) {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'high';
  return 'severe';
}

/**
 * Generate personalized recommendations
 */
function getRecommendations(score, data) {
  const recommendations = [];
  
  if (score >= 80) {
    recommendations.push({
      type: 'success',
      message: 'Kondisi Anda sangat baik! Pertahankan pola hidup sehat Anda.'
    });
  } else if (score >= 60) {
    recommendations.push({
      type: 'warning',
      message: 'Kelelahan ringan terdeteksi. Ambil istirahat singkat di siang hari.'
    });
  } else {
    recommendations.push({
      type: 'danger',
      message: 'Kelelahan tinggi terdeteksi. Prioritaskan istirahat malam ini.'
    });
  }

  // Specific recommendations based on individual metrics
  if (data.sleep_hours < 6) {
    recommendations.push({
      type: 'warning',
      message: `Tidur Anda hanya ${data.sleep_hours} jam. Usahakan tidur 7-9 jam per malam.`
    });
  }

  if (data.sleep_quality <= 4) {
    recommendations.push({
      type: 'warning',
      message: 'Kualitas tidur rendah. Pertimbangkan rutinitas tidur yang lebih baik.'
    });
  }

  if (data.stress_level >= 7) {
    recommendations.push({
      type: 'warning',
      message: 'Tingkat stress tinggi. Cobalah teknik relaksasi atau meditasi.'
    });
  }

  if (data.energy_level <= 4) {
    recommendations.push({
      type: 'warning',
      message: 'Energi rendah. Pastikan asupan nutrisi dan hidrasi yang cukup.'
    });
  }

  if (data.caffeine_intake >= 4) {
    recommendations.push({
      type: 'warning',
      message: 'Konsumsi kafein tinggi. Kurangi kafein untuk tidur yang lebih baik.'
    });
  }

  if (data.physical_activity === 0) {
    recommendations.push({
      type: 'info',
      message: 'Tidak ada aktivitas fisik. Olahraga ringan dapat meningkatkan energi.'
    });
  }

  return recommendations;
}

/**
 * GET /api/mobile/fatigue
 * Get fatigue tracking data with optional filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const date = searchParams.get('date');
    const days = parseInt(searchParams.get('days')) || 7; // Default 7 days
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    let sql;

    if (date) {
      // Get specific date - use raw query to avoid param binding issues
      sql = `
        SELECT 
          id, user_id, assessment_date, sleep_hours, sleep_quality,
          mood_level, stress_level, energy_level, focus_level,
          physical_activity, activity_type, caffeine_intake,
          fatigue_score, fatigue_level, notes, symptoms,
          created_at, updated_at
        FROM fatigue_tracking
        WHERE user_id = ${parseInt(user_id)} AND assessment_date = '${date}'
        ORDER BY assessment_date DESC
        LIMIT ${limit}
      `;
    } else {
      // Get last N days - use raw query for date calculations
      sql = `
        SELECT 
          id, user_id, assessment_date, sleep_hours, sleep_quality,
          mood_level, stress_level, energy_level, focus_level,
          physical_activity, activity_type, caffeine_intake,
          fatigue_score, fatigue_level, notes, symptoms,
          created_at, updated_at
        FROM fatigue_tracking
        WHERE user_id = ${parseInt(user_id)} 
          AND assessment_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        ORDER BY assessment_date DESC
        LIMIT ${limit}
      `;
    }

    const fatigueData = await rawQuery(sql);

    // Parse JSON fields safely
    const processedData = fatigueData.map(item => {
      let symptoms = [];
      if (item.symptoms) {
        try {
          symptoms = JSON.parse(item.symptoms);
        } catch (e) {
          console.warn('Failed to parse symptoms JSON:', e);
          symptoms = [];
        }
      }
      return {
        ...item,
        symptoms
      };
    });

    // Calculate statistics
    const stats = calculateStats(processedData);

    return NextResponse.json({
      success: true,
      data: processedData,
      stats,
      message: 'Fatigue data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching fatigue data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch fatigue data',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/fatigue
 * Create or update fatigue assessment
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      assessment_date,
      sleep_hours,
      sleep_quality,
      mood_level,
      stress_level,
      energy_level,
      focus_level,
      physical_activity = 0,
      activity_type = 'minutes',
      caffeine_intake = 0,
      notes = '',
      symptoms = []
    } = body;

    // Validation
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const requiredFields = {
      sleep_hours,
      sleep_quality,
      mood_level,
      stress_level,
      energy_level,
      focus_level
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Calculate fatigue score
    const fatigueScore = calculateFatigueScore({
      sleep_hours,
      sleep_quality,
      mood_level,
      stress_level,
      energy_level,
      focus_level,
      physical_activity,
      activity_type,
      caffeine_intake
    });

    const fatigueLevel = getFatigueLevel(fatigueScore);
    const recommendations = getRecommendations(fatigueScore, {
      sleep_hours,
      sleep_quality,
      mood_level,
      stress_level,
      energy_level,
      focus_level,
      physical_activity,
      caffeine_intake
    });

    const dateToUse = assessment_date || new Date().toISOString().split('T')[0];
    const symptomsJson = JSON.stringify(symptoms);

    // Insert or update (upsert)
    const sql = `
      INSERT INTO fatigue_tracking (
        user_id, assessment_date, sleep_hours, sleep_quality,
        mood_level, stress_level, energy_level, focus_level,
        physical_activity, activity_type, caffeine_intake,
        fatigue_score, fatigue_level, notes, symptoms,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        sleep_hours = VALUES(sleep_hours),
        sleep_quality = VALUES(sleep_quality),
        mood_level = VALUES(mood_level),
        stress_level = VALUES(stress_level),
        energy_level = VALUES(energy_level),
        focus_level = VALUES(focus_level),
        physical_activity = VALUES(physical_activity),
        activity_type = VALUES(activity_type),
        caffeine_intake = VALUES(caffeine_intake),
        fatigue_score = VALUES(fatigue_score),
        fatigue_level = VALUES(fatigue_level),
        notes = VALUES(notes),
        symptoms = VALUES(symptoms),
        updated_at = NOW()
    `;

    const result = await query(sql, [
      user_id, dateToUse, sleep_hours, sleep_quality,
      mood_level, stress_level, energy_level, focus_level,
      physical_activity, activity_type, caffeine_intake,
      fatigueScore, fatigueLevel, notes, symptomsJson
    ]);

    return NextResponse.json({
      success: true,
      message: 'Fatigue assessment saved successfully',
      data: {
        id: result.insertId || result.id,
        fatigue_score: fatigueScore,
        fatigue_level: fatigueLevel,
        recommendations
      }
    });

  } catch (error) {
    console.error('❌ Error creating fatigue assessment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create fatigue assessment',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate statistics from fatigue data
 */
function calculateStats(data) {
  if (!data || data.length === 0) {
    return {
      average_score: 0,
      trend: 'stable',
      best_day: null,
      worst_day: null,
      total_assessments: 0
    };
  }

  const scores = data.map(d => parseFloat(d.fatigue_score));
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Calculate trend (comparing first half vs second half)
  const midPoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midPoint);
  const secondHalf = scores.slice(midPoint);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  let trend = 'stable';
  if (secondAvg > firstAvg + 5) trend = 'improving';
  if (secondAvg < firstAvg - 5) trend = 'declining';

  const bestDay = data.reduce((prev, current) => 
    parseFloat(current.fatigue_score) > parseFloat(prev.fatigue_score) ? current : prev
  );
  
  const worstDay = data.reduce((prev, current) => 
    parseFloat(current.fatigue_score) < parseFloat(prev.fatigue_score) ? current : prev
  );

  return {
    average_score: Math.round(average * 100) / 100,
    trend,
    best_day: {
      date: bestDay.assessment_date,
      score: parseFloat(bestDay.fatigue_score)
    },
    worst_day: {
      date: worstDay.assessment_date,
      score: parseFloat(worstDay.fatigue_score)
    },
    total_assessments: data.length
  };
}

