import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await delay(Math.pow(2, i) * 1000);
    }
  }
}

// POST /api/clinics/sync - Sync clinics from master faskes API
export async function POST(request) {
  try {
    // Step 1: Fetch data from master faskes API
    const apiUrl = 'https://api-ehr-klinik.doctorphc.id/master/faskes';
    
    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Extract data array from response
    // The API might return { data: [...] } or just [...]
    let faskesData = [];
    if (Array.isArray(responseData)) {
      faskesData = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      faskesData = responseData.data;
    } else {
      throw new Error('Invalid API response format');
    }
    
    if (faskesData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data faskes dari API',
      });
    }

    // Step 2: Delete all existing clinics data (including related data)
    // First, delete related data from clinic_polyclinics if exists
    try {
      await query('DELETE FROM clinic_polyclinics');
    } catch (error) {
      // Table may not exist, ignore error
    }
    
    // Delete all clinics
    await query('DELETE FROM clinics');

    // Step 3: Insert new data from API
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const faskes of faskesData) {
      try {
        // Extract fields from API response
        // API structure: { id, uuid, kode_faskes, nama_faskes, client_id, created_at, updated_at }
        const external_id = faskes.uuid || null;
        const name = faskes.nama_faskes || 'Unknown';
        const code = faskes.kode_faskes || null;
        const client_id = faskes.client_id || null;
        
        // Insert faskes as clinic
        // Note: address is left as NULL (not filled with code)
        await query(
          `INSERT INTO clinics 
           (external_id, name, code, client_id, address, city, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, NULL, 'N/A', TRUE, NOW(), NOW())`,
          [
            external_id,
            name,
            code,
            client_id
          ]
        );
        
        insertedCount++;
      } catch (error) {
        errorCount++;
        // Error already counted, continue with next faskes
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${insertedCount} faskes berhasil ditambahkan`,
      stats: {
        total: faskesData.length,
        inserted: insertedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Synchronization error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan sinkronisasi faskes dari API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

