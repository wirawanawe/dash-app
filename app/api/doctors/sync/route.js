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
    console.log('[Doctors Sync] Starting sync from external API...');
    
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
    
    console.log(`[Doctors Sync] Total visits in external DB: ${externalTotal}`);
    
    // Step 2: Fetch multiple pages to get all unique doctors
    const desiredRecords = 10000;
    const recordsPerPage = 1000;
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);
    
    console.log(`[Doctors Sync] Fetching ${pagesToFetch} pages from page ${startPage} to ${totalPagesInExternal}`);
    
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
    
    console.log(`[Doctors Sync] Fetched ${rawVisits.length} visits from external API`);
    
    // Step 3: Extract unique doctors from visits
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
    console.log(`[Doctors Sync] Found ${uniqueDoctors.length} unique doctors`);
    
    // Step 4: Save doctors to database (skip if already exists)
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const doctor of uniqueDoctors) {
      try {
        // Check if doctor already exists
        const existing = await query(
          'SELECT id FROM doctors WHERE name = ? LIMIT 1',
          [doctor.name]
        );
        
        if (existing.length > 0) {
          skippedCount++;
          continue;
        }
        
        // Insert new doctor
        await query(
          `INSERT INTO doctors (name, specialist, license_number, created_at, updated_at) 
           VALUES (?, NULL, NULL, NOW(), NOW())`,
          [doctor.name]
        );
        
        addedCount++;
      } catch (error) {
        console.error(`[Doctors Sync] Error saving doctor ${doctor.name}:`, error);
      }
    }
    
    console.log(`[Doctors Sync] Completed: ${addedCount} added, ${skippedCount} skipped (already exist)`);
    
    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${addedCount} dokter baru ditambahkan, ${skippedCount} dokter sudah ada`,
      stats: {
        total: uniqueDoctors.length,
        added: addedCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    console.error('[Doctors Sync] Error:', error);
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

