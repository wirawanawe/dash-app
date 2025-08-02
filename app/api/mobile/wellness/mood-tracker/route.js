import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get mood tracker data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
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

    // Calculate date range (last 30 days if not specified)
    let startDate, endDate;
    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      endDate = new Date().toISOString().split('T')[0];
      startDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const sql = `
      SELECT 
        DATE(tracking_date) as date,
        mood_level as mood,
        energy_level,
        COUNT(*) as entries
      FROM mood_tracking
      WHERE user_id = ? AND DATE(tracking_date) BETWEEN ? AND ?
      GROUP BY DATE(tracking_date), mood_level, energy_level
      ORDER BY date DESC
    `;

    const moodData = await query(sql, [user_id, startDate, endDate]);

    // Calculate mood statistics
    const moodStats = {
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      total_entries: 0,
      mood_distribution: {
        excellent: 0,
        good: 0,
        okay: 0,
        bad: 0,
        terrible: 0,
      },
      energy_distribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
      average_mood_score: 0,
      average_energy_score: 0,
      most_common_mood: null,
      most_common_energy: null,
    };

    let totalMoodScore = 0;
    let totalEnergyScore = 0;
    let totalEntries = 0;
    const moodCounts = {};
    const energyCounts = {};

    moodData.forEach(entry => {
      const moodScore = getMoodScore(entry.mood);
      const energyScore = getEnergyScore(entry.energy_level);
      
      totalMoodScore += moodScore * entry.entries;
      totalEnergyScore += energyScore * entry.entries;
      totalEntries += entry.entries;

      // Count mood distribution
      if (!moodCounts[entry.mood]) {
        moodCounts[entry.mood] = 0;
      }
      moodCounts[entry.mood] += entry.entries;

      // Count energy distribution
      if (!energyCounts[entry.energy_level]) {
        energyCounts[entry.energy_level] = 0;
      }
      energyCounts[entry.energy_level] += entry.entries;
    });

    moodStats.total_entries = totalEntries;
    moodStats.mood_distribution = moodCounts;
    moodStats.energy_distribution = energyCounts;

    if (totalEntries > 0) {
      moodStats.average_mood_score = totalMoodScore / totalEntries;
      moodStats.average_energy_score = totalEnergyScore / totalEntries;
    }

    // Find most common mood and energy
    let maxMoodCount = 0;
    let maxEnergyCount = 0;

    Object.keys(moodCounts).forEach(mood => {
      if (moodCounts[mood] > maxMoodCount) {
        maxMoodCount = moodCounts[mood];
        moodStats.most_common_mood = mood;
      }
    });

    Object.keys(energyCounts).forEach(energy => {
      if (energyCounts[energy] > maxEnergyCount) {
        maxEnergyCount = energyCounts[energy];
        moodStats.most_common_energy = energy;
      }
    });

    return NextResponse.json({
      success: true,
      data: moodStats,
    });
  } catch (error) {
    console.error("Error fetching mood tracker data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil mood tracker data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Log mood
export async function POST(request) {
  try {
    const {
      user_id,
      mood,
      energy_level,
      tracking_date,
      notes
    } = await request.json();

    if (!user_id || !mood) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan mood wajib diisi",
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO mood_tracking (user_id, mood_level, energy_level, tracking_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id,
      mood,
      energy_level || null,
      tracking_date || new Date().toISOString().split('T')[0],
      notes || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Mood berhasil dicatat",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error logging mood:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mencatat mood",
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

// Helper function to convert energy level to numeric score
function getEnergyScore(energy) {
  const scores = {
    high: 3,
    medium: 2,
    low: 1,
  };
  return scores[energy] || 0;
} 