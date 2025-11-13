import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { invalidateTableCache, responseCache } from "@/lib/cache";

export const dynamic = 'force-dynamic';

// Configuration presets tuned for different sync strategies
const SYNC_PRESETS = {
  limited: {
    INITIAL_TIMEOUT: 60000,
    DATA_PAGE_TIMEOUT: 90000,
    MAX_RETRIES: 2,
    CONCURRENT_PAGES: 1,
    DELAY_BETWEEN_BATCHES: 3000,
    MAX_RECORDS: 500,
    RECORDS_PER_PAGE: 50,
    ALLOW_PARTIAL_SYNC: true,
    MAX_FAILURES_ALLOWED: 10,
    DB_BATCH_SIZE: 30,
    FETCH_RECENT_ONLY: true,
  },
  full: {
    INITIAL_TIMEOUT: 60000,
    DATA_PAGE_TIMEOUT: 120000,
    MAX_RETRIES: 2,
    CONCURRENT_PAGES: 2,
    DELAY_BETWEEN_BATCHES: 200,
    MAX_RECORDS: Number.MAX_SAFE_INTEGER,
    RECORDS_PER_PAGE: 400,
    ALLOW_PARTIAL_SYNC: true,
    MAX_FAILURES_ALLOWED: 20,
    DB_BATCH_SIZE: 60,
    FETCH_RECENT_ONLY: false,
  },
  aggressive: {
    INITIAL_TIMEOUT: 60000,
    DATA_PAGE_TIMEOUT: 120000,
    MAX_RETRIES: 2,
    CONCURRENT_PAGES: 3,
    DELAY_BETWEEN_BATCHES: 100,
    MAX_RECORDS: Number.MAX_SAFE_INTEGER,
    RECORDS_PER_PAGE: 5000,
    ALLOW_PARTIAL_SYNC: true,
    MAX_FAILURES_ALLOWED: 60,
    DB_BATCH_SIZE: 200,
    FETCH_RECENT_ONLY: false,
  },
};

const toPositiveInteger = (value, fallback) => {
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return fallback;
  }
  return Math.max(1, Math.floor(num));
};

const parseMaxRecords = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'string' && value.toLowerCase() === 'all') {
    return Number.MAX_SAFE_INTEGER;
  }
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const serializeConfig = (config) => ({
  ...config,
  MAX_RECORDS: Number.isFinite(config.MAX_RECORDS) ? config.MAX_RECORDS : 'all',
});

const normalizePrescriptions = (value) => {
  if (!value) return [];

  const parseSegment = (segment, overrides = {}) => {
    const raw = (segment || "").trim();
    if (!raw) return null;

    let name = raw;
    let quantity = "";
    let unit = "";

    const parenMatch = raw.match(/\(([^)]+)\)\s*$/);
    if (parenMatch) {
      name = raw.slice(0, parenMatch.index).trim();
      const inner = parenMatch[1].trim();
      const tokens = inner.split(/\s+/).filter(Boolean);

      if (tokens.length >= 2) {
        const qtyIndex = tokens.findIndex(
          (token, idx) => /^\d+(\.\d+)?$/.test(token) && idx < tokens.length - 1
        );
        if (qtyIndex !== -1) {
          quantity = tokens[qtyIndex];
          unit = tokens.slice(qtyIndex + 1).join(" ") || "";
        } else if (/^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
          quantity = tokens[tokens.length - 1];
          unit = tokens.slice(0, tokens.length - 1).join(" ");
        } else {
          unit = tokens.join(" ");
        }
      } else if (tokens.length === 1) {
        if (/^\d+(\.\d+)?$/.test(tokens[0])) {
          quantity = tokens[0];
        } else {
          unit = tokens[0];
        }
      }
    }

    return {
      name: overrides.name || name || raw,
      quantity: overrides.quantity || quantity,
      unit: overrides.unit || unit,
      raw: overrides.raw || raw,
    };
  };

  const pushRaw = (list, raw, overrides = {}) => {
    if (!raw) return;
    raw
      .split(/;/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const parsed = parseSegment(part, { ...overrides, raw: part });
        if (parsed) list.push(parsed);
      });
  };

  const result = [];

  const handleValue = (input) => {
    if (!input) return;

    if (Array.isArray(input)) {
      input.forEach((item) => {
        if (item && typeof item === "object") {
          const rawString = (item.raw || item.name || "").trim();
          if (rawString && rawString.includes(";")) {
            pushRaw(result, rawString, { ...item, name: undefined });
          } else {
            const parsed = parseSegment(rawString || item.raw || item.name || "", item);
            if (parsed) result.push(parsed);
          }
        } else if (typeof item === "string") {
          pushRaw(result, item);
        }
      });
      return;
    }

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          handleValue(parsed);
          return;
        }
      } catch {
        // ignore
      }
      pushRaw(result, trimmed);
      return;
    }

    if (typeof input === "object") {
      handleValue(Object.values(input));
    }
  };

  handleValue(value);
  return result;
};

const COLUMN_DEFINITIONS = {
  external_id: "ADD COLUMN external_id VARCHAR(100) UNIQUE COMMENT 'ID from external API'",
  visit_number: "ADD COLUMN visit_number VARCHAR(100) COMMENT 'No_Kunjungan from API'",
  unique_id: "ADD COLUMN unique_id VARCHAR(100) COMMENT 'Unique ID from API'",
  patient_nik: "ADD COLUMN patient_nik VARCHAR(100)",
  patient_name: "ADD COLUMN patient_name VARCHAR(255)",
  patient_nip: "ADD COLUMN patient_nip VARCHAR(100)",
  patient_no_peserta: "ADD COLUMN patient_no_peserta VARCHAR(100)",
  patient_nama_peserta: "ADD COLUMN patient_nama_peserta VARCHAR(255)",
  patient_gender: "ADD COLUMN patient_gender VARCHAR(50)",
  patient_birth_date: "ADD COLUMN patient_birth_date DATE",
  patient_department: "ADD COLUMN patient_department VARCHAR(255)",
  diagnosis: "ADD COLUMN diagnosis TEXT",
  complaint: "ADD COLUMN complaint TEXT",
  treatment: "ADD COLUMN treatment TEXT",
  notes: "ADD COLUMN notes TEXT",
  assessment: "ADD COLUMN assessment TEXT",
  status: "ADD COLUMN status VARCHAR(100)",
  clinic: "ADD COLUMN clinic VARCHAR(255)",
  room: "ADD COLUMN room VARCHAR(255)",
  visit_date: "ADD COLUMN visit_date DATETIME",
  doctor_name: "ADD COLUMN doctor_name VARCHAR(255)",
  facility_code: "ADD COLUMN facility_code VARCHAR(100)",
  facility_name: "ADD COLUMN facility_name VARCHAR(255)",
  physical_exam: "ADD COLUMN physical_exam JSON",
  external_created_at: "ADD COLUMN external_created_at TIMESTAMP NULL",
  external_updated_at: "ADD COLUMN external_updated_at TIMESTAMP NULL",
  synced_at: "ADD COLUMN synced_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP",
  prescriptions: "ADD COLUMN prescriptions JSON NULL COMMENT 'Resep data from API'",
  prescription_count: "ADD COLUMN prescription_count INT DEFAULT 0",
};

const SYNC_LOG_COLUMN_DEFINITIONS = {
  total_records: "ADD COLUMN total_records INT DEFAULT 0",
  processed_records: "ADD COLUMN processed_records INT DEFAULT 0",
  progress_percent: "ADD COLUMN progress_percent INT DEFAULT 0",
  current_page: "ADD COLUMN current_page INT DEFAULT 0",
  total_pages: "ADD COLUMN total_pages INT DEFAULT 0",
};

async function ensureSyncLogColumns() {
  const columns = await query(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'sync_logs'`
  );
  const existing = new Set(columns.map((col) => col.COLUMN_NAME));
  for (const [column, clause] of Object.entries(SYNC_LOG_COLUMN_DEFINITIONS)) {
    if (!existing.has(column)) {
      try {
        await query(`ALTER TABLE sync_logs ${clause}`);
      } catch (error) {
        if (!error.message.includes('Duplicate column name')) {
          throw error;
        }
      }
    }
  }
}

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
  
  let totalRecords = 0;
  let totalPages = 0;
  let fetchedRecords = 0;
  let insertedCount = 0;
  let updatedCount = 0;
  let currentPagePointer = 0;
  const PROGRESS_UPDATE_INTERVAL = 1000;
  let lastProgressUpdate = 0;
  let countFallbackUsed = false;

  const updateSyncLogProgress = async (force = false) => {
    if (!syncLogId) {
      return;
    }
    const now = Date.now();
    if (!force && now - lastProgressUpdate < PROGRESS_UPDATE_INTERVAL) {
      return;
    }
    lastProgressUpdate = now;
    const processed = Math.max(
      insertedCount + updatedCount,
      Math.min(
        fetchedRecords,
        totalRecords > 0 ? totalRecords : fetchedRecords
      )
    );
    const percent =
      totalRecords > 0
        ? Math.min(100, Math.round((processed / totalRecords) * 100))
        : processed > 0
        ? 100
        : 0;

    try {
      await query(
        `UPDATE sync_logs SET
          status = 'in_progress',
          total_records = ?,
          records_fetched = ?,
          records_inserted = ?,
          records_updated = ?,
          records_failed = ?,
          processed_records = ?,
          progress_percent = ?,
          current_page = ?,
          total_pages = ?
        WHERE id = ?`,
        [
          totalRecords,
          fetchedRecords,
          insertedCount,
          updatedCount,
          failedCount,
          processed,
          percent,
          currentPagePointer,
          totalPages,
          syncLogId,
        ]
      );
    } catch (error) {
      console.error('Failed to update sync progress:', error.message);
    }
  };

  const { searchParams } = new URL(request.url);
  const modeParam = (searchParams.get("mode") || "limited").toLowerCase();
  const mode = SYNC_PRESETS[modeParam] ? modeParam : "limited";
  let config = { ...SYNC_PRESETS[mode] };

  config.MAX_RECORDS = parseMaxRecords(searchParams.get("maxRecords"), config.MAX_RECORDS);
  config.RECORDS_PER_PAGE = Math.max(
    10,
    toPositiveInteger(searchParams.get("pageSize"), config.RECORDS_PER_PAGE)
  );
  config.DELAY_BETWEEN_BATCHES = toPositiveInteger(searchParams.get("delayMs"), config.DELAY_BETWEEN_BATCHES);
  config.CONCURRENT_PAGES = Math.max(
    1,
    Math.min(10, toPositiveInteger(searchParams.get("concurrentPages"), config.CONCURRENT_PAGES))
  );
  config.DB_BATCH_SIZE = Math.max(10, Math.min(400, toPositiveInteger(searchParams.get("dbBatchSize"), config.DB_BATCH_SIZE)));
  config.MAX_FAILURES_ALLOWED = Math.max(
    1,
    Math.min(100, toPositiveInteger(searchParams.get("maxFailures"), config.MAX_FAILURES_ALLOWED))
  );

  await ensureSyncLogColumns();

  try {
    console.log(`⚡ Starting visits sync (${mode === 'full' ? 'full dataset' : 'limited'})...`);
    console.log('⚙️  Effective config:', serializeConfig(config));

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
        config.MAX_RETRIES,
        config.INITIAL_TIMEOUT
      );
      
      if (!countResponse.ok) {
        throw new Error(`Failed to fetch count: ${countResponse.status}`);
      }
      
      const countData = await countResponse.json();
      externalTotal = countData["total pasien"] || countData.total || 0;
    } catch (error) {
      console.error('Failed to get total count:', error.message);
      
      if (config.ALLOW_PARTIAL_SYNC) {
        externalTotal = config.MAX_RECORDS;
        countFallbackUsed = true;
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
    const effectiveMaxRecords = Number.isFinite(config.MAX_RECORDS) ? config.MAX_RECORDS : externalTotal;
    const desiredRecords = Math.min(effectiveMaxRecords, externalTotal);
    const recordsPerPage = config.RECORDS_PER_PAGE;
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const pagesToFetch = Math.max(1, Math.ceil(desiredRecords / recordsPerPage));

    let startPage = 1;
    let endPage = Math.min(totalPagesInExternal, pagesToFetch);

    if (config.FETCH_RECENT_ONLY) {
      endPage = totalPagesInExternal;
      startPage = Math.max(1, endPage - pagesToFetch + 1);
    } else {
      startPage = 1;
      endPage = totalPagesInExternal;
    }

    totalRecords = desiredRecords;
    totalPages = endPage - startPage + 1;
    await updateSyncLogProgress(true);

    let rawVisits = [];
    perfStats.totalPages = endPage - startPage + 1;
    
    // Fetch pages in CONCURRENT batches for MAXIMUM SPEED
    for (let batchStart = startPage; batchStart <= endPage; batchStart += config.CONCURRENT_PAGES) {
      const batchEnd = Math.min(batchStart + config.CONCURRENT_PAGES - 1, endPage);
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
          config.MAX_RETRIES,
          config.DATA_PAGE_TIMEOUT
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
          const pageDataArray = result.data.data;
          fetchedRecords += pageDataArray.length;
          rawVisits = rawVisits.concat(pageDataArray);
          currentPagePointer = Math.max(currentPagePointer, result.pageNum);
        } else {
          pagesFailed++;
          failedCount++;
          if (sampleErrors.length < 5) {
            sampleErrors.push({
              page: result.pageNum,
              error: result.error || 'Unknown error',
            });
          }
        }
      });
      
      await updateSyncLogProgress();
      
      // Check if too many failures
      if (pagesFailed >= config.MAX_FAILURES_ALLOWED) {
        break;
      }
      
      // Short delay between batches
      if (batchEnd < endPage) {
        await delay(config.DELAY_BETWEEN_BATCHES);
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
      'external_created_at','external_updated_at','synced_at','prescriptions','prescription_count'
    ];
    const columnsResult = await query(`SHOW COLUMNS FROM visits`);
    let existingColumns = new Set(columnsResult.map(c => c.Field));
    const missing = requiredColumns.filter(c => !existingColumns.has(c));
    
    if (missing.length > 0) {
      for (const column of missing) {
        if (COLUMN_DEFINITIONS[column]) {
          try {
            await query(`ALTER TABLE visits ${COLUMN_DEFINITIONS[column]}`);
            existingColumns.add(column);
            console.log(`ℹ️  Added missing column '${column}' to visits table`);
          } catch (alterError) {
            console.error(`Failed to add column ${column}:`, alterError.message);
            if (alterError.message && alterError.message.includes('Duplicate column name')) {
              existingColumns.add(column);
            }
          }
        }
      }
      
      if (missing.some(column => !existingColumns.has(column))) {
        const refreshedColumns = await query(`SHOW COLUMNS FROM visits`);
        existingColumns = new Set(refreshedColumns.map(c => c.Field));
      }
    }

    const stillMissing = requiredColumns.filter(c => !existingColumns.has(c));
    if (stillMissing.length > 0) {
      throw new Error(`Missing columns: ${stillMissing.join(', ')}`);
    }

    if (countFallbackUsed) {
      totalRecords = rawVisits.length;
      totalPages = perfStats.totalPages;
    }

    if (totalRecords === 0) {
      totalRecords = rawVisits.length;
    }
    if (totalPages === 0) {
      totalPages = perfStats.totalPages;
    }
    await updateSyncLogProgress(true);

    // Step 4: Save to database
    const dbStartTime = Date.now();
    
    for (let i = 0; i < rawVisits.length; i += config.DB_BATCH_SIZE) {
      const batch = rawVisits.slice(i, i + config.DB_BATCH_SIZE);
      
      for (const visit of batch) {
        try {
          const externalId = visit.ID || visit.No_Kunjungan;
          if (!externalId) {
            continue;
          }
          
          const normalizedPrescriptions = parsePrescriptionsField(
            visit.Resep || visit.resep || visit.Prescription || visit.prescription
          );
          
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
            prescriptions: JSON.stringify(normalizedPrescriptions),
            prescription_count: normalizedPrescriptions.length,
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
              prescriptions, prescription_count, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
              prescriptions = VALUES(prescriptions),
              prescription_count = VALUES(prescription_count),
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
              visitData.external_updated_at,
              visitData.prescriptions,
              visitData.prescription_count
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
      
      await updateSyncLogProgress();
    }
    
    const dbTime = Date.now() - dbStartTime;
    perfStats.dbTime = dbTime;
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    currentPagePointer = totalPages;
    const processedTotal = Math.max(
      insertedCount + updatedCount,
      Math.min(fetchedRecords, totalRecords || fetchedRecords)
    );
    const finalPercent =
      totalRecords > 0
        ? Math.min(100, Math.round((processedTotal / totalRecords) * 100))
        : processedTotal > 0
        ? 100
        : 0;

    await updateSyncLogProgress(true);
    
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
        total_records = ?,
        processed_records = ?,
        progress_percent = ?,
        current_page = ?,
        total_pages = ?,
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
        totalRecords,
        processedTotal,
        finalPercent,
        currentPagePointer,
        totalPages,
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
    // Invalidate caches so new data is visible immediately
    try {
      invalidateTableCache('visits');
      responseCache.clear();
    } catch (cacheError) {
      console.error('Failed to invalidate cache after sync:', cacheError);
    }

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
        total_records: totalRecords,
        processed_records: processedTotal,
        progress_percent: finalPercent,
        pages_failed: pagesFailed,
        duration_seconds: durationSeconds,
        partial_sync: pagesFailed > 0,
        performance: {
          api_time_ms: perfStats.apiTime,
          db_time_ms: perfStats.dbTime,
          records_per_second: Math.round(rawVisits.length / durationSeconds),
          total_pages: perfStats.totalPages,
          concurrent_pages: config.CONCURRENT_PAGES,
        }
      },
      sampleErrors: sampleErrors.length > 0 ? sampleErrors : undefined
    };
    
    response.logId = syncLogId;
    
    return NextResponse.json(response, { 
      status: pagesFailed > 0 ? 207 : 200
    });
    
  } catch (error) {
    console.error('Sync failed:', error.message);

    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    
    // Update sync log with error
    if (syncLogId) {
      const processedTotal = Math.max(
        insertedCount + updatedCount,
        Math.min(fetchedRecords, totalRecords || fetchedRecords)
      );
      const failurePercent =
        totalRecords > 0
          ? Math.min(99, Math.round((processedTotal / totalRecords) * 100))
          : processedTotal > 0
          ? 99
          : 0;

      await query(
        `UPDATE sync_logs SET
          status = 'failed',
          records_fetched = ?,
          records_updated = ?,
          records_inserted = ?,
          records_failed = ?,
          total_records = ?,
          processed_records = ?,
          progress_percent = ?,
          current_page = ?,
          total_pages = ?,
          error_message = ?,
          completed_at = NOW(),
          duration_seconds = ?
        WHERE id = ?`,
        [
          fetchedRecords,
          updatedCount,
          insertedCount,
          failedCount,
          totalRecords,
          processedTotal,
          failurePercent,
          currentPagePointer,
          totalPages,
          error.message,
          durationSeconds,
          syncLogId
        ]
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Visits sync failed',
        error: error.message,
        logId: syncLogId,
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
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const statusFilter = searchParams.get('status');
    const logId = searchParams.get('id');
    const latest = searchParams.get('latest');
    
    // Get latest sync logs
    let safeLimit = Math.max(1, Math.min(100, Number.isNaN(limitParam) ? 10 : limitParam));
    if (latest === '1' || latest === 'true') {
      safeLimit = 1;
    }
    
    const conditions = ['entity_type = ?'];
    const params = ['visits'];
    
    if (statusFilter) {
      conditions.push('status = ?');
      params.push(statusFilter);
    }
    
    if (logId) {
      conditions.push('id = ?');
      params.push(logId);
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const logs = await query(
      `SELECT 
         id,
         entity_type,
         status,
         records_fetched,
         records_updated,
         records_inserted,
         records_failed,
         total_records,
         processed_records,
         progress_percent,
         current_page,
         total_pages,
         error_message,
         started_at,
         completed_at,
         duration_seconds
       FROM sync_logs
       ${whereClause}
       ORDER BY started_at DESC 
       LIMIT ${safeLimit}`,
      params
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
      config: {
        limited: serializeConfig(SYNC_PRESETS.limited),
        full: serializeConfig(SYNC_PRESETS.full),
        aggressive: serializeConfig(SYNC_PRESETS.aggressive),
        defaultMode: 'limited',
      },
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
