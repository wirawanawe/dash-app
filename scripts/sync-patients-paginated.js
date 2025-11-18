#!/usr/bin/env node

/**
 * Script untuk mengambil data pasien dari API eksternal
 * dan menyimpannya ke database lokal dengan pagination 1000 record per page
 * 
 * Usage:
 *   node scripts/sync-patients-paginated.js
 */

import { query, closePool } from '../lib/db.js';
import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/pasien';
const RECORDS_PER_PAGE = 1000;

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
 * Transform API patient record to database format
 */
function transformPatientRecord(patient) {
  const externalId = patient.id || patient.ID || patient.nik || patient.NIK;
  if (!externalId) {
    throw new Error('Missing external_id');
  }

  // Map gender to ENUM format (handle Indonesian: Laki-laki/Perempuan)
  const rawGender = patient.gender || patient.JENIS_KELAMIN || patient.Jenis_Kelamin || '';
  let mappedGender = 'MALE'; // default
  if (rawGender) {
    const genderLower = String(rawGender).toLowerCase();
    if (genderLower.includes('perempuan') || genderLower.includes('wanita') || 
        genderLower.includes('female') || genderLower.includes('woman') || 
        (genderLower.includes('f') && genderLower.length <= 6)) {
      mappedGender = 'FEMALE';
    } else {
      mappedGender = 'MALE';
    }
  }

  return {
    external_id: String(externalId),
    mrn: patient.mrn || patient.MRN || patient.mr_number || null,
    nik: patient.nik || patient.NIK || null,
    name: patient.name || patient.NAMA || patient.Nama_Pasien || null,
    nip: patient.nip || patient.NIP || null,
    no_peserta: patient.no_peserta || patient.No_Peserta || patient.NO_PESERTA || null,
    nama_peserta: patient.nama_peserta || patient.Nama_Peserta || patient.NAMA_PESERTA || null,
    bagian: patient.bagian || patient.Bagian || patient.BAGIAN || patient.department || patient.Department || null,
    birthdate: patient.birthDate || patient.birth_date || patient.TANGGAL_LAHIR || patient.Tgl_Lahir || null,
    gender: mappedGender,
    address: patient.address || patient.ALAMAT || patient.Alamat || null,
    phone: patient.phone || patient.TELEPON || patient.No_Telepon || patient.no_telepon || null,
    email: patient.email || patient.EMAIL || null,
    blood_type: patient.bloodType || patient.GOLONGAN_DARAH || patient.Gol_Darah || null,
    religion: patient.religion || patient.AGAMA || null,
    marital_status: patient.maritalStatus || patient.STATUS_PERKAWINAN || patient.Status_Kawin || null,
    occupation: patient.occupation || patient.PEKERJAAN || null,
    insurance_number: patient.insurance || patient.ASURANSI || patient.insurance_number || null,
    emergency_contact: patient.emergencyContact || patient.KONTAK_DARURAT || null,
    status: patient.status || patient.STATUS || 'active',
    clinic_id: patient.clinic_id || patient.CLINIC_ID || null,
    external_created_at: patient.created_at || patient.CREATED_AT || null,
    external_updated_at: patient.updated_at || patient.UPDATED_AT || null,
  };
}

/**
 * Save patient records to cache table
 */
async function savePatientRecords(patientsData) {
  if (!patientsData || patientsData.length === 0) {
    return { inserted: 0, failed: 0 };
  }

  let inserted = 0;
  let failed = 0;

  const chunkSize = 100;
  for (let i = 0; i < patientsData.length; i += chunkSize) {
    const chunk = patientsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;

    for (const patientData of chunk) {
      try {
        await query(
          `INSERT INTO patients_cache (
            external_id, mrn, nik, name, nip, no_peserta, nama_peserta,
            bagian, birth_date, gender, address, phone, email,
            blood_type, religion, marital_status, occupation,
            insurance_number, emergency_contact, status, clinic_id,
            external_created_at, external_updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            mrn = VALUES(mrn),
            nik = VALUES(nik),
            name = VALUES(name),
            nip = VALUES(nip),
            no_peserta = VALUES(no_peserta),
            nama_peserta = VALUES(nama_peserta),
            bagian = VALUES(bagian),
            birth_date = VALUES(birth_date),
            gender = VALUES(gender),
            address = VALUES(address),
            phone = VALUES(phone),
            email = VALUES(email),
            blood_type = VALUES(blood_type),
            religion = VALUES(religion),
            marital_status = VALUES(marital_status),
            occupation = VALUES(occupation),
            insurance_number = VALUES(insurance_number),
            emergency_contact = VALUES(emergency_contact),
            status = VALUES(status),
            clinic_id = VALUES(clinic_id),
            external_created_at = VALUES(external_created_at),
            external_updated_at = VALUES(external_updated_at),
            synced_at = NOW()`,
          [
            patientData.external_id ?? null,
            patientData.mrn ?? null,
            patientData.nik ?? null,
            patientData.name ?? null,
            patientData.nip ?? null,
            patientData.no_peserta ?? null,
            patientData.nama_peserta ?? null,
            patientData.bagian ?? null,
            patientData.birthdate ?? null,
            patientData.gender ?? null,
            patientData.address ?? null,
            patientData.phone ?? null,
            patientData.email ?? null,
            patientData.blood_type ?? null,
            patientData.religion ?? null,
            patientData.marital_status ?? null,
            patientData.occupation ?? null,
            patientData.insurance_number ?? null,
            patientData.emergency_contact ?? null,
            patientData.status ?? null,
            patientData.clinic_id ?? null,
            patientData.external_created_at ?? null,
            patientData.external_updated_at ?? null,
          ]
        );
        inserted++;
      } catch (error) {
        console.error(`❌ Failed to save patient ${patientData.external_id}:`, error.message);
        failed++;
      }
    }
    
    if (chunkNum % 10 === 0) {
      console.log(`   💾 Saved chunk ${chunkNum}: ${inserted} inserted, ${failed} failed`);
    }
  }
  
  return { inserted, failed };
}

/**
 * Fetch patients page from API
 */
async function fetchPatientsPage(page) {
  const url = `${API_BASE_URL}?limit=${RECORDS_PER_PAGE}&page=${page}`;
  console.log(`📡 Fetching page ${page} from ${url}`);
  
  try {
    const data = await fetchJson(
      url,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      3, // maxRetries
      180000 // timeout: 3 minutes
    );

    const records = extractRecordsFromApiResponse(data);
    
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
  console.log('🚀 Starting patients sync with pagination');
  console.log('═══════════════════════════════════════════\n');
  
  const startTime = Date.now();
  let totalInserted = 0;
  let totalFailed = 0;
  let currentPage = 1;
  let hasMorePages = true;
  let consecutiveEmptyPages = 0;
  const maxConsecutiveEmpty = 3;
  let totalRecordsFromAPI = null;
  let totalPagesFromAPI = null;

  try {
    // Step 1: Truncate patients_cache table
    console.log('🗑️  Truncating patients_cache table...');
    await query('TRUNCATE TABLE patients_cache');
    console.log('✅ Table truncated successfully\n');

    // Step 2: Fetch and save data page by page
    console.log(`📥 Fetching data (${RECORDS_PER_PAGE} records per page)...\n`);

    while (hasMorePages) {
      try {
        const result = await fetchPatientsPage(currentPage);
        const records = result.records;
        const pagination = result.pagination;
        
        if (pagination.total !== null && totalRecordsFromAPI === null) {
          totalRecordsFromAPI = pagination.total;
          console.log(`📊 API reports total records: ${totalRecordsFromAPI}`);
        }
        if (pagination.totalPages !== null && totalPagesFromAPI === null) {
          totalPagesFromAPI = pagination.totalPages;
          console.log(`📊 API reports total pages: ${totalPagesFromAPI}`);
        }
        
        if (records.length === 0) {
          consecutiveEmptyPages++;
          console.log(`⚠️  Page ${currentPage} returned no records (consecutive empty: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          
          if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
            console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
            hasMorePages = false;
            break;
          }
          
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive empty pages`);
            hasMorePages = false;
            break;
          }
          
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        consecutiveEmptyPages = 0;

        // Transform records
        const transformedRecords = [];
        for (const record of records) {
          try {
            transformedRecords.push(transformPatientRecord(record));
          } catch (error) {
            console.warn(`⚠️  Failed to transform record:`, error.message);
            totalFailed++;
          }
        }

        // Save to database
        console.log(`💾 Saving ${transformedRecords.length} records to database...`);
        const saveResult = await savePatientRecords(transformedRecords);
        totalInserted += saveResult.inserted;
        totalFailed += saveResult.failed;

        console.log(`✅ Page ${currentPage} completed: ${saveResult.inserted} inserted, ${saveResult.failed} failed`);
        
        if (totalRecordsFromAPI !== null) {
          const progress = ((totalInserted / totalRecordsFromAPI) * 100).toFixed(1);
          console.log(`   📊 Progress: ${totalInserted}/${totalRecordsFromAPI} records (${progress}%)\n`);
        } else {
          console.log(`   📊 Total inserted so far: ${totalInserted} records\n`);
        }

        // Check if we should continue
        if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
          console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
          hasMorePages = false;
        } else if (records.length < RECORDS_PER_PAGE) {
          if (totalPagesFromAPI === null || currentPage < totalPagesFromAPI) {
            console.log(`⚠️  Page ${currentPage} returned ${records.length} records (less than ${RECORDS_PER_PAGE}), but continuing...`);
          } else {
            console.log(`✅ Reached last page (got ${records.length} records, expected ${RECORDS_PER_PAGE})`);
            hasMorePages = false;
          }
        }
        
        if (hasMorePages) {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error.message);
        consecutiveEmptyPages++;
        
        if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
          console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive errors/empty pages`);
          hasMorePages = false;
        } else {
          console.log(`⚠️  Retrying next page... (consecutive errors: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 2000));
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

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

