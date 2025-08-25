import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

// GET - Generate wellness program report
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let payload;
    try {
      const result = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      payload = result.payload;
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token: missing user ID",
        },
        { status: 401 }
      );
    }

    // Get programId from query parameters
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    console.log(`📊 Generating wellness report for user ID: ${userId}${programId ? `, program ID: ${programId}` : ''}`);

    // Get user data
    const userQuery = `
      SELECT 
        id, name, email, date_of_birth, gender,
        wellness_program_joined, wellness_join_date, wellness_program_duration,
        wellness_program_cycles, wellness_program_stopped_count
      FROM mobile_users 
      WHERE id = ?
    `;
    
    const userResult = await query(userQuery, [userId]);
    const user = userResult[0];
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Calculate age
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

    // Calculate days participated
    let daysParticipated = 0;
    if (user.wellness_join_date) {
      const joinDate = new Date(user.wellness_join_date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - joinDate.getTime());
      daysParticipated = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get completed missions by day
    let missionsQuery = `
      SELECT 
        DATE(um.created_at) as mission_date,
        COUNT(*) as total_missions,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
        SUM(um.points_earned) as points_earned
      FROM user_missions um
      WHERE um.user_id = ?
    `;
    
    let missionsParams = [userId];
    
    if (programId) {
      // If programId is provided, filter by program period
      missionsQuery += `
        AND um.created_at >= (SELECT program_start_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
        AND um.created_at <= (SELECT program_end_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
      `;
      missionsParams.push(programId, userId, programId, userId);
    }
    
    missionsQuery += `
      GROUP BY DATE(um.created_at)
      ORDER BY mission_date DESC
    `;
    
    const missionsResult = await query(missionsQuery, missionsParams);
    const missionsByDay = missionsResult || [];

    // Get completed activities by day
    let activitiesQuery = `
      SELECT 
        DATE(wa.completed_at) as activity_date,
        COUNT(*) as total_activities,
        SUM(wa.points_earned) as points_earned
      FROM wellness_activities wa
      WHERE wa.user_id = ?
    `;
    
    let activitiesParams = [userId];
    
    if (programId) {
      // If programId is provided, filter by program period
      activitiesQuery += `
        AND wa.completed_at >= (SELECT program_start_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
        AND wa.completed_at <= (SELECT program_end_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
      `;
      activitiesParams.push(programId, userId, programId, userId);
    }
    
    activitiesQuery += `
      GROUP BY DATE(wa.completed_at)
      ORDER BY activity_date DESC
    `;
    
    const activitiesResult = await query(activitiesQuery, activitiesParams);
    const activitiesByDay = activitiesResult || [];

    // Calculate wellness score
    let wellnessScoreQuery = `
      SELECT 
        COALESCE(SUM(um.points_earned), 0) as mission_points,
        COALESCE(SUM(wa.points_earned), 0) as activity_points,
        COUNT(DISTINCT um.id) as total_missions,
        COUNT(DISTINCT wa.id) as total_activities
      FROM mobile_users mu
      LEFT JOIN user_missions um ON mu.id = um.user_id AND um.status = 'completed'
      LEFT JOIN wellness_activities wa ON mu.id = wa.user_id
      WHERE mu.id = ?
    `;
    
    let wellnessParams = [userId];
    
    if (programId) {
      // If programId is provided, filter by program period
      wellnessScoreQuery += `
        AND (um.created_at IS NULL OR (
          um.created_at >= (SELECT program_start_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
          AND um.created_at <= (SELECT program_end_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
        ))
        AND (wa.completed_at IS NULL OR (
          wa.completed_at >= (SELECT program_start_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
          AND wa.completed_at <= (SELECT program_end_date FROM wellness_program_history WHERE id = ? AND user_id = ?)
        ))
      `;
      wellnessParams.push(programId, userId, programId, userId, programId, userId, programId, userId);
    }
    
    const wellnessResult = await query(wellnessScoreQuery, wellnessParams);
    const wellnessData = wellnessResult[0] || {};
    
    const totalPoints = (wellnessData.mission_points || 0) + (wellnessData.activity_points || 0);
    const totalActivities = (wellnessData.total_missions || 0) + (wellnessData.total_activities || 0);
    
    // Calculate wellness score (0-100)
    let wellnessScore = 0;
    if (totalActivities > 0) {
      wellnessScore = Math.min(100, Math.round((totalPoints / totalActivities) * 10));
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Create main data sheet
    const mainData = [
      {
        'Nama User': user.name || 'N/A',
        'Tanggal Lahir': user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('id-ID') : 'N/A',
        'Usia': age || 'N/A',
        'Jumlah Hari yang Diikuti': daysParticipated,
        'Jumlah Misi yang Diselesaikan': wellnessData.total_missions || 0,
        'Jumlah Aktivitas yang Diselesaikan': wellnessData.total_activities || 0,
        'Total Poin': totalPoints,
        'Nilai Wellness': wellnessScore
      }
    ];

    const mainSheet = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Ringkasan Program');

    // Create missions detail sheet
    const missionsDetail = missionsByDay.map(mission => ({
      'Tanggal': mission.mission_date ? new Date(mission.mission_date).toLocaleDateString('id-ID') : 'N/A',
      'Total Misi': mission.total_missions || 0,
      'Misi Selesai': mission.completed_missions || 0,
      'Poin yang Diperoleh': mission.points_earned || 0
    }));

    if (missionsDetail.length > 0) {
      const missionsSheet = XLSX.utils.json_to_sheet(missionsDetail);
      XLSX.utils.book_append_sheet(workbook, missionsSheet, 'Detail Misi per Hari');
    }

    // Create activities detail sheet
    const activitiesDetail = activitiesByDay.map(activity => ({
      'Tanggal': activity.activity_date ? new Date(activity.activity_date).toLocaleDateString('id-ID') : 'N/A',
      'Total Aktivitas': activity.total_activities || 0,
      'Poin yang Diperoleh': activity.points_earned || 0
    }));

    if (activitiesDetail.length > 0) {
      const activitiesSheet = XLSX.utils.json_to_sheet(activitiesDetail);
      XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Detail Aktivitas per Hari');
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename based on programId
    const filename = programId 
      ? `laporan-wellness-cycle-${programId}-${user.name || 'user'}-${new Date().toISOString().split('T')[0]}.xlsx`
      : `laporan-wellness-${user.name || 'user'}-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Create response with Excel file
    const response = new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    return response;

  } catch (error) {
    console.error('❌ Error generating wellness report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
