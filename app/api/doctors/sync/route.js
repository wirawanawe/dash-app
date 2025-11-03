import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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
        throw error;
      }
      await delay(Math.pow(2, i) * 1000);
    }
  }
}

// POST /api/doctors/sync - Sync doctors from external API
export async function POST(request) {
  try {

    // Step 1: Get total count from visits API
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

    // Step 2: Fetch multiple pages to get all unique doctors
    const desiredRecords = 10000;
    const recordsPerPage = 1000;
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);

    // Fetch multiple pages in parallel
    const pageFetchPromises = [];
    for (let pageNum = startPage; pageNum <= totalPagesInExternal; pageNum++) {
      const apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${pageNum}&limit=${recordsPerPage}`;
      
      pageFetchPromises.push(
        fetchWithRetry(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).then(res => res.json())
      );
    }
    
    const pageResults = await Promise.all(pageFetchPromises);
    
    // Combine all pages
    let rawVisits = [];
    pageResults.forEach(pageData => {
      if (pageData.data && Array.isArray(pageData.data)) {
        rawVisits = rawVisits.concat(pageData.data);
      }
    });

    // Step 3: Extract unique doctors from visits with their clinics
    const doctorsMap = new Map();
    const clinicsMap = new Map(); // To track unique clinics
    
    rawVisits.forEach(visit => {
      const doctorName = visit.Dokter;
      const clinicName = visit.Klinik; // e.g., "UMUM", "GIGI", etc.
      const facilityCode = visit.Fasilitas_Kesehatan?.[0]?.Kode || null;
      const facilityName = visit.Fasilitas_Kesehatan?.[0]?.Nama_Faskes || null;
      
      // Track clinics
      if (clinicName && clinicName !== "-" && !clinicsMap.has(clinicName)) {
        clinicsMap.set(clinicName, {
          name: clinicName,
          facilityCode: facilityCode,
          facilityName: facilityName,
        });
      }
      
      // Track doctors with their clinic
      if (doctorName && doctorName !== "-") {
        if (!doctorsMap.has(doctorName)) {
          doctorsMap.set(doctorName, {
            name: doctorName,
            clinics: new Set(),
          });
        }
        
        // Add clinic to doctor's clinics
        if (clinicName && clinicName !== "-") {
          doctorsMap.get(doctorName).clinics.add(clinicName);
        }
      }
    });
    
    const uniqueDoctors = Array.from(doctorsMap.values()).map(doctor => ({
      ...doctor,
      clinics: Array.from(doctor.clinics),
    }));
    
    const uniqueClinics = Array.from(clinicsMap.values());

    // Step 4: Create or find clinics in database
    const clinicIdMap = new Map(); // clinic name -> clinic id
    
    for (const clinic of uniqueClinics) {
      try {
        // Check if clinic already exists by name
        const existing = await query(
          'SELECT id FROM clinics WHERE name = ? LIMIT 1',
          [clinic.name]
        );
        
        if (existing.length > 0) {
          clinicIdMap.set(clinic.name, existing[0].id);
        } else {
          // Create new clinic
          const result = await query(
            `INSERT INTO clinics (name, code, address, city, phone, is_active, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
              clinic.facilityName || clinic.name,
              clinic.facilityCode || null,
              '-',
              '-',
              '-'
            ]
          );
          clinicIdMap.set(clinic.name, result.insertId);
        }
      } catch (error) {
        console.error(`Error creating/finding clinic ${clinic.name}:`, error);
      }
    }

    // Step 5: Save doctors to database with clinic association
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doctor of uniqueDoctors) {
      try {
        // Get clinic_id for the doctor's primary clinic (first clinic in the list)
        const primaryClinicName = doctor.clinics[0];
        const clinicId = primaryClinicName ? clinicIdMap.get(primaryClinicName) : null;
        
        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both insert and update atomically
        // Only update clinic_id if the new value is not null (preserve existing clinic_id)
        const result = await query(
          `INSERT INTO doctors (name, specialist, license_number, clinic_id, created_at, updated_at) 
           VALUES (?, NULL, NULL, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             clinic_id = COALESCE(?, clinic_id),
             updated_at = NOW()`,
          [doctor.name, clinicId, clinicId]
        );
        
        // affectedRows: 1 = inserted, 2 = updated, 0 = no change
        if (result.affectedRows === 1) {
          addedCount++;
        } else if (result.affectedRows === 2) {
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error saving doctor ${doctor.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${addedCount} dokter baru ditambahkan, ${updatedCount} dokter diperbarui dengan klinik, ${skippedCount} dokter sudah ada`,
      stats: {
        totalDoctors: uniqueDoctors.length,
        totalClinics: uniqueClinics.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan sinkronisasi dokter dari API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

