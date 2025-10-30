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

// POST /api/doctors/reset-sync - Reset and sync doctors from external API
export async function POST(request) {
  try {

    // Step 1: Get count of existing doctors
    const existingDoctors = await query('SELECT COUNT(*) as count FROM doctors');
    const existingCount = existingDoctors[0].count;

    // Step 2: Delete all existing doctors
    await query('DELETE FROM doctors');

    // Step 3: Fetch data from external API
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

    // Step 4: Calculate pages to fetch
    const desiredRecords = 10000;
    const recordsPerPage = 1000;
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);

    // Step 5: Fetch multiple pages in parallel
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
    
    // Step 6: Combine all pages
    let rawVisits = [];
    pageResults.forEach(pageData => {
      if (pageData.data && Array.isArray(pageData.data)) {
        rawVisits = rawVisits.concat(pageData.data);
      }
    });

    // Step 7: Extract unique doctors from visits with their clinics
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

    // Step 8: Create or find clinics in database
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

    // Step 9: Save all doctors to database with clinic association
    let addedCount = 0;
    let errorCount = 0;
    
    for (const doctor of uniqueDoctors) {
      try {
        // Get clinic_id for the doctor's primary clinic (first clinic in the list)
        const primaryClinicName = doctor.clinics[0];
        const clinicId = primaryClinicName ? clinicIdMap.get(primaryClinicName) : null;
        
        // Insert new doctor with clinic_id
        await query(
          `INSERT INTO doctors (name, specialist, license_number, clinic_id, created_at, updated_at) 
           VALUES (?, NULL, NULL, ?, NOW(), NOW())`,
          [doctor.name, clinicId]
        );
        
        addedCount++;
      } catch (error) {
        console.error(`Error saving doctor ${doctor.name}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reset dan sinkronisasi selesai: ${existingCount} dokter lama dihapus, ${addedCount} dokter baru ditambahkan dengan data klinik`,
      stats: {
        deleted: existingCount,
        totalDoctors: uniqueDoctors.length,
        totalClinics: uniqueClinics.length,
        added: addedCount,
        errors: errorCount,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan reset dan sinkronisasi dokter dari API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

