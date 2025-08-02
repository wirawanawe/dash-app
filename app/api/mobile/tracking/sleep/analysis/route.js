import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get sleep analysis
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const days = parseInt(searchParams.get("days")) || 30;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Get sleep data for analysis period
    const sql = `
      SELECT 
        sleep_date,
        FLOOR(sleep_duration_minutes / 60) as sleep_hours,
        MOD(sleep_duration_minutes, 60) as sleep_minutes,
        (sleep_duration_minutes / 60) as total_hours,
        sleep_quality,
        bedtime,
        wake_time
      FROM sleep_tracking
      WHERE user_id = ? AND sleep_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY sleep_date DESC
    `;

    const sleepData = await query(sql, [user_id, days]);

    if (sleepData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: "No sleep data available for analysis",
          period_days: days,
        },
      });
    }

    // Calculate analysis metrics
    const analysis = {
      period_days: days,
      total_nights: sleepData.length,
      average_sleep_hours: 0,
      average_sleep_quality: 0,
      sleep_consistency: 0,
      quality_distribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
      recommendations: [],
    };

    let totalHours = 0;
    let totalQuality = 0;
    let qualityCount = 0;
    let consistentNights = 0;
    let previousHours = null;

    sleepData.forEach((night, index) => {
      const hours = night.total_hours || 0;
      totalHours += hours;

      if (night.sleep_quality) {
        analysis.quality_distribution[night.sleep_quality]++;
        totalQuality += getQualityScore(night.sleep_quality);
        qualityCount++;
      }

      // Check consistency (within 1 hour of previous night)
      if (previousHours !== null && Math.abs(hours - previousHours) <= 1) {
        consistentNights++;
      }
      previousHours = hours;
    });

    // Calculate averages
    analysis.average_sleep_hours = totalHours / sleepData.length;
    if (qualityCount > 0) {
      analysis.average_sleep_quality = totalQuality / qualityCount;
    }
    analysis.sleep_consistency = (consistentNights / (sleepData.length - 1)) * 100;

    // Generate recommendations
    if (analysis.average_sleep_hours < 7) {
      analysis.recommendations.push("Consider increasing sleep duration to 7-9 hours per night");
    } else if (analysis.average_sleep_hours > 9) {
      analysis.recommendations.push("Consider reducing sleep duration to 7-9 hours per night");
    }

    if (analysis.average_sleep_quality < 3) {
      analysis.recommendations.push("Focus on improving sleep quality through better sleep hygiene");
    }

    if (analysis.sleep_consistency < 70) {
      analysis.recommendations.push("Try to maintain a consistent sleep schedule");
    }

    // Calculate sleep efficiency (if bedtime and wake time are available)
    const nightsWithTimes = sleepData.filter(night => night.bedtime && night.wake_time);
    if (nightsWithTimes.length > 0) {
      let totalEfficiency = 0;
      nightsWithTimes.forEach(night => {
        const efficiency = calculateSleepEfficiency(night);
        totalEfficiency += efficiency;
      });
      analysis.average_sleep_efficiency = totalEfficiency / nightsWithTimes.length;
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error fetching sleep analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil sleep analysis",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to convert quality to numeric score
function getQualityScore(quality) {
  const scores = {
    excellent: 4,
    good: 3,
    fair: 2,
    poor: 1,
  };
  return scores[quality] || 0;
}

// Helper function to calculate sleep efficiency
function calculateSleepEfficiency(night) {
  // This is a simplified calculation
  // In a real implementation, you'd need more detailed sleep stage data
  const totalSleepHours = night.total_hours || 0;
  const timeInBed = 8; // Assume 8 hours in bed as default
  return Math.min((totalSleepHours / timeInBed) * 100, 100);
} 