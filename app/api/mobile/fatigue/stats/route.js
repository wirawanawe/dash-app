import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/fatigue/stats
 * Get fatigue statistics and insights
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const days = parseInt(searchParams.get('days')) || 30;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Get data for the specified period
    const sql = `
      SELECT 
        fatigue_score, fatigue_level, assessment_date,
        sleep_hours, energy_level, stress_level
      FROM fatigue_tracking
      WHERE user_id = ? 
        AND assessment_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY assessment_date DESC
    `;

    const data = await query(sql, [user_id, days]);

    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          average_score: 0,
          trend: 'no_data',
          assessments_count: 0,
          streak_days: 0,
          insights: []
        },
        message: 'No fatigue data available'
      });
    }

    // Calculate statistics
    const scores = data.map(d => parseFloat(d.fatigue_score));
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Calculate trend
    const recent3 = scores.slice(0, Math.min(3, scores.length));
    const older3 = scores.slice(Math.max(0, scores.length - 3));
    const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
    const olderAvg = older3.reduce((a, b) => a + b, 0) / older3.length;
    
    let trend = 'stable';
    if (recentAvg > olderAvg + 5) trend = 'improving';
    if (recentAvg < olderAvg - 5) trend = 'declining';

    // Calculate current streak
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < data.length; i++) {
      const assessmentDate = new Date(data[i].assessment_date);
      const daysDiff = Math.floor((today - assessmentDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streakDays++;
      } else {
        break;
      }
    }

    // Generate insights
    const insights = [];
    
    const avgSleep = data.reduce((sum, d) => sum + parseFloat(d.sleep_hours), 0) / data.length;
    const avgEnergy = data.reduce((sum, d) => sum + parseInt(d.energy_level), 0) / data.length;
    const avgStress = data.reduce((sum, d) => sum + parseInt(d.stress_level), 0) / data.length;

    if (avgSleep < 7) {
      insights.push({
        category: 'sleep',
        message: `Rata-rata tidur Anda ${avgSleep.toFixed(1)} jam. Usahakan 7-9 jam.`,
        priority: 'high'
      });
    }

    if (avgEnergy < 6) {
      insights.push({
        category: 'energy',
        message: 'Tingkat energi Anda cenderung rendah. Pertimbangkan olahraga teratur.',
        priority: 'medium'
      });
    }

    if (avgStress > 6) {
      insights.push({
        category: 'stress',
        message: 'Tingkat stress Anda cukup tinggi. Cobalah teknik manajemen stress.',
        priority: 'high'
      });
    }

    if (trend === 'improving') {
      insights.push({
        category: 'trend',
        message: 'Kondisi Anda menunjukkan perbaikan! Pertahankan pola hidup sehat.',
        priority: 'positive'
      });
    }

    if (trend === 'declining') {
      insights.push({
        category: 'trend',
        message: 'Kondisi Anda menurun. Evaluasi pola tidur dan aktivitas Anda.',
        priority: 'warning'
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        average_score: Math.round(average * 100) / 100,
        trend,
        assessments_count: data.length,
        streak_days: streakDays,
        average_sleep: Math.round(avgSleep * 10) / 10,
        average_energy: Math.round(avgEnergy * 10) / 10,
        average_stress: Math.round(avgStress * 10) / 10,
        insights
      },
      message: 'Statistics calculated successfully'
    });

  } catch (error) {
    console.error('❌ Error calculating fatigue stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to calculate statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate stats
 */
function calculateStats(data) {
  if (!data || data.length === 0) {
    return {
      average_score: 0,
      min_score: 0,
      max_score: 0,
      count: 0
    };
  }

  const scores = data.map(d => parseFloat(d.fatigue_score));
  
  return {
    average_score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
    min_score: Math.min(...scores),
    max_score: Math.max(...scores),
    count: data.length
  };
}

