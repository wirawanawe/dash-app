#!/usr/bin/env node

/**
 * Script untuk test apakah API mengembalikan data untuk hari ini
 */

import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const today = new Date().toISOString().split('T')[0];

async function testAPIData() {
  console.log('🔍 Testing API for today:', today);
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test 1: Fetch tanpa filter tanggal (ambil beberapa halaman pertama)
    console.log('📡 Test 1: Fetch tanpa filter tanggal (page 1)...');
    const url1 = `${API_BASE_URL}?limit=100&page=1`;
    console.log(`   URL: ${url1}`);
    
    const data1 = await fetchJson(
      url1,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      3,
      60000
    );

    let records1 = [];
    if (Array.isArray(data1)) {
      records1 = data1;
    } else if (Array.isArray(data1.data)) {
      records1 = data1.data;
    }

    console.log(`   ✅ Fetched ${records1.length} records`);
    
    // Check dates in first page
    const datesInPage1 = records1
      .map(r => r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date)
      .filter(Boolean)
      .map(d => d.split('T')[0]);
    
    const uniqueDates = [...new Set(datesInPage1)];
    console.log(`   📅 Unique dates in page 1: ${uniqueDates.slice(0, 10).join(', ')}${uniqueDates.length > 10 ? '...' : ''}`);
    
    const todayRecords = records1.filter(r => {
      const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
      if (!visitDate) return false;
      return visitDate.split('T')[0] === today;
    });
    
    console.log(`   📊 Records for today (${today}) in page 1: ${todayRecords.length}`);
    
    if (todayRecords.length > 0) {
      console.log(`   ✅ Found ${todayRecords.length} records for today in first page!`);
      console.log(`   Sample record:`, JSON.stringify({
        external_id: todayRecords[0].ID || todayRecords[0].No_Kunjungan,
        visit_date: todayRecords[0].Tgl_Kunjungan,
        patient_name: todayRecords[0].Pasien?.[0]?.Nama_Pasien,
      }, null, 2));
    } else {
      console.log(`   ⚠️  No records for today in first page`);
    }

    // Test 2: Fetch dengan filter tanggal di URL
    console.log(`\n📡 Test 2: Fetch dengan filter tanggal di URL (date=${today})...`);
    const url2 = `${API_BASE_URL}?limit=100&page=1&date=${today}`;
    console.log(`   URL: ${url2}`);
    
    try {
      const data2 = await fetchJson(
        url2,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        3,
        60000
      );

      let records2 = [];
      if (Array.isArray(data2)) {
        records2 = data2;
      } else if (Array.isArray(data2.data)) {
        records2 = data2.data;
      }

      console.log(`   ✅ Fetched ${records2.length} records with date filter`);
      
      if (records2.length > 0) {
        console.log(`   ✅ API supports date filter! Found ${records2.length} records`);
      } else {
        console.log(`   ⚠️  API returned 0 records with date filter (might not support it)`);
      }
    } catch (error) {
      console.log(`   ⚠️  API might not support date filter: ${error.message}`);
    }

    // Test 3: Fetch beberapa halaman untuk mencari data hari ini
    console.log(`\n📡 Test 3: Fetch beberapa halaman untuk mencari data hari ini...`);
    let foundTodayRecords = [];
    let pagesChecked = 0;
    const maxPages = 5;
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = `${API_BASE_URL}?limit=100&page=${page}`;
        const data = await fetchJson(
          url,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
          2,
          30000
        );

        let records = [];
        if (Array.isArray(data)) {
          records = data;
        } else if (Array.isArray(data.data)) {
          records = data.data;
        }

        if (records.length === 0) {
          console.log(`   Page ${page}: No more records`);
          break;
        }

        const todayInPage = records.filter(r => {
          const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
          if (!visitDate) return false;
          return visitDate.split('T')[0] === today;
        });

        foundTodayRecords.push(...todayInPage);
        pagesChecked = page;
        
        const oldestDate = records
          .map(r => r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date)
          .filter(Boolean)
          .map(d => d.split('T')[0])
          .sort()[0];
        
        console.log(`   Page ${page}: ${records.length} records, ${todayInPage.length} for today, oldest date: ${oldestDate}`);
        
        // Stop if we've gone past today's date
        if (oldestDate && oldestDate < today) {
          console.log(`   ⏹️  Stopped at page ${page} - dates are older than today`);
          break;
        }
      } catch (error) {
        console.log(`   ⚠️  Error fetching page ${page}: ${error.message}`);
        break;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Pages checked: ${pagesChecked}`);
    console.log(`   Total records found for today (${today}): ${foundTodayRecords.length}`);
    
    if (foundTodayRecords.length > 0) {
      console.log(`   ✅ API HAS DATA FOR TODAY!`);
      console.log(`   Sample records:`, foundTodayRecords.slice(0, 3).map(r => ({
        id: r.ID || r.No_Kunjungan,
        date: r.Tgl_Kunjungan,
        patient: r.Pasien?.[0]?.Nama_Pasien,
      })));
    } else {
      console.log(`   ❌ API DOES NOT HAVE DATA FOR TODAY`);
      console.log(`   This could mean:`);
      console.log(`   - No visits were recorded today`);
      console.log(`   - Data hasn't been synced to API yet`);
      console.log(`   - Date format mismatch`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error(error.stack);
  }
}

testAPIData().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

