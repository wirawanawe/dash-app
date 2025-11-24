#!/usr/bin/env node

/**
 * Script untuk mengambil data kunjungan dari API eksternal
 * dan menyimpannya ke database lokal dengan pagination 1000 record per page
 * 
 * Usage:
 *   node scripts/sync-visits-paginated.js                                    # Sync semua data
 *   node scripts/sync-visits-paginated.js --today                           # Sync hanya hari ini
 *   node scripts/sync-visits-paginated.js --date 2025-01-15                 # Sync tanggal tertentu
 *   node scripts/sync-visits-paginated.js --start-date 2025-01-01           # Sync dari tanggal tertentu
 *   node scripts/sync-visits-paginated.js --start-date 2025-01-01 --end-date 2025-01-31  # Sync range tanggal
 */

import { query, closePool } from '../lib/db.js';
import { fetchJson } from '../lib/sync/shared/fetch.js';
import { normalizePrescriptions } from '../lib/sync/shared/normalize.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const RECORDS_PER_PAGE = 1000;
// Use limit 1000 when filtering by date (API supports tglawal/tglakhir parameters)
const RECORDS_PER_PAGE_WITH_DATE = 1000;

// Parse command line arguments
const args = process.argv.slice(2);
const isTodayOnly = args.includes('--today');
const dateIndex = args.indexOf('--date');
const startDateIndex = args.indexOf('--start-date');
const endDateIndex = args.indexOf('--end-date');

// Support both single date and date range
const targetDate = dateIndex !== -1 && args[dateIndex + 1] 
  ? args[dateIndex + 1] 
  : (isTodayOnly ? new Date().toISOString().split('T')[0] : null);
const startDate = startDateIndex !== -1 && args[startDateIndex + 1] ? args[startDateIndex + 1] : null;
const endDate = endDateIndex !== -1 && args[endDateIndex + 1] ? args[endDateIndex + 1] : null;

/**
 * Extract records from API response
 */
function extractRecordsFromApiResponse(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.Data)) {
    return data.Data;
  }

  if (Array.isArray(data.records)) {
    return data.records;
  }

  console.warn('⚠️  Unexpected API response format:', JSON.stringify(data).substring(0, 500));
  return [];
}

/**
 * Transform API visit record to database format
 */
function transformVisitRecord(visit) {
  const externalId = visit.ID || visit.No_Kunjungan;
  if (!externalId) {
    throw new Error('Missing external_id');
  }

  const normalizedPrescriptions = normalizePrescriptions(
    visit.Resep || visit.resep || visit.Prescription || visit.prescription
  );

  return {
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
    visit_time: null,
    doctor_name: visit.Dokter || null,
    doctor_id: null,
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
    kode_poli: visit.Kode_Poli || null,
    nama_poli: visit.Nama_Poli || null,
    no_antrian: visit.No_Antrian || null,
    jenis_kunjungan: visit.Jenis_Kunjungan || null,
    cara_bayar: visit.Cara_Bayar || null,
    external_created_at: visit.audittrail?.created_at || null,
    external_updated_at: visit.audittrail?.updated_at || null,
    prescriptions: JSON.stringify(normalizedPrescriptions),
    prescription_count: normalizedPrescriptions.length,
  };
}

/**
 * Save visit records to cache table
 */
async function saveVisitRecords(visitsData) {
  if (!visitsData || visitsData.length === 0) {
    return { inserted: 0, failed: 0 };
  }

  let inserted = 0;
  let failed = 0;

  // Process in chunks to avoid query size limits
  const chunkSize = 100;
  
  for (let i = 0; i < visitsData.length; i += chunkSize) {
    const chunk = visitsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    
    try {
      for (const visitData of chunk) {
        try {
          await query(
            `INSERT INTO visits_cache (
              external_id, visit_number, unique_id,
              patient_nik, patient_name, patient_nip,
              patient_no_peserta, patient_nama_peserta,
              patient_gender, patient_birth_date, patient_department,
              diagnosis, complaint, treatment, notes, assessment,
              status, clinic, room, visit_date,
              doctor_name, facility_code, facility_name,
              physical_exam, prescriptions, prescription_count,
              external_created_at, external_updated_at,
              synced_at
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
              prescriptions = VALUES(prescriptions),
              prescription_count = VALUES(prescription_count),
              external_created_at = VALUES(external_created_at),
              external_updated_at = VALUES(external_updated_at),
              synced_at = NOW()`,
            [
              visitData.external_id ?? null,
              visitData.visit_number ?? null,
              visitData.unique_id ?? null,
              visitData.patient_nik ?? null,
              visitData.patient_name ?? null,
              visitData.patient_nip ?? null,
              visitData.patient_no_peserta ?? null,
              visitData.patient_nama_peserta ?? null,
              visitData.patient_gender ?? null,
              visitData.patient_birth_date ?? null,
              visitData.patient_department ?? null,
              visitData.diagnosis ?? null,
              visitData.complaint ?? null,
              visitData.treatment ?? null,
              visitData.notes ?? null,
              visitData.assessment ?? null,
              visitData.status ?? null,
              visitData.clinic ?? null,
              visitData.room ?? null,
              visitData.visit_date ?? null,
              visitData.doctor_name ?? null,
              visitData.facility_code ?? null,
              visitData.facility_name ?? null,
              visitData.physical_exam ?? null,
              visitData.prescriptions ?? null,
              visitData.prescription_count ?? 0,
              visitData.external_created_at ?? null,
              visitData.external_updated_at ?? null,
            ]
          );
          inserted++;
        } catch (error) {
          console.error(`❌ Failed to save visit ${visitData.external_id}:`, error.message);
          failed++;
        }
      }

      if (chunkNum % 10 === 0 || i + chunkSize >= visitsData.length) {
        console.log(`   Processed chunk ${chunkNum} (${inserted} inserted, ${failed} failed so far)`);
      }
    } catch (error) {
      console.error(`❌ Error processing chunk ${chunkNum}:`, error.message);
      failed += chunk.length;
    }
  }

  return { inserted, failed };
}

/**
 * Fetch visits from API with pagination
 */
async function fetchVisitsPage(page, filterDate = null, filterStartDate = null, filterEndDate = null) {
  // Use smaller limit when filtering by date to avoid API timeout
  const limit = (filterDate || filterStartDate || filterEndDate) ? RECORDS_PER_PAGE_WITH_DATE : RECORDS_PER_PAGE;
  let url = `${API_BASE_URL}?limit=${limit}&page=${page}`;
  
  // Add date filter parameters to URL if specified
  // API uses tglawal and tglakhir parameters for date filtering
  if (filterDate) {
    // Single date: use same date for both tglawal and tglakhir
    url += `&tglawal=${filterDate}&tglakhir=${filterDate}`;
    console.log(`📡 Fetching page ${page} with date filter: tglawal=${filterDate}&tglakhir=${filterDate}...`);
  } else if (filterStartDate && filterEndDate) {
    // Date range: use startDate as tglawal and endDate as tglakhir
    url += `&tglawal=${filterStartDate}&tglakhir=${filterEndDate}`;
    console.log(`📡 Fetching page ${page} with date range filter: tglawal=${filterStartDate}&tglakhir=${filterEndDate}...`);
  } else if (filterStartDate) {
    // Start date only: use startDate for both (or use a far future date for tglakhir)
    const futureDate = new Date(filterStartDate);
    futureDate.setFullYear(futureDate.getFullYear() + 1); // Add 1 year as end date
    const endDateStr = futureDate.toISOString().split('T')[0];
    url += `&tglawal=${filterStartDate}&tglakhir=${endDateStr}`;
    console.log(`📡 Fetching page ${page} with start date filter: tglawal=${filterStartDate}&tglakhir=${endDateStr}...`);
  } else {
    console.log(`📡 Fetching page ${page}...`);
  }
  
  try {
    const data = await fetchJson(
      url,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      3, // maxRetries
      180000 // timeout: 3 minutes
    );

    let records = extractRecordsFromApiResponse(data);
    
    // API sudah melakukan filtering berdasarkan tglawal dan tglakhir di URL
    // Tapi kita tetap melakukan client-side verification sebagai backup
    // Menggunakan kolom Tgl_Kunjungan sebagai referensi utama
    if (records.length > 0 && (filterDate || filterStartDate || filterEndDate)) {
      const totalBeforeFilter = records.length;
      
      if (filterDate) {
        // Single date filter - verify berdasarkan kolom Tgl_Kunjungan
        const filterDateStr = filterDate;
        records = records.filter(record => {
          // Prioritas: Tgl_Kunjungan (kolom utama dari API)
          const visitDate = record.Tgl_Kunjungan || record.tgl_kunjungan || record.visit_date;
          if (!visitDate) return false;
          // Handle both date and datetime formats
          // "2025-01-02" or "2025-01-02 07:17:33" -> extract "2025-01-02"
          const recordDateStr = visitDate.split(' ')[0].split('T')[0];
          return recordDateStr === filterDateStr;
        });
        console.log(`   ✅ Verified berdasarkan Tgl_Kunjungan: ${totalBeforeFilter} → ${records.length} records sesuai tanggal ${filterDate}`);
      } else if (filterStartDate && filterEndDate) {
        // Date range filter - verify berdasarkan kolom Tgl_Kunjungan
        records = records.filter(record => {
          // Prioritas: Tgl_Kunjungan (kolom utama dari API)
          const visitDate = record.Tgl_Kunjungan || record.tgl_kunjungan || record.visit_date;
          if (!visitDate) return false;
          // Handle both date and datetime formats
          const recordDateStr = visitDate.split(' ')[0].split('T')[0];
          return recordDateStr >= filterStartDate && recordDateStr <= filterEndDate;
        });
        console.log(`   ✅ Verified berdasarkan Tgl_Kunjungan: ${totalBeforeFilter} → ${records.length} records sesuai range ${filterStartDate} sampai ${filterEndDate}`);
      } else if (filterStartDate) {
        // Start date only (greater than or equal) - verify berdasarkan kolom Tgl_Kunjungan
        records = records.filter(record => {
          // Prioritas: Tgl_Kunjungan (kolom utama dari API)
          const visitDate = record.Tgl_Kunjungan || record.tgl_kunjungan || record.visit_date;
          if (!visitDate) return false;
          // Handle both date and datetime formats
          const recordDateStr = visitDate.split(' ')[0].split('T')[0];
          return recordDateStr >= filterStartDate;
        });
        console.log(`   ✅ Verified berdasarkan Tgl_Kunjungan: ${totalBeforeFilter} → ${records.length} records sesuai dari tanggal ${filterStartDate}`);
      }
      
      // Show sample dates for debugging
      if (records.length > 0) {
        const sampleDates = records.slice(0, 3).map(r => {
          const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
          return visitDate ? visitDate.split(' ')[0].split('T')[0] : 'N/A';
        });
        console.log(`   📅 Sample dates dari Tgl_Kunjungan: ${sampleDates.join(', ')}`);
      } else {
        console.log(`   ⚠️  Tidak ada data yang sesuai filter tanggal di halaman ini`);
      }
    }
    
    // Try to extract pagination metadata from response
    const paginationInfo = {
      total: data.total || data.Total || data.totalRecords || data.total_records || null,
      totalPages: data.totalPages || data.TotalPages || data.total_pages || null,
      currentPage: data.currentPage || data.CurrentPage || data.current_page || data.page || page,
      perPage: data.perPage || data.PerPage || data.per_page || data.limit || RECORDS_PER_PAGE,
    };
    
    console.log(`✅ Fetched ${records.length} records from page ${page}`);
    if (paginationInfo.total !== null) {
      console.log(`   📊 API reports: Total=${paginationInfo.total}, TotalPages=${paginationInfo.totalPages || 'N/A'}`);
    }
    
    return { records, pagination: paginationInfo };
  } catch (error) {
    console.error(`❌ Error fetching page ${page}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  // Determine sync mode description
  let syncMode = 'semua data';
  if (startDate && endDate) {
    syncMode = `tanggal ${startDate} sampai ${endDate}`;
  } else if (targetDate) {
    syncMode = isTodayOnly ? 'hari ini' : `tanggal ${targetDate}`;
  } else if (startDate) {
    syncMode = `dari tanggal ${startDate}`;
  }
  
  console.log('🚀 Starting visits sync with pagination');
  console.log(`📅 Mode: Sync ${syncMode}`);
  console.log('═══════════════════════════════════════════\n');
  
  const startTime = Date.now();
  let totalInserted = 0;
  let totalFailed = 0;
  let currentPage = 1;
  let hasMorePages = true;
  let consecutiveEmptyPages = 0;
  const maxConsecutiveEmpty = 3; // Stop after 3 consecutive empty pages
  let totalRecordsFromAPI = null;
  let totalPagesFromAPI = null;

  try {
    // Step 1: Only truncate if syncing all data, otherwise just update
    if (!targetDate && !startDate && !endDate) {
      console.log('🗑️  Truncating visits_cache table (full sync)...');
      await query('TRUNCATE TABLE visits_cache');
      console.log('✅ Table truncated successfully\n');
    } else {
      console.log(`📅 Sync mode: Only syncing data for ${syncMode}`);
      console.log('ℹ️  Existing cache data will be preserved and updated');
      console.log('ℹ️  Using API date filter parameters (tglawal & tglakhir)...\n');
    }

    // Step 2: Fetch and save data page by page
    // If filtering by date, we need to search through pages until we find matching dates
    const effectiveLimit = (targetDate || startDate || endDate) ? RECORDS_PER_PAGE_WITH_DATE : RECORDS_PER_PAGE;
    console.log(`📥 Fetching data (${effectiveLimit} records per page)...\n`);
    
    // For date filtering, set a reasonable max pages to search (to avoid infinite loop)
    // Since API orders from newest to oldest, data for today should be in first few pages
    const maxPagesToSearch = (targetDate || startDate || endDate) ? 50 : null;

    while (hasMorePages) {
      try {
        const result = await fetchVisitsPage(currentPage, targetDate, startDate, endDate);
        let records = result.records;
        const pagination = result.pagination;
        
        // Update total records/pages from API if available
        if (pagination.total !== null && totalRecordsFromAPI === null) {
          totalRecordsFromAPI = pagination.total;
          console.log(`📊 API reports total records: ${totalRecordsFromAPI}`);
        }
        if (pagination.totalPages !== null && totalPagesFromAPI === null) {
          totalPagesFromAPI = pagination.totalPages;
          console.log(`📊 API reports total pages: ${totalPagesFromAPI}`);
        }
        
        // Filter data berdasarkan Tgl_Kunjungan SEBELUM memproses lebih lanjut
        // Hanya proses data yang sesuai dengan filter tanggal
        if ((targetDate || startDate || endDate) && records.length > 0) {
          const beforeFilter = records.length;
          
          // Filter berdasarkan Tgl_Kunjungan
          records = records.filter(record => {
            const visitDate = record.Tgl_Kunjungan || record.tgl_kunjungan || record.visit_date;
            if (!visitDate) return false;
            const recordDateStr = visitDate.split(' ')[0].split('T')[0];
            
            if (targetDate) {
              return recordDateStr === targetDate;
            } else if (startDate && endDate) {
              return recordDateStr >= startDate && recordDateStr <= endDate;
            } else if (startDate) {
              return recordDateStr >= startDate;
            }
            return true;
          });
          
          console.log(`   🔍 Filter berdasarkan Tgl_Kunjungan: ${beforeFilter} → ${records.length} records sesuai filter`);
          
          // Jika setelah filter tidak ada data yang sesuai, cek apakah perlu lanjut ke halaman berikutnya
          if (records.length === 0) {
            // Cek tanggal terbaru di halaman ini untuk menentukan apakah perlu lanjut
            const allDates = result.records
              .map(r => {
                const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
                if (!visitDate) return null;
                return visitDate.split(' ')[0].split('T')[0];
              })
              .filter(Boolean)
              .sort();
            
            if (allDates.length > 0) {
              const oldestDate = allDates[0];
              const newestDate = allDates[allDates.length - 1];
              
              // Jika semua tanggal di halaman ini sudah melewati target tanggal, stop
              if (targetDate && oldestDate > targetDate) {
                console.log(`🛑 Stopping: Semua tanggal di halaman ini (${oldestDate} - ${newestDate}) sudah melewati target tanggal (${targetDate})`);
                hasMorePages = false;
                break;
              }
              
              if (startDate && endDate && oldestDate > endDate) {
                console.log(`🛑 Stopping: Semua tanggal di halaman ini (${oldestDate} - ${newestDate}) sudah melewati end date (${endDate})`);
                hasMorePages = false;
                break;
              }
              
              if (startDate && !endDate && oldestDate > startDate && !allDates.some(d => d >= startDate)) {
                console.log(`🛑 Stopping: Tidak ada data yang sesuai filter tanggal di halaman ini`);
                hasMorePages = false;
                break;
              }
              
              console.log(`   ⏭️  Tidak ada data sesuai filter di halaman ini, lanjut ke halaman berikutnya...`);
            }
            
            consecutiveEmptyPages++;
            if ((targetDate || startDate || endDate) && consecutiveEmptyPages >= 2) {
              const dateFilter = startDate && endDate ? `${startDate} to ${endDate}` : (targetDate || startDate || endDate);
              console.log(`🛑 Stopping: Tidak ada data sesuai filter untuk ${dateFilter} setelah ${consecutiveEmptyPages} halaman`);
              hasMorePages = false;
              break;
            }
            
            currentPage++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        if (records.length === 0) {
          consecutiveEmptyPages++;
          console.log(`⚠️  Page ${currentPage} returned no records (consecutive empty: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          
          // If syncing specific date/range and we got empty pages, stop earlier
          if ((targetDate || startDate || endDate) && consecutiveEmptyPages >= 2) {
            const dateFilter = startDate && endDate ? `${startDate} to ${endDate}` : (targetDate || startDate || endDate);
            console.log(`🛑 Stopping early: No more data for ${dateFilter} (2 consecutive empty pages)`);
            hasMorePages = false;
            break;
          }
          
          // For date filtering, also check max pages limit
          if (maxPagesToSearch && currentPage >= maxPagesToSearch) {
            console.log(`🛑 Stopping: Reached max pages limit (${maxPagesToSearch}) for date filtering`);
            hasMorePages = false;
            break;
          }
          
          // If we know total pages from API, check if we've reached it
          if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
            console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
            hasMorePages = false;
            break;
          }
          
          // Stop if too many consecutive empty pages
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive empty pages`);
            hasMorePages = false;
            break;
          }
          
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Reset consecutive empty pages counter when we get records
        consecutiveEmptyPages = 0;

        // PENTING: Data sudah difilter di fetchVisitsPage berdasarkan Tgl_Kunjungan
        // records di sini HANYA berisi data yang sesuai dengan filter tanggal dari API
        // Sekarang kita akan memastikan HANYA data terfilter yang masuk ke database
        
        // Final verification sebelum transform: Pastikan semua records sesuai filter
        if ((targetDate || startDate || endDate) && records.length > 0) {
          // Double check - filter sekali lagi untuk memastikan 100% akurat
          const beforeFinalCheck = records.length;
          records = records.filter(record => {
            const visitDate = record.Tgl_Kunjungan || record.tgl_kunjungan || record.visit_date;
            if (!visitDate) return false;
            const recordDateStr = visitDate.split(' ')[0].split('T')[0];
            
            if (targetDate) {
              return recordDateStr === targetDate;
            } else if (startDate && endDate) {
              return recordDateStr >= startDate && recordDateStr <= endDate;
            } else if (startDate) {
              return recordDateStr >= startDate;
            }
            return true;
          });
          
          if (beforeFinalCheck !== records.length) {
            console.warn(`   ⚠️  Final check: Removed ${beforeFinalCheck - records.length} records that didn't match filter`);
          }
          
          // Get the date range dari data yang sudah terfilter
          const datesInPage = records
            .map(r => {
              const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
              if (!visitDate) return null;
              return visitDate.split(' ')[0].split('T')[0];
            })
            .filter(Boolean)
            .sort();
          
          if (datesInPage.length > 0) {
            const oldestDate = datesInPage[0];
            const newestDate = datesInPage[datesInPage.length - 1];
            console.log(`   ✅ Data yang akan di-sync (SUDAH TERFILTER dari API): ${records.length} records dengan tanggal ${oldestDate} sampai ${newestDate}`);
            
            // Check if we've gone past the target date range
            if (targetDate && oldestDate > targetDate) {
              console.log(`🛑 Stopping: Oldest date in filtered page (${oldestDate}) is after target date (${targetDate})`);
              hasMorePages = false;
              break;
            }
            
            if (startDate && endDate && oldestDate > endDate) {
              console.log(`🛑 Stopping: Oldest date in filtered page (${oldestDate}) is after end date (${endDate})`);
              hasMorePages = false;
              break;
            }
          }
        }

        // Transform records - HANYA data yang sudah terfilter dari API
        const transformedRecords = [];
        for (const record of records) {
          try {
            // Final verification sebelum transform - pastikan sesuai filter
            if (targetDate || startDate || endDate) {
              const visitDate = record.Tgl_Kunjungan || record.tgl_kunjungan || record.visit_date;
              if (visitDate) {
                const recordDateStr = visitDate.split(' ')[0].split('T')[0];
                let shouldInclude = false;
                
                if (targetDate && recordDateStr === targetDate) {
                  shouldInclude = true;
                } else if (startDate && endDate && recordDateStr >= startDate && recordDateStr <= endDate) {
                  shouldInclude = true;
                } else if (startDate && !endDate && recordDateStr >= startDate) {
                  shouldInclude = true;
                }
                
                if (!shouldInclude) {
                  console.warn(`   ⚠️  Skipping record ${record.ID || record.No_Kunjungan} - date ${recordDateStr} doesn't match filter`);
                  totalFailed++;
                  continue;
                }
              }
            }
            
            transformedRecords.push(transformVisitRecord(record));
          } catch (error) {
            console.warn(`⚠️  Failed to transform record:`, error.message);
            totalFailed++;
          }
        }

        // Save to database - HANYA data yang sudah terfilter dari API dan terverifikasi
        if (transformedRecords.length > 0) {
          console.log(`💾 Saving ${transformedRecords.length} records yang SUDAH TERFILTER ke database...`);
          const saveResult = await saveVisitRecords(transformedRecords);
          totalInserted += saveResult.inserted;
          totalFailed += saveResult.failed;

          console.log(`✅ Page ${currentPage} completed: ${saveResult.inserted} inserted (HANYA data terfilter dari API), ${saveResult.failed} failed`);
        } else {
          console.log(`⚠️  Page ${currentPage}: Tidak ada data yang sesuai filter tanggal untuk di-sync`);
        }
        
        // Show progress if we know total from API
        if (totalRecordsFromAPI !== null) {
          const progress = ((totalInserted / totalRecordsFromAPI) * 100).toFixed(1);
          console.log(`   📊 Progress: ${totalInserted}/${totalRecordsFromAPI} records (${progress}%)\n`);
        } else {
          console.log(`   📊 Total inserted so far: ${totalInserted} records\n`);
        }

        // Check if we should continue
        // If we know total pages from API, check against that
        if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
          console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
          hasMorePages = false;
        } else if (records.length < RECORDS_PER_PAGE) {
          // If we got less than expected, might be last page (but continue if API says there's more)
          if (totalPagesFromAPI === null || currentPage < totalPagesFromAPI) {
            console.log(`⚠️  Page ${currentPage} returned ${records.length} records (less than ${RECORDS_PER_PAGE}), but continuing...`);
          } else {
            console.log(`✅ Reached last page (got ${records.length} records, expected ${RECORDS_PER_PAGE})`);
            hasMorePages = false;
          }
        }
        
        if (hasMorePages) {
          currentPage++;
          // Small delay between pages to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error.message);
        consecutiveEmptyPages++;
        
        // Retry logic: if error, try next page up to max consecutive empty
        if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
          console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive errors/empty pages`);
          hasMorePages = false;
        } else {
          console.log(`⚠️  Retrying next page... (consecutive errors: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay on error
        }
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 Sync Summary');
    console.log('═══════════════════════════════════════════');
    console.log(`Total pages processed: ${currentPage - 1}`);
    console.log(`Total records inserted: ${totalInserted}`);
    console.log(`Total records failed: ${totalFailed}`);
    console.log(`Duration: ${duration} seconds`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

