import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

/**
 * POST /api/sync/trigger
 * Triggers scheduled sync based on sync_schedules configuration
 * This endpoint should be called by a cron job or scheduler
 */
export async function POST(request) {
  try {

    // Get all enabled schedules that are due for sync
    const dueSchedules = await query(
      `SELECT * FROM sync_schedules 
       WHERE is_enabled = TRUE 
       AND (next_sync_at IS NULL OR next_sync_at <= NOW())
       ORDER BY entity_type`
    );
    
    if (dueSchedules.length === 0) {

      return NextResponse.json({
        success: true,
        message: 'No syncs due',
        syncs_triggered: 0
      });
    }

    const results = [];
    
    // Trigger each due sync
    for (const schedule of dueSchedules) {
      const entity = schedule.entity_type;

      try {
        // Construct the sync URL
        const syncUrl = entity === 'all' 
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync/all`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/${entity}/sync`;
        
        // Trigger the sync (fire and forget for non-blocking)
        fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(response => {
          if (response.ok) {

          } else {

          }
        }).catch(error => {

        });
        
        results.push({
          entity,
          triggered: true,
          message: 'Sync started'
        });
        
      } catch (error) {

        results.push({
          entity,
          triggered: false,
          message: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Triggered ${results.length} sync(s)`,
      syncs_triggered: results.length,
      results
    });
    
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to trigger syncs',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/trigger
 * Returns information about scheduled syncs
 */
export async function GET(request) {
  try {
    // Get all schedules
    const schedules = await query(
      `SELECT 
        entity_type,
        is_enabled,
        interval_minutes,
        last_sync_at,
        next_sync_at,
        CASE 
          WHEN next_sync_at IS NULL THEN TRUE
          WHEN next_sync_at <= NOW() THEN TRUE
          ELSE FALSE
        END as is_due
       FROM sync_schedules
       ORDER BY entity_type`
    );
    
    // Count due schedules
    const dueCount = schedules.filter(s => s.is_enabled && s.is_due).length;
    
    return NextResponse.json({
      success: true,
      schedules,
      due_count: dueCount
    });
    
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get schedules',
        error: error.message
      },
      { status: 500 }
    );
  }
}

