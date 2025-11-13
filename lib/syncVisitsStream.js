// Stream-based Sync - Ultra Low CPU Usage
// Process data in small chunks dengan maksimal throttling

import { query } from './db.js';

/**
 * Fetch dengan timeout dan retry yang lebih agresif
 */
async function fetchWithTimeout(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      }
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

const normalizePrescriptions = (value) => {
  if (!value) return [];

  const result = [];

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

  const pushRaw = (raw, overrides = {}) => {
    if (!raw) return;
    raw
      .split(/;/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const parsed = parseSegment(part, { ...overrides, raw: part });
        if (parsed) {
          result.push(parsed);
        }
      });
  };

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        pushRaw(item);
      } else if (typeof item === "object") {
        const rawString = (item.raw || item.name || "").trim();
        if (rawString && rawString.includes(";")) {
          pushRaw(rawString, { ...item, name: undefined });
        } else {
          const parsed = parseSegment(rawString || item.raw || item.name || "", item);
          if (parsed) {
            result.push(parsed);
          }
        }
      }
    });
    return result;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return result;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizePrescriptions(parsed);
      }
    } catch {
      // ignore JSON parse errors
    }
    pushRaw(trimmed);
    return result;
  }

  if (typeof value === "object") {
    pushRaw(Object.values(value).join("; "));
  }

  return result;
};

/**
 * Stream-based incremental sync
 *極端に CPU friendly - Process 1 record at a time with throttling
 */
async function syncStreamIncremental(options = {}) {
  const startTime = Date.now();
  const config = {
    recordsPerPage: options.recordsPerPage || 50,      // Small pages
    maxPages: options.maxPages || 5,                   // Limit pages
    delayPerRecord: options.delayPerRecord || 100,     // 100ms per record
    delayBetweenPages: options.delayBetweenPages || 3000,  // 3s between pages
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
    console.log('🔄 Starting stream-based incremental sync...');
    console.log(`⚙️  Config: ${config.recordsPerPage} records/page, ${config.maxPages} max pages, ${config.delayPerRecord}ms delay/record`);
    
    await ensureColumns();
    
    // Get last sync time
    const lastSyncResult = await query(
      `SELECT MAX(external_updated_at) as last_sync FROM visits WHERE external_updated_at IS NOT NULL`
    );
    const lastSyncTime = lastSyncResult[0]?.last_sync || null;
    
    console.log(`📅 Last sync: ${lastSyncTime || 'never'}`);
    
    // Process pages one by one (no concurrency!)
    for (let pageNum = 1; pageNum <= config.maxPages; pageNum++) {
      console.log(`📄 Fetching page ${pageNum}/${config.maxPages}...`);
      
      try {
        // Fetch one page
        const apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${pageNum}&limit=${config.recordsPerPage}`;
        const response = await fetchWithTimeout(apiUrl, 30000);
        
        if (!response.ok) {
          console.error(`❌ Failed to fetch page ${pageNum}: HTTP ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          console.log(`✅ No more data at page ${pageNum}`);
          break;
        }
        
        // Filter new records only
        let newRecords = data.data;
        if (lastSyncTime) {
          newRecords = data.data.filter(record => {
            const recordTime = record.audittrail?.updated_at;
            return !recordTime || new Date(recordTime) > new Date(lastSyncTime);
          });
        }
        
        console.log(`📊 Page ${pageNum}: ${data.data.length} total, ${newRecords.length} new records`);
        
        // If no new records, we're done
        if (newRecords.length === 0) {
          console.log(`✅ No new records found, stopping at page ${pageNum}`);
          break;
        }
        
        // Process records ONE BY ONE with throttling
        for (let i = 0; i < newRecords.length; i++) {
          const visit = newRecords[i];
          
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
              status: 'Selesai',
              clinic: visit.Klinik || null,
              room: visit.Klinik || null,
              visit_date: visit.Tgl_Kunjungan || null,
              doctor_name: visit.Dokter || null,
              facility_code: visit.Fasilitas_Kesehatan?.[0]?.Kode || null,
              facility_name: visit.Fasilitas_Kesehatan?.[0]?.Nama_Faskes || null,
              external_created_at: visit.audittrail?.created_at || null,
              external_updated_at: visit.audittrail?.updated_at || null,
              prescriptions: JSON.stringify(normalizedPrescriptions),
              prescription_count: normalizedPrescriptions.length,
            };
            
            // Insert ONE record at a time
            const result = await query(
              `INSERT INTO visits (
                external_id, visit_number, unique_id, patient_nik, patient_name, patient_nip,
                patient_no_peserta, patient_nama_peserta, patient_gender, patient_birth_date,
                patient_department, diagnosis, complaint, status, clinic, room, visit_date,
                doctor_name, facility_code, facility_name, external_created_at, external_updated_at,
                prescriptions, prescription_count, synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE
                visit_number = VALUES(visit_number),
                patient_name = VALUES(patient_name),
                diagnosis = VALUES(diagnosis),
                visit_date = VALUES(visit_date),
                doctor_name = VALUES(doctor_name),
                external_updated_at = VALUES(external_updated_at),
                prescriptions = VALUES(prescriptions),
                prescription_count = VALUES(prescription_count),
                synced_at = NOW()`,
              [
                visitData.external_id, visitData.visit_number, visitData.unique_id,
                visitData.patient_nik, visitData.patient_name, visitData.patient_nip,
                visitData.patient_no_peserta, visitData.patient_nama_peserta, visitData.patient_gender,
                visitData.patient_birth_date, visitData.patient_department, visitData.diagnosis,
                visitData.complaint, visitData.status, visitData.clinic, visitData.room,
                visitData.visit_date, visitData.doctor_name, visitData.facility_code,
                visitData.facility_name, visitData.external_created_at, visitData.external_updated_at,
                visitData.prescriptions, visitData.prescription_count
              ]
            );
            
            if (result.affectedRows === 1) {
              insertedCount++;
            } else if (result.affectedRows === 2) {
              updatedCount++;
            }
            
            // Log progress every 10 records
            if ((i + 1) % 10 === 0) {
              console.log(`   ⏳ Processed ${i + 1}/${newRecords.length} records (inserted: ${insertedCount}, updated: ${updatedCount})`);
            }
            
            // Throttle: Wait after EACH record to prevent CPU spike
            await new Promise(resolve => setTimeout(resolve, config.delayPerRecord));
            
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
        
        console.log(`✅ Page ${pageNum} complete: ${insertedCount} inserted, ${updatedCount} updated`);
        
        // Aggressive throttling between pages
        if (pageNum < config.maxPages && data.data.length === config.recordsPerPage) {
          console.log(`⏸️  CPU rest: waiting ${config.delayBetweenPages}ms before next page...`);
          await new Promise(resolve => setTimeout(resolve, config.delayBetweenPages));
        }
        
      } catch (error) {
        console.error(`❌ Error on page ${pageNum}:`, error.message);
        // Continue to next page instead of failing completely
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`✅ Stream sync complete: ${insertedCount} inserted, ${updatedCount} updated in ${duration}s`);
    
    return {
      success: true,
      message: 'Stream-based incremental sync completed',
      stats: {
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
        duration_seconds: duration,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
    
  } catch (error) {
    console.error('❌ Stream sync failed:', error.message);
    
    return {
      success: false,
      message: 'Stream sync failed',
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
  syncIncremental: syncStreamIncremental,
};

