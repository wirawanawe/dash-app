import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// POST /api/sync/all - Sync all data from external APIs
export async function POST(request) {
  const startTime = Date.now();
  let syncLogId = null;
  
  try {

    // Create sync log entry
    const logResult = await query(
      `INSERT INTO sync_logs (entity_type, status, started_at) 
       VALUES ('all', 'started', NOW())`
    );
    syncLogId = logResult.insertId;
    
    // Update status
    await query(
      `UPDATE sync_logs SET status = 'in_progress' WHERE id = ?`,
      [syncLogId]
    );
    
    const results = {
      visits: { success: false, message: '', stats: {} },
      patients: { success: false, message: '', stats: {} },
      doctors: { success: false, message: '', stats: {} },
      clinics: { success: false, message: '', stats: {} }
    };
    
    // Sync Visits

    try {
      const visitsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/visits/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        results.visits.success = visitsData.success;
        results.visits.message = visitsData.message;
        results.visits.stats = visitsData.stats;
      } else {
        results.visits.message = `Failed with status ${visitsResponse.status}`;
      }
    } catch (error) {
      results.visits.message = error.message;

    }
    
    // Sync Patients

    try {
      const patientsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/patients/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        results.patients.success = patientsData.success;
        results.patients.message = patientsData.message;
        results.patients.stats = patientsData.stats;
      } else {
        results.patients.message = `Failed with status ${patientsResponse.status}`;
      }
    } catch (error) {
      results.patients.message = error.message;

    }
    
    // Sync Doctors (existing endpoint)

    try {
      const doctorsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/doctors/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        results.doctors.success = doctorsData.success;
        results.doctors.message = doctorsData.message;
        results.doctors.stats = doctorsData.stats || {};
      } else {
        results.doctors.message = `Failed with status ${doctorsResponse.status}`;
      }
    } catch (error) {
      results.doctors.message = error.message;

    }
    
    // Sync Clinics (existing endpoint)

    try {
      const clinicsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clinics/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        results.clinics.success = clinicsData.success;
        results.clinics.message = clinicsData.message;
        results.clinics.stats = clinicsData.stats || {};
      } else {
        results.clinics.message = `Failed with status ${clinicsResponse.status}`;
      }
    } catch (error) {
      results.clinics.message = error.message;

    }
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    
    // Calculate total records
    const totalFetched = 
      (results.visits.stats?.fetched || 0) + 
      (results.patients.stats?.fetched || 0) +
      (results.doctors.stats?.fetched || 0) +
      (results.clinics.stats?.fetched || 0);
      
    const totalInserted = 
      (results.visits.stats?.inserted || 0) + 
      (results.patients.stats?.inserted || 0) +
      (results.doctors.stats?.inserted || 0) +
      (results.clinics.stats?.inserted || 0);
      
    const totalUpdated = 
      (results.visits.stats?.updated || 0) + 
      (results.patients.stats?.updated || 0) +
      (results.doctors.stats?.updated || 0) +
      (results.clinics.stats?.updated || 0);
    
    // Check if all syncs were successful
    const allSuccess = Object.values(results).every(r => r.success);
    
    // Update sync log
    await query(
      `UPDATE sync_logs SET
        status = ?,
        records_fetched = ?,
        records_inserted = ?,
        records_updated = ?,
        completed_at = NOW(),
        duration_seconds = ?,
        error_message = ?
      WHERE id = ?`,
      [
        allSuccess ? 'completed' : 'failed',
        totalFetched,
        totalInserted,
        totalUpdated,
        durationSeconds,
        allSuccess ? null : JSON.stringify(results),
        syncLogId
      ]
    );
    
    // Update sync schedule
    await query(
      `UPDATE sync_schedules SET
        last_sync_at = NOW(),
        next_sync_at = DATE_ADD(NOW(), INTERVAL interval_minutes MINUTE)
      WHERE entity_type = 'all'`
    );

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'All data synced successfully' : 'Some syncs failed',
      duration_seconds: durationSeconds,
      results,
      summary: {
        total_fetched: totalFetched,
        total_inserted: totalInserted,
        total_updated: totalUpdated
      }
    });
    
  } catch (error) {

    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    
    // Update sync log with error
    if (syncLogId) {
      await query(
        `UPDATE sync_logs SET
          status = 'failed',
          error_message = ?,
          completed_at = NOW(),
          duration_seconds = ?
        WHERE id = ?`,
        [error.message, durationSeconds, syncLogId]
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Full sync failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// GET /api/sync/all - Get sync status for all entities
export async function GET(request) {
  try {
    // Get latest sync logs for all entities
    const logs = await query(
      `SELECT * FROM sync_logs 
       WHERE entity_type = 'all'
       ORDER BY started_at DESC 
       LIMIT 5`
    );
    
    // Get all sync schedules
    const schedules = await query(
      `SELECT * FROM sync_schedules ORDER BY entity_type`
    );
    
    // Get cache statistics
    const [visitsStats] = await query(
      `SELECT 
        COUNT(*) as total_visits,
        MAX(synced_at) as last_synced
       FROM visits_cache`
    );
    
    const [patientsStats] = await query(
      `SELECT 
        COUNT(*) as total_patients,
        MAX(synced_at) as last_synced
       FROM patients_cache`
    );
    
    const [doctorsStats] = await query(
      `SELECT 
        COUNT(*) as total_doctors,
        MAX(updated_at) as last_updated
       FROM doctors`
    );
    
    const [clinicsStats] = await query(
      `SELECT 
        COUNT(*) as total_clinics,
        MAX(updated_at) as last_updated
       FROM clinics`
    );
    
    return NextResponse.json({
      success: true,
      logs,
      schedules,
      cache_stats: {
        visits: visitsStats || {},
        patients: patientsStats || {},
        doctors: doctorsStats || {},
        clinics: clinicsStats || {}
      }
    });
    
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get sync status',
        error: error.message
      },
      { status: 500 }
    );
  }
}

