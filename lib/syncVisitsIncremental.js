// Incremental Sync Module - Hanya sync data terbaru
// Lebih efisien dan tidak membebani CPU

import { query } from './db.js';

/**
 * Helper function untuk fetch dengan retry
 */
async function fetchWithRetry(url, options, maxRetries = 2, timeoutMs = 30000) {
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
    }
  }
}

const normalizePrescriptions = (value) => {
  if (!value) return [];

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
        // ignore JSON parse errors
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

/**
 * Get last sync timestamp from database
 */
async function getLastSyncTimestamp() {
  try {
    const result = await query(
      `SELECT MAX(external_updated_at) as last_sync 
       FROM visits 
       WHERE external_updated_at IS NOT NULL`
    );
    
    return result[0]?.last_sync || null;
  } catch (error) {
    console.error('Failed to get last sync timestamp:', error.message);
    return null;
  }
}

/**
 * Sync incremental - hanya ambil data yang updated setelah last sync
 * Ini jauh lebih efisien karena data yang diproses lebih sedikit
 */
async function syncIncremental(options = {}) {
  const startTime = Date.now();
  const config = {
    batchSize: options.batchSize || 50,        // Reduced from 100 to 50
    maxRecords: options.maxRecords || 500,     // Reduced from 1000 to 500
    delayBetweenBatches: options.delayBetweenBatches || 2000,  // Increased from 500ms to 2s
    delayBetweenPages: options.delayBetweenPages || 1000,  // Add delay between API calls
  };
  
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors = [];
  const columnDefinitions = {
    prescriptions: "ADD COLUMN prescriptions JSON NULL COMMENT 'Resep data from API'",
    prescription_count: "ADD COLUMN prescription_count INT DEFAULT 0",
  };

  const ensureColumns = async () => {
    const columns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'visits'`
    );
    const existing = new Set(columns.map((col) => col.COLUMN_NAME));
    for (const [column, clause] of Object.entries(columnDefinitions)) {
      if (!existing.has(column)) {
        try {
          await query(`ALTER TABLE visits ${clause}`);
        } catch (error) {
          if (!error.message.includes('Duplicate column name')) {
            throw error;
          }
        }
      }
    }
  };
  
  try {
    await ensureColumns();

    // Get last sync time
    const lastSyncTime = await getLastSyncTimestamp();
    
    console.log(`🔄 Starting incremental sync (last sync: ${lastSyncTime || 'never'})`);
    
    // Fetch only new/updated records from API
    // Note: Ini assumes API mendukung filter berdasarkan updated_at
    // Jika tidak, kita bisa fallback ke fetch recent pages
    
    let allRecords = [];
    let currentPage = 1;
    const recordsPerPage = 200;
    
    // Strategy: Fetch beberapa pages terbaru (data terbaru biasanya di page terakhir)
    // Kita fetch sampai ketemu data yang sudah ada di database
    
    while (allRecords.length < config.maxRecords) {
      const apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${currentPage}&limit=${recordsPerPage}`;
      
      console.log(`📥 Fetching page ${currentPage}...`);
      
      try {
        const response = await fetchWithRetry(
          apiUrl,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
          2,
          30000
        );
        
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          break;
        }
        
        // Filter hanya records yang lebih baru dari last sync
        let newRecords = data.data;
        
        if (lastSyncTime) {
          newRecords = data.data.filter(record => {
            const recordUpdatedAt = record.audittrail?.updated_at;
            if (!recordUpdatedAt) return true; // Include if no timestamp
            
            return new Date(recordUpdatedAt) > new Date(lastSyncTime);
          });
          
          // Jika tidak ada new records di page ini, kita sudah selesai
          if (newRecords.length === 0) {
            console.log(`✅ No more new records, stopping at page ${currentPage}`);
            break;
          }
        }
        
        allRecords = allRecords.concat(newRecords);
        
        // Jika dapat less than recordsPerPage, berarti sudah habis
        if (data.data.length < recordsPerPage) {
          break;
        }
        
        currentPage++;
        
        // Throttling between pages to reduce API load
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenPages));
        
      } catch (error) {
        console.error(`Failed to fetch page ${currentPage}:`, error.message);
        break;
      }
    }
    
    console.log(`📊 Fetched ${allRecords.length} new/updated records`);
    
    // Process records in smaller batches with aggressive throttling
    for (let i = 0; i < allRecords.length; i += config.batchSize) {
      const batch = allRecords.slice(i, i + config.batchSize);
      
      console.log(`💾 Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(allRecords.length / config.batchSize)} (CPU throttled)`);
      
      // Use bulk insert for better performance
      const insertPromises = [];
      
      for (const visit of batch) {
        try {
          const externalId = visit.ID || visit.No_Kunjungan;
          if (!externalId) {
            continue;
          }
          
          // Prepare data
          const normalizedPrescriptions = normalizePrescriptions(
            visit.Resep || visit.resep || visit.Prescription || visit.prescription
          );

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
          
          // Queue the upsert operation
          const insertPromise = query(
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
          ).then(result => {
            if (result.affectedRows === 1) {
              insertedCount++;
            } else if (result.affectedRows === 2) {
              updatedCount++;
            }
          }).catch(error => {
            failedCount++;
            if (errors.length < 5) {
              errors.push({
                external_id: visit?.ID || visit?.No_Kunjungan,
                error: error.message,
              });
            }
          });
          
          insertPromises.push(insertPromise);
          
        } catch (error) {
          failedCount++;
          if (errors.length < 5) {
            errors.push({
              external_id: visit?.ID || visit?.No_Kunjungan,
              error: error.message,
            });
          }
        }
      }
      
      // Wait for all inserts in this batch to complete
      await Promise.all(insertPromises);
      
      // Aggressive CPU throttling between batches
      if (i + config.batchSize < allRecords.length) {
        console.log(`⏸️  CPU throttling: waiting ${config.delayBetweenBatches}ms...`);
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    const result = {
      success: true,
      message: 'Incremental sync completed',
      stats: {
        fetched: allRecords.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
        duration_seconds: duration,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log(`✅ Incremental sync completed:`, result.stats);
    
    return result;
    
  } catch (error) {
    console.error('❌ Incremental sync failed:', error.message);
    
    return {
      success: false,
      message: 'Incremental sync failed',
      error: error.message,
      stats: {
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
      },
    };
  }
}

export const syncModule = {
  syncIncremental,
};

