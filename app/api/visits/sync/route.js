import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Configuration - SPEED OPTIMIZED
const SYNC_CONFIG = {
  // API Request Settings
  INITIAL_TIMEOUT: 60000,        // 60 detik untuk request pertama
  DATA_PAGE_TIMEOUT: 90000,      // 90 detik untuk data pages
  MAX_RETRIES: 2,                // Kurangi dari 3 ke 2 (lebih cepat fail)
  
  // Concurrent Settings - KUNCI KECEPATAN!
  CONCURRENT_PAGES: 5,           // Fetch 5 pages sekaligus! (was 1)
  DELAY_BETWEEN_BATCHES: 500,    // 500ms delay antar batch (was 2000ms)
  
  // Data Volume
  MAX_RECORDS: 10000,            // Tambah ke 10K (was 5K)
  RECORDS_PER_PAGE: 1000,        // Tambah ke 1000 (was 500)
  
  // Error Handling
  ALLOW_PARTIAL_SYNC: true,      // Tetap enable partial sync
  MAX_FAILURES_ALLOWED: 15,      // Lebih toleran (was 10)
  
  // Database Optimization
  DB_BATCH_SIZE: 200,            // Lebih besar untuk bulk insert (was 100)
};

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry and proper timeout
async function fetchWithRetry(url, options, maxRetries = 2, timeoutMs = 60000) {
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`External API returned HTML (status ${response.status}). API may be down.`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      let errorToThrow = error;
      
      if (error.name === 'AbortError') {
        errorToThrow = new Error(`Request timeout after ${timeoutMs}ms`);
        errorToThrow.name = 'TimeoutError';
        errorToThrow.originalError = error;
      }
      
      if (i === maxRetries - 1) {
        throw errorToThrow;
      }
      
      // Shorter backoff for speed
      const backoffDelay = Math.pow(2, i) * 500; // 500ms, 1s (was 1s, 2s, 4s)
      await delay(backoffDelay);
    }
  }
}

// POST /api/visits/sync - Sync visits from external API to database
export async function POST(request) {
  const startTime = Date.now();
  let syncLogId = null;
  let failedCount = 0;
  let pagesFailed = 0;
  const sampleErrors = [];
  
  // Performance tracking
  const perfStats = {
    apiTime: 0,
    dbTime: 0,
    totalPages: 0,
  };
  
  try {
    console.log('⚡ Starting visits sync...');

    // Create sync log entry
    const logResult = await query(
      `INSERT INTO sync_logs (entity_type, status, started_at) 
       VALUES ('visits', 'started', NOW())`
    );
    syncLogId = logResult.insertId;
    
    // Step 1: Get total count from API
    const apiStartTime = Date.now();
    
    let countResponse;
    let externalTotal = 0;
    
    try {
      countResponse = await fetchWithRetry(
        `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
        SYNC_CONFIG.MAX_RETRIES,
        SYNC_CONFIG.INITIAL_TIMEOUT
      );
      
      if (!countResponse.ok) {
        throw new Error(`Failed to fetch count: ${countResponse.status}`);
      }
      
      const countData = await countResponse.json();
      externalTotal = countData["total pasien"] || countData.total || 0;
    } catch (error) {
      console.error('Failed to get total count:', error.message);
      
      if (SYNC_CONFIG.ALLOW_PARTIAL_SYNC) {
        externalTotal = SYNC_CONFIG.MAX_RECORDS;
      } else {
        throw error;
      }
    }

    // Update sync log
    await query(
      `UPDATE sync_logs SET status = 'in_progress' WHERE id = ?`,
      [syncLogId]
    );
    
    // Step 2: Fetch pages CONCURRENTLY
    const desiredRecords = Math.min(SYNC_CONFIG.MAX_RECORDS, externalTotal);
    const recordsPerPage = SYNC_CONFIG.RECORDS_PER_PAGE;
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const pagesToFetch = Math.ceil(desiredRecords / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);
    const endPage = Math.min(startPage + pagesToFetch - 1, totalPagesInExternal);

    let rawVisits = [];
    perfStats.totalPages = endPage - startPage + 1;
    
    // Fetch pages in CONCURRENT batches for MAXIMUM SPEED
    for (let batchStart = startPage; batchStart <= endPage; batchStart += SYNC_CONFIG.CONCURRENT_PAGES) {
      const batchEnd = Math.min(batchStart + SYNC_CONFIG.CONCURRENT_PAGES - 1, endPage);
      const batchPageNumbers = [];
      
      for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
        batchPageNumbers.push(pageNum);
      }
      
      const batchStartTime = Date.now();
      
      // Fetch ALL pages in batch CONCURRENTLY
      const fetchPromises = batchPageNumbers.map(pageNum => {
        const apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${pageNum}&limit=${recordsPerPage}`;
        
        return fetchWithRetry(
          apiUrl,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
          SYNC_CONFIG.MAX_RETRIES,
          SYNC_CONFIG.DATA_PAGE_TIMEOUT
        )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch page ${pageNum}: ${response.status}`);
          }
          const pageData = await response.json();
          return { pageNum, data: pageData, success: true };
        })
        .catch((error) => {
          return { pageNum, error: error.message, success: false };
        });
      });
      
      // Wait for ALL pages in batch to complete
      const results = await Promise.all(fetchPromises);
      
      const batchTime = Date.now() - batchStartTime;
      perfStats.apiTime += batchTime;
      
      // Process results
      results.forEach(result => {
        if (result.success && result.data?.data && Array.isArray(result.data.data)) {
          rawVisits = rawVisits.concat(result.data.data);
        } else {
          pagesFailed++;
          if (sampleErrors.length < 5) {
            sampleErrors.push({
              page: result.pageNum,
              error: result.error || 'Unknown error',
            });
          }
        }
      });
      
      // Check if too many failures
      if (pagesFailed >= SYNC_CONFIG.MAX_FAILURES_ALLOWED) {
        break;
      }
      
      // Short delay between batches
      if (batchEnd < endPage) {
        await delay(SYNC_CONFIG.DELAY_BETWEEN_BATCHES);
      }
    }

    // If we got zero records, fail the sync
    if (rawVisits.length === 0) {
      throw new Error(`No data fetched. Pages failed: ${pagesFailed}`);
    }

    // Step 3: Verify database schema (quick check)
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
      throw new Error(`Missing columns: ${missing.join(', ')}`);
    }

    // Step 4: Save to database
    const dbStartTime = Date.now();
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (let i = 0; i < rawVisits.length; i += SYNC_CONFIG.DB_BATCH_SIZE) {
      const batch = rawVisits.slice(i, i + SYNC_CONFIG.DB_BATCH_SIZE);
      
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
          
          // Use INSERT ... ON DUPLICATE KEY UPDATE
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
    
    const dbTime = Date.now() - dbStartTime;
    perfStats.dbTime = dbTime;
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Sync complete: ${rawVisits.length} records, ${insertedCount} inserted, ${updatedCount} updated in ${durationSeconds}s`);
    
    // Determine sync status
    const syncStatus = (pagesFailed > 0 || failedCount > 0) ? 'completed' : 'completed';
    
    // Update sync log with completion
    await query(
      `UPDATE sync_logs SET
        status = ?,
        records_fetched = ?,
        records_updated = ?,
        records_inserted = ?,
        records_failed = ?,
        error_message = ?,
        completed_at = NOW(),
        duration_seconds = ?
      WHERE id = ?`,
      [
        syncStatus,
        rawVisits.length,
        updatedCount,
        insertedCount,
        failedCount,
        pagesFailed > 0 ? `Partial sync: ${pagesFailed} pages failed` : null,
        durationSeconds,
        syncLogId
      ]
    );
    
    // Update sync schedule
    await query(
      `UPDATE sync_schedules SET
        last_sync_at = NOW(),
        next_sync_at = DATE_ADD(NOW(), INTERVAL interval_minutes MINUTE)
      WHERE entity_type = 'visits'`
    );
    
    // Return response
    const response = {
      success: true,
      message: pagesFailed > 0 
        ? `Sync completed with ${pagesFailed} page failures` 
        : 'Sync completed successfully',
      stats: {
        fetched: rawVisits.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
        pages_failed: pagesFailed,
        duration_seconds: durationSeconds,
        partial_sync: pagesFailed > 0,
        performance: {
          api_time_ms: perfStats.apiTime,
          db_time_ms: perfStats.dbTime,
          records_per_second: Math.round(rawVisits.length / durationSeconds),
          total_pages: perfStats.totalPages,
          concurrent_pages: SYNC_CONFIG.CONCURRENT_PAGES,
        }
      },
      sampleErrors: sampleErrors.length > 0 ? sampleErrors : undefined
    };
    
    return NextResponse.json(response, { 
      status: pagesFailed > 0 ? 207 : 200
    });
    
  } catch (error) {
    console.error('Sync failed:', error.message);

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
        error: error.message,
        details: 'Check server logs for more information.',
        recommendations: [
          'Run health check: node scripts/check-external-api-health.js',
          'Check network connectivity',
          'Try again later'
        ]
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
      stats: stats || {},
      config: SYNC_CONFIG
    });
    
  } catch (error) {
    console.error('Failed to get sync status:', error.message);
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
