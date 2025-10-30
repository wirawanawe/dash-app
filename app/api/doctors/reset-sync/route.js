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
    console.log('[Doctors Reset-Sync] Starting reset and sync from external API...');
    
    // Step 1: Get count of existing doctors
    const existingDoctors = await query('SELECT COUNT(*) as count FROM doctors');
    const existingCount = existingDoctors[0].count;
    
    console.log(`[Doctors Reset-Sync] Found ${existingCount} existing doctors, will be deleted`);
    
    // Step 2: Delete all existing doctors
    await query('DELETE FROM doctors');
    console.log('[Doctors Reset-Sync] All existing doctors deleted');
    
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
    
    console.log(`[Doctors Reset-Sync] Total visits in external DB: ${externalTotal}`);
    
    // Step 4: Calculate pages to fetch
    const desiredRecords = 10000;
    const recordsPerPage = 1000;
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);
    
    console.log(`[Doctors Reset-Sync] Fetching ${pagesToFetch} pages from page ${startPage} to ${totalPagesInExternal}`);
    
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
    
    console.log(`[Doctors Reset-Sync] Fetched ${rawVisits.length} visits from external API`);
    
    // Step 7: Extract unique doctors from visits
    const doctorsMap = new Map();
    
    rawVisits.forEach(visit => {
      const doctorName = visit.Dokter;
      
      if (doctorName && doctorName !== "-" && !doctorsMap.has(doctorName)) {
        doctorsMap.set(doctorName, {
          name: doctorName,
        });
      }
    });
    
    const uniqueDoctors = Array.from(doctorsMap.values());
    console.log(`[Doctors Reset-Sync] Found ${uniqueDoctors.length} unique doctors`);
    
    // Step 8: Save all doctors to database
    let addedCount = 0;
    let errorCount = 0;
    
    for (const doctor of uniqueDoctors) {
      try {
        // Insert new doctor
        await query(
          `INSERT INTO doctors (name, specialist, license_number, created_at, updated_at) 
           VALUES (?, NULL, NULL, NOW(), NOW())`,
          [doctor.name]
        );
        
        addedCount++;
      } catch (error) {
        console.error(`[Doctors Reset-Sync] Error saving doctor ${doctor.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`[Doctors Reset-Sync] Completed: ${existingCount} deleted, ${addedCount} added, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Reset dan sinkronisasi selesai: ${existingCount} dokter lama dihapus, ${addedCount} dokter baru ditambahkan`,
      stats: {
        deleted: existingCount,
        total: uniqueDoctors.length,
        added: addedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('[Doctors Reset-Sync] Error:', error);
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

