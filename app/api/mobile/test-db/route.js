import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results = {};
    
    // Test mobile_users table
    try {
      const usersResult = await query('SELECT COUNT(*) as count FROM mobile_users');
      results.mobile_users = usersResult[0]?.count || 0;
    } catch (error) {
      results.mobile_users = { error: error.message };
    }
    
    // Test wellness_activities table
    try {
      const activitiesResult = await query('SELECT COUNT(*) as count FROM wellness_activities');
      results.wellness_activities = activitiesResult[0]?.count || 0;
    } catch (error) {
      results.wellness_activities = { error: error.message };
    }
    
    // Test user_missions table
    try {
      const missionsResult = await query('SELECT COUNT(*) as count FROM user_missions');
      results.user_missions = missionsResult[0]?.count || 0;
    } catch (error) {
      results.user_missions = { error: error.message };
    }
    
    // Test water_tracking table
    try {
      const waterResult = await query('SELECT COUNT(*) as count FROM water_tracking');
      results.water_tracking = waterResult[0]?.count || 0;
    } catch (error) {
      results.water_tracking = { error: error.message };
    }
    
    // Test mood_tracking table
    try {
      const moodResult = await query('SELECT COUNT(*) as count FROM mood_tracking');
      results.mood_tracking = moodResult[0]?.count || 0;
    } catch (error) {
      results.mood_tracking = { error: error.message };
    }
    
    // Test sleep_tracking table
    try {
      const sleepResult = await query('SELECT COUNT(*) as count FROM sleep_tracking');
      results.sleep_tracking = sleepResult[0]?.count || 0;
    } catch (error) {
      results.sleep_tracking = { error: error.message };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database tables check completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        message: 'Database test failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
