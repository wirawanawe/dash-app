import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 30000, // 30 second timeout
      });
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error; // Throw on last attempt
      }
      // Wait before retrying (exponential backoff)
      await delay(Math.pow(2, i) * 1000);
    }
  }
}

// POST /api/visits/sync - Sync visits from external API to database
export async function POST(request) {
  const startTime = Date.now();
  let syncLogId = null;
  let failedCount = 0;
  const sampleErrors = [];
  
  try {

    // Create sync log entry
    const logResult = await query(
      `INSERT INTO sync_logs (entity_type, status, started_at) 
       VALUES ('visits', 'started', NOW())`
    );
    syncLogId = logResult.insertId;
    
    // Step 1: Get total count from API
    const countResponse = await fetchWithRetry(
      `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    
    if (!countResponse.ok) {
      throw new Error(`Failed to fetch count: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const externalTotal = countData["total pasien"] || countData.total || 0;

    // Update sync log
    await query(
      `UPDATE sync_logs SET status = 'in_progress' WHERE id = ?`,
      [syncLogId]
    );
    
    // Step 2: Fetch all pages from external API
    // Fetch up to 20000 records (configurable)
    const desiredRecords = 20000;
    const recordsPerPage = 1000;
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);

    // Fetch pages in batches to avoid overwhelming the API
    const batchSize = 5; // Fetch 5 pages at a time
    let rawVisits = [];
    
    for (let batchStart = startPage; batchStart <= totalPagesInExternal; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, totalPagesInExternal);
      const pageFetchPromises = [];
      
      for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
        const apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${pageNum}&limit=${recordsPerPage}`;
        
        pageFetchPromises.push(
          fetchWithRetry(apiUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }).then(res => res.json())
        );
      }
      
      const batchResults = await Promise.all(pageFetchPromises);
      
      batchResults.forEach(pageData => {
        if (pageData.data && Array.isArray(pageData.data)) {
          rawVisits = rawVisits.concat(pageData.data);
        }
      });

      // Small delay between batches to be nice to the API
      if (batchEnd < totalPagesInExternal) {
        await delay(500);
      }
    }

    // Step 3: Preflight: ensure required columns exist in visits table
    const requiredColumns = [
      'external_id','visit_number','unique_id','patient_nik','patient_name','patient_nip',
      'patient_no_peserta','patient_nama_peserta','patient_gender','patient_birth_date',
      'patient_department','diagnosis','complaint','treatment','notes','assessment','status',
      'clinic','room','visit_date','doctor_name','facility_code','facility_name','physical_exam',
      'external_created_at','external_updated_at','synced_at'
    ];
    const columnsResult = await query(`SHOW COLUMNS FROM visits`);
    const existingColumns = new Set(columnsResult.map(c => c.Field));
    const missing = requiredColumns.filter(c => !existingColumns.has(c));
    if (missing.length > 0) {
      throw new Error(`Missing required columns in visits table: ${missing.join(', ')}`);
    }

    // Step 4: Save to database
    let insertedCount = 0;
    let updatedCount = 0;
    
    // Process in batches for better performance
    const dbBatchSize = 100;
    for (let i = 0; i < rawVisits.length; i += dbBatchSize) {
      const batch = rawVisits.slice(i, i + dbBatchSize);
      
      for (const visit of batch) {
        try {
          const externalId = visit.ID || visit.No_Kunjungan;
          if (!externalId) {
            continue;
          }
          
          // Prepare data
          const visitData = {
            external_id: externalId,
            visit_number: visit.No_Kunjungan || null,
            unique_id: visit.ID || null,
            patient_nik: visit.Pasien?.[0]?.NIK || null,
            patient_name: visit.Pasien?.[0]?.Nama_Pasien || null,
            patient_nip: visit.Pasien?.[0]?.NIP || null,
            patient_no_peserta: visit.Pasien?.[0]?.No_Peserta || null,
            patient_nama_peserta: visit.Pasien?.[0]?.Nama_Peserta || null,
            patient_gender: visit.Pasien?.[0]?.Jenis_Kelamin || null,
            patient_birth_date: visit.Pasien?.[0]?.Tgl_Lahir || null,
            patient_department: visit.Pasien?.[0]?.Bagian || null,
            diagnosis: visit.Diagnosa || null,
            complaint: visit.Diagnosa || null,
            treatment: null,
            notes: null,
            assessment: null,
            status: 'Selesai',
            clinic: visit.Klinik || null,
            room: visit.Klinik || null,
            visit_date: visit.Tgl_Kunjungan || null,
            doctor_name: visit.Dokter || null,
            facility_code: visit.Fasilitas_Kesehatan?.[0]?.Kode || null,
            facility_name: visit.Fasilitas_Kesehatan?.[0]?.Nama_Faskes || null,
            physical_exam: JSON.stringify({
              weight: "0",
              height: "0",
              waistCircumference: "0",
              temperature: "0",
              spO2: "0",
              bloodPressure: { systolic: "0", diastolic: "0" },
              pulse: "0",
              respirationRate: "0",
              eyes: "",
              ears: ""
            }),
            external_created_at: visit.audittrail?.created_at || null,
            external_updated_at: visit.audittrail?.updated_at || null,
          };
          
          // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both insert and update atomically
          // This prevents race conditions and duplicate entry errors
          const result = await query(
            `INSERT INTO visits (
              external_id, visit_number, unique_id,
              patient_nik, patient_name, patient_nip,
              patient_no_peserta, patient_nama_peserta,
              patient_gender, patient_birth_date, patient_department,
              diagnosis, complaint, treatment, notes, assessment,
              status, clinic, room, visit_date,
              doctor_name, facility_code, facility_name,
              physical_exam, external_created_at, external_updated_at,
              synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              visit_number = VALUES(visit_number),
              unique_id = VALUES(unique_id),
              patient_nik = VALUES(patient_nik),
              patient_name = VALUES(patient_name),
              patient_nip = VALUES(patient_nip),
              patient_no_peserta = VALUES(patient_no_peserta),
              patient_nama_peserta = VALUES(patient_nama_peserta),
              patient_gender = VALUES(patient_gender),
              patient_birth_date = VALUES(patient_birth_date),
              patient_department = VALUES(patient_department),
              diagnosis = VALUES(diagnosis),
              complaint = VALUES(complaint),
              treatment = VALUES(treatment),
              notes = VALUES(notes),
              assessment = VALUES(assessment),
              status = VALUES(status),
              clinic = VALUES(clinic),
              room = VALUES(room),
              visit_date = VALUES(visit_date),
              doctor_name = VALUES(doctor_name),
              facility_code = VALUES(facility_code),
              facility_name = VALUES(facility_name),
              physical_exam = VALUES(physical_exam),
              external_created_at = VALUES(external_created_at),
              external_updated_at = VALUES(external_updated_at),
              synced_at = NOW()`,
            [
              visitData.external_id,
              visitData.visit_number,
              visitData.unique_id,
              visitData.patient_nik,
              visitData.patient_name,
              visitData.patient_nip,
              visitData.patient_no_peserta,
              visitData.patient_nama_peserta,
              visitData.patient_gender,
              visitData.patient_birth_date,
              visitData.patient_department,
              visitData.diagnosis,
              visitData.complaint,
              visitData.treatment,
              visitData.notes,
              visitData.assessment,
              visitData.status,
              visitData.clinic,
              visitData.room,
              visitData.visit_date,
              visitData.doctor_name,
              visitData.facility_code,
              visitData.facility_name,
              visitData.physical_exam,
              visitData.external_created_at,
              visitData.external_updated_at
            ]
          );
          
          // affectedRows: 1 = inserted, 2 = updated
          if (result.affectedRows === 1) {
            insertedCount++;
          } else if (result.affectedRows === 2) {
            updatedCount++;
          }
        } catch (error) {
          failedCount++;
          if (sampleErrors.length < 5) {
            sampleErrors.push({
              external_id: visit?.ID || visit?.No_Kunjungan || null,
              message: error.message,
            });
          }
        }
      }

    }
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    
    // Update sync log with completion
    await query(
      `UPDATE sync_logs SET
        status = 'completed',
        records_fetched = ?,
        records_updated = ?,
        records_inserted = ?,
        records_failed = ?,
        completed_at = NOW(),
        duration_seconds = ?
      WHERE id = ?`,
      [rawVisits.length, updatedCount, insertedCount, failedCount, durationSeconds, syncLogId]
    );
    
    // Update sync schedule
    await query(
      `UPDATE sync_schedules SET
        last_sync_at = NOW(),
        next_sync_at = DATE_ADD(NOW(), INTERVAL interval_minutes MINUTE)
      WHERE entity_type = 'visits'`
    );

    return NextResponse.json({
      success: true,
      message: 'Visits sync completed successfully',
      stats: {
        fetched: rawVisits.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
        duration_seconds: durationSeconds
      },
      sampleErrors
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
        message: 'Visits sync failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// GET /api/visits/sync - Get sync status and logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get latest sync logs
    const logs = await query(
      `SELECT * FROM sync_logs 
       WHERE entity_type = 'visits' 
       ORDER BY started_at DESC 
       LIMIT ?`,
      [limit]
    );
    
    // Get sync schedule
    const [schedule] = await query(
      `SELECT * FROM sync_schedules WHERE entity_type = 'visits'`
    );
    
    // Get cache statistics
    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_visits,
        MAX(synced_at) as last_synced,
        MIN(visit_date) as oldest_visit_date,
        MAX(visit_date) as newest_visit_date
       FROM visits`
    );
    
    return NextResponse.json({
      success: true,
      logs,
      schedule,
      stats: stats || {}
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

