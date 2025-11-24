#!/usr/bin/env node

/**
 * Script untuk menguji apakah API menggunakan parameter tglawal dan tglakhir dengan benar
 */

import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const targetDate = '2025-11-19';

async function testAPIDateFilter() {
  console.log(`🔍 Testing API dengan parameter tglawal dan tglakhir untuk tanggal ${targetDate}`);
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test 1: Tanpa filter tanggal
    console.log('📡 Test 1: Tanpa filter tanggal (limit=100, page=1)');
    const url1 = `${API_BASE_URL}?limit=100&page=1`;
    const data1 = await fetchJson(
      url1,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      2,
      60000
    );
    let records1 = [];
    if (Array.isArray(data1)) {
      records1 = data1;
    } else if (Array.isArray(data1.data)) {
      records1 = data1.data;
    } else if (Array.isArray(data1.Data)) {
      records1 = data1.Data;
    }
    const dates1 = records1
      .map(r => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        if (!visitDate) return null;
        return visitDate.split(' ')[0].split('T')[0];
      })
      .filter(Boolean)
      .sort();
    const uniqueDates1 = [...new Set(dates1)];
    console.log(`   ✅ Total records: ${records1.length}`);
    console.log(`   📅 Date range: ${dates1[0]} to ${dates1[dates1.length - 1]}`);
    console.log(`   📋 Unique dates (first 5): ${uniqueDates1.slice(0, 5).join(', ')}`);
    console.log('');

    // Test 2: Dengan filter tanggal menggunakan tglawal dan tglakhir
    console.log(`📡 Test 2: Dengan filter tanggal (tglawal=${targetDate}&tglakhir=${targetDate})`);
    const url2 = `${API_BASE_URL}?limit=1000&page=1&tglawal=${targetDate}&tglakhir=${targetDate}`;
    const data2 = await fetchJson(
      url2,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      2,
      60000
    );
    let records2 = [];
    if (Array.isArray(data2)) {
      records2 = data2;
    } else if (Array.isArray(data2.data)) {
      records2 = data2.data;
    } else if (Array.isArray(data2.Data)) {
      records2 = data2.Data;
    }
    
    // Filter berdasarkan Tgl_Kunjungan untuk verifikasi
    const matchingRecords = records2.filter(r => {
      const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
      if (!visitDate) return false;
      const dateStr = visitDate.split(' ')[0].split('T')[0];
      return dateStr === targetDate;
    });
    
    const dates2 = records2
      .map(r => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        if (!visitDate) return null;
        return visitDate.split(' ')[0].split('T')[0];
      })
      .filter(Boolean)
      .sort();
    const uniqueDates2 = [...new Set(dates2)];
    
    console.log(`   ✅ Total records dari API: ${records2.length}`);
    console.log(`   ✅ Records dengan Tgl_Kunjungan = ${targetDate}: ${matchingRecords.length}`);
    console.log(`   📅 Date range: ${dates2.length > 0 ? `${dates2[0]} to ${dates2[dates2.length - 1]}` : 'N/A'}`);
    console.log(`   📋 Unique dates (first 10): ${uniqueDates2.slice(0, 10).join(', ')}`);
    
    if (matchingRecords.length > 0) {
      console.log(`\n   ✅ SUCCESS! Found ${matchingRecords.length} records untuk tanggal ${targetDate}`);
      console.log(`   Sample records:`);
      matchingRecords.slice(0, 3).forEach((r, idx) => {
        console.log(`      ${idx + 1}. ID: ${r.ID || r.No_Kunjungan}`);
        console.log(`         Tgl_Kunjungan: ${r.Tgl_Kunjungan || r.tgl_kunjungan}`);
        console.log(`         Patient: ${r.Pasien?.[0]?.Nama_Pasien || 'N/A'}`);
      });
    } else {
      console.log(`\n   ⚠️  No records found untuk tanggal ${targetDate}`);
      if (records2.length > 0) {
        console.log(`   ⚠️  API returned ${records2.length} records, but none match ${targetDate}`);
        console.log(`   ⚠️  This suggests API filter may not be working correctly`);
      }
    }
    console.log('');

    // Test 3: Range tanggal (jika berbeda dari single date)
    if (targetDate !== '2025-11-19') {
      const testStartDate = '2025-11-18';
      const testEndDate = '2025-11-20';
      console.log(`📡 Test 3: Range tanggal (tglawal=${testStartDate}&tglakhir=${testEndDate})`);
      const url3 = `${API_BASE_URL}?limit=1000&page=1&tglawal=${testStartDate}&tglakhir=${testEndDate}`;
      const data3 = await fetchJson(
        url3,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        2,
        60000
      );
      let records3 = [];
      if (Array.isArray(data3)) {
        records3 = data3;
      } else if (Array.isArray(data3.data)) {
        records3 = data3.data;
      } else if (Array.isArray(data3.Data)) {
        records3 = data3.Data;
      }
      
      const matchingRange = records3.filter(r => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        if (!visitDate) return false;
        const dateStr = visitDate.split(' ')[0].split('T')[0];
        return dateStr >= testStartDate && dateStr <= testEndDate;
      });
      
      console.log(`   ✅ Total records dari API: ${records3.length}`);
      console.log(`   ✅ Records dalam range ${testStartDate} - ${testEndDate}: ${matchingRange.length}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   API URL dengan filter: ${API_BASE_URL}?limit=1000&page=1&tglawal=${targetDate}&tglakhir=${targetDate}`);
    console.log(`   Records found: ${matchingRecords.length}`);
    if (matchingRecords.length > 0) {
      console.log(`   ✅ API filter BERHASIL - data ditemukan!`);
    } else {
      console.log(`   ⚠️  API filter mungkin tidak bekerja atau data belum ada`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAPIDateFilter().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

