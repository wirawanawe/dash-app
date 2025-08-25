import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    console.log('🔍 Testing missions database...');
    
    // Test 1: Check if missions table exists
    const tableCheck = await query('SHOW TABLES LIKE "missions"');
    console.log('📋 Missions table check:', tableCheck);
    
    if (tableCheck.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Missions table does not exist'
      });
    }
    
    // Test 2: Count missions
    const countResult = await query('SELECT COUNT(*) as count FROM missions');
    const missionCount = countResult[0].count;
    console.log('📊 Mission count:', missionCount);
    
    // Test 3: Get sample missions
    const sampleMissions = await query('SELECT id, title, category FROM missions LIMIT 5');
    console.log('📝 Sample missions:', sampleMissions);
    
    return NextResponse.json({
      success: true,
      message: 'Missions database test completed',
      data: {
        tableExists: true,
        missionCount,
        sampleMissions
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing missions database:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error.message
    }, { status: 500 });
  }
}
