import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry
async function fetchWithRetry(url, options, maxRetries = 2) {
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

// POST /api/patients/sync - Sync patients from external API to database
export async function POST(request) {
  const startTime = Date.now();
  let syncLogId = null;
  
  try {
    // Create sync log entry
    const logResult = await query(
      `INSERT INTO sync_logs (entity_type, status, started_at) 
       VALUES ('patients', 'started', NOW())`
    );
    syncLogId = logResult.insertId;
    
    // Fetch patients from external API
    // The API might have pagination, so we need to handle that
    let allPatients = [];
    let currentPage = 1;
    const patientsPerPage = 100;
    const maxPages = 100; // Safety limit
    
    // Update sync log
    await query(
      `UPDATE sync_logs SET status = 'in_progress' WHERE id = ?`,
      [syncLogId]
    );
    
    while (currentPage <= maxPages) {
      const apiUrl = `https://api-ehr-klinik.doctorphc.id/pasien?page=${currentPage}&limit=${patientsPerPage}`;
      
      try {
        const response = await fetchWithRetry(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          break;
        }
        
        const data = await response.json();
        
        // Process the response - handle different formats
        let pagePatients = [];
        if (data.data && Array.isArray(data.data)) {
          pagePatients = data.data;
        } else if (Array.isArray(data)) {
          pagePatients = data;
        }
        
        if (pagePatients.length === 0) {
          break;
        }
        
        allPatients = allPatients.concat(pagePatients);
        
        // If we got less than requested, we're at the end
        if (pagePatients.length < patientsPerPage) {
          break;
        }
        
        currentPage++;
        
        // Small delay between pages
        await delay(300);
        
      } catch (error) {
        break;
      }
    }
    
    // Step 3: Save to database
    let insertedCount = 0;
    let updatedCount = 0;
    
    // Process in batches
    const dbBatchSize = 50;
    for (let i = 0; i < allPatients.length; i += dbBatchSize) {
      const batch = allPatients.slice(i, i + dbBatchSize);
      
      for (const patient of batch) {
        try {
          // Get external ID
          const externalId = patient.id || patient.ID || patient.nik || patient.NIK;
          if (!externalId) {
            continue;
          }
          
          // Check if patient already exists
          const existing = await query(
            `SELECT id FROM patients WHERE external_id = ? LIMIT 1`,
            [String(externalId)]
          );
          
          // Prepare data - handle different field name formats
          const rawGender = patient.gender || patient.JENIS_KELAMIN || patient.Jenis_Kelamin || '';
          // Map gender to ENUM format (handle Indonesian: Laki-laki/Perempuan)
          let mappedGender = 'MALE'; // default
          if (rawGender) {
            const genderLower = String(rawGender).toLowerCase();
            if (genderLower.includes('perempuan') || genderLower.includes('wanita') || 
                genderLower.includes('female') || genderLower.includes('woman') || 
                genderLower.includes('f') && genderLower.length <= 6) {
              mappedGender = 'FEMALE';
            } else {
              mappedGender = 'MALE';
            }
          }
          
          const patientData = {
            external_id: String(externalId),
            mrn: patient.mrn || patient.MRN || patient.mr_number || null,
            nik: patient.nik || patient.NIK || null,
            name: patient.name || patient.NAMA || patient.Nama_Pasien || null,
            nip: patient.nip || patient.NIP || null,
            no_peserta: patient.no_peserta || patient.No_Peserta || patient.NO_PESERTA || null,
            nama_peserta: patient.nama_peserta || patient.Nama_Peserta || patient.NAMA_PESERTA || null,
            bagian: patient.bagian || patient.Bagian || patient.BAGIAN || patient.department || patient.Department || null,
            birth_date: patient.birthDate || patient.birth_date || patient.TANGGAL_LAHIR || patient.Tgl_Lahir || null,
            gender: mappedGender,
            address: patient.address || patient.ALAMAT || patient.Alamat || null,
            phone: patient.phone || patient.TELEPON || patient.No_Telepon || patient.no_telepon || null,
            email: patient.email || patient.EMAIL || null,
            blood_type: patient.bloodType || patient.GOLONGAN_DARAH || patient.Gol_Darah || null,
            religion: patient.religion || patient.AGAMA || null,
            marital_status: patient.maritalStatus || patient.STATUS_PERKAWINAN || patient.Status_Kawin || null,
            occupation: patient.occupation || patient.PEKERJAAN || null,
            insurance: patient.insurance || patient.ASURANSI || patient.insurance_number || null,
            emergency_contact: patient.emergencyContact || patient.KONTAK_DARURAT || null,
            status: patient.status || patient.STATUS || 'active',
            clinic_id: patient.clinic_id || patient.CLINIC_ID || null,
            external_created_at: patient.created_at || patient.CREATED_AT || null,
            external_updated_at: patient.updated_at || patient.UPDATED_AT || null,
          };
          
          if (existing.length > 0) {
            // Update existing record
            await query(
              `UPDATE patients SET
                mrn = ?,
                nik = ?,
                name = ?,
                nip = ?,
                no_peserta = ?,
                nama_peserta = ?,
                bagian = ?,
                birthdate = ?,
                gender = ?,
                address = ?,
                phone = ?,
                email = ?,
                insurance_number = ?,
                updated_at = NOW()
              WHERE external_id = ?`,
              [
                patientData.mrn,
                patientData.nik,
                patientData.name,
                patientData.nip,
                patientData.no_peserta,
                patientData.nama_peserta,
                patientData.bagian,
                patientData.birth_date,
                patientData.gender,
                patientData.address,
                patientData.phone,
                patientData.email,
                patientData.insurance,
                patientData.external_id
              ]
            );
            updatedCount++;
          } else {
            // Insert new record
            await query(
              `INSERT INTO patients (
                external_id, mrn, nik, name, nip, no_peserta, nama_peserta, bagian,
                birthdate, gender, address, phone, email, insurance_number,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                patientData.external_id,
                patientData.mrn,
                patientData.nik,
                patientData.name,
                patientData.nip,
                patientData.no_peserta,
                patientData.nama_peserta,
                patientData.bagian,
                patientData.birth_date,
                patientData.gender,
                patientData.address,
                patientData.phone,
                patientData.email,
                patientData.insurance
              ]
            );
            insertedCount++;
          }
        } catch (error) {
          // Error processing patient
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
        completed_at = NOW(),
        duration_seconds = ?
      WHERE id = ?`,
      [allPatients.length, updatedCount, insertedCount, durationSeconds, syncLogId]
    );
    
    // Update sync schedule
    await query(
      `UPDATE sync_schedules SET
        last_sync_at = NOW(),
        next_sync_at = DATE_ADD(NOW(), INTERVAL interval_minutes MINUTE)
      WHERE entity_type = 'patients'`
    );
    
    return NextResponse.json({
      success: true,
      message: 'Patients sync completed successfully',
      stats: {
        fetched: allPatients.length,
        inserted: insertedCount,
        updated: updatedCount,
        duration_seconds: durationSeconds
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
        message: 'Patients sync failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// GET /api/patients/sync - Get sync status and logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get latest sync logs
    const logs = await query(
      `SELECT * FROM sync_logs 
       WHERE entity_type = 'patients' 
       ORDER BY started_at DESC 
       LIMIT ?`,
      [limit]
    );
    
    // Get sync schedule
    const [schedule] = await query(
      `SELECT * FROM sync_schedules WHERE entity_type = 'patients'`
    );
    
    // Get cache statistics
    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_patients,
        MAX(synced_at) as last_synced,
        COUNT(DISTINCT nik) as unique_nik,
        COUNT(DISTINCT nip) as unique_nip
       FROM patients`
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

