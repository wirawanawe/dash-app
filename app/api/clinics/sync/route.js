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

// POST /api/clinics/sync - Sync clinics from external API
export async function POST(request) {
  try {
    console.log('[Clinics Sync] Starting sync from external API...');
    
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
    
    console.log(`[Clinics Sync] Total visits in external DB: ${externalTotal}`);
    
    // Step 2: Fetch multiple pages to get all unique clinics/faskes
    const desiredRecords = 10000;
    const recordsPerPage = 1000;
    const pagesToFetch = Math.ceil(Math.min(desiredRecords, externalTotal) / recordsPerPage);
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);
    
    console.log(`[Clinics Sync] Fetching ${pagesToFetch} pages from page ${startPage} to ${totalPagesInExternal}`);
    
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
    
    console.log(`[Clinics Sync] Fetched ${rawVisits.length} visits from external API`);
    
    // Step 3: Extract unique facilities (Faskes) and polyclinics (Poli)
    const faskesMap = new Map(); // For main health facilities
    const poliMap = new Map();   // For polyclinics under each faskes
    
    rawVisits.forEach(visit => {
      // Extract Faskes (Health Facility)
      const faskesData = visit.Fasilitas_Kesehatan?.[0];
      if (faskesData) {
        const faskesCode = faskesData.Kode;
        const faskesName = faskesData.Nama_Faskes;
        
        if (faskesCode && faskesName && !faskesMap.has(faskesCode)) {
          faskesMap.set(faskesCode, {
            code: faskesCode,
            name: faskesName,
            polis: new Set(), // Store polis under this faskes
          });
        }
        
        // Extract Poli (Polyclinic) under this faskes
        const poliName = visit.Klinik;
        if (poliName && poliName !== "-" && faskesCode) {
          // Add to polis set for this faskes
          if (faskesMap.has(faskesCode)) {
            faskesMap.get(faskesCode).polis.add(poliName);
          }
          
          // Also track in global poli map
          const poliKey = `${faskesCode}|${poliName}`;
          if (!poliMap.has(poliKey)) {
            poliMap.set(poliKey, {
              name: poliName,
              faskesCode: faskesCode,
              faskesName: faskesName,
            });
          }
        }
      }
    });
    
    const uniqueFaskes = Array.from(faskesMap.values());
    const uniquePolis = Array.from(poliMap.values());
    
    console.log(`[Clinics Sync] Found ${uniqueFaskes.length} unique Faskes`);
    console.log(`[Clinics Sync] Found ${uniquePolis.length} unique Polis`);
    
    // Step 4: Save Faskes to database as clinics
    let faskesAddedCount = 0;
    let faskesSkippedCount = 0;
    
    for (const faskes of uniqueFaskes) {
      try {
        // Check if faskes already exists (check by name)
        const existing = await query(
          'SELECT id FROM clinics WHERE name = ? LIMIT 1',
          [faskes.name]
        );
        
        if (existing.length > 0) {
          faskesSkippedCount++;
          continue;
        }
        
        // Prepare description with polis list
        const polis = Array.from(faskes.polis);
        const description = polis.length > 0 
          ? `Poliklinik: ${polis.join(', ')}`
          : null;
        
        // Insert new faskes as clinic
        await query(
          `INSERT INTO clinics 
           (name, address, city, description, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
          [
            faskes.name,
            faskes.code, // Store code in address field for reference
            'N/A',       // City not available from API
            description
          ]
        );
        
        faskesAddedCount++;
      } catch (error) {
        console.error(`[Clinics Sync] Error saving faskes ${faskes.name}:`, error);
      }
    }
    
    // Step 5: Save Polis to polyclinics table
    let poliAddedCount = 0;
    let poliSkippedCount = 0;
    
    for (const poli of uniquePolis) {
      try {
        // Check if poli already exists
        const existing = await query(
          'SELECT id FROM polyclinics WHERE name = ? AND code = ? LIMIT 1',
          [poli.name, poli.faskesCode]
        );
        
        if (existing.length > 0) {
          poliSkippedCount++;
          continue;
        }
        
        // Insert new poli
        await query(
          `INSERT INTO polyclinics 
           (name, code, description, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [
            poli.name,
            poli.faskesCode, // Use faskes code as reference
            `Poliklinik di ${poli.faskesName}`
          ]
        );
        
        poliAddedCount++;
      } catch (error) {
        console.error(`[Clinics Sync] Error saving poli ${poli.name}:`, error);
      }
    }
    
    console.log(`[Clinics Sync] Completed Faskes: ${faskesAddedCount} added, ${faskesSkippedCount} skipped`);
    console.log(`[Clinics Sync] Completed Polis: ${poliAddedCount} added, ${poliSkippedCount} skipped`);
    
    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${faskesAddedCount} Faskes dan ${poliAddedCount} Poli baru ditambahkan`,
      stats: {
        faskes: {
          total: uniqueFaskes.length,
          added: faskesAddedCount,
          skipped: faskesSkippedCount,
        },
        polis: {
          total: uniquePolis.length,
          added: poliAddedCount,
          skipped: poliSkippedCount,
        },
      },
    });
  } catch (error) {
    console.error('[Clinics Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan sinkronisasi klinik dari API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

