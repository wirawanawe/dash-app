#!/usr/bin/env node

/**
 * Script untuk mencari data di API dengan mencari dari halaman yang lebih jauh
 * karena API mungkin mengurutkan dari oldest to newest
 */

import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const targetDate = '2025-11-19';

async function checkAPIReverseSearch() {
  console.log(`🔍 Mencari data di API untuk tanggal ${targetDate} dengan mencari beberapa halaman...`);
  console.log('═══════════════════════════════════════════\n');

  let foundRecords = [];
  let pagesChecked = 0;
  const pagesToCheck = [1, 2, 3, 5, 10, 20, 30, 50, 100]; // Check specific pages

  for (const page of pagesToCheck) {
    try {
      console.log(`📡 Checking page ${page}...`);
      const url = `${API_BASE_URL}?limit=200&page=${page}`;
      
      const data = await fetchJson(
        url,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        2,
        60000
      );

      let records = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (Array.isArray(data.data)) {
        records = data.data;
      } else if (Array.isArray(data.Data)) {
        records = data.Data;
      }

      if (records.length === 0) {
        console.log(`   ⚠️  No records in page ${page}`);
        continue;
      }

      // Filter berdasarkan kolom Tgl_Kunjungan
      const matchingRecords = records.filter(r => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        if (!visitDate) return false;
        const dateStr = visitDate.split(' ')[0].split('T')[0];
        return dateStr === targetDate;
      });

      foundRecords.push(...matchingRecords);
      pagesChecked = page;

      // Get date range in this page
      const dates = records
        .map(r => {
          const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
          if (!visitDate) return null;
          return visitDate.split(' ')[0].split('T')[0];
        })
        .filter(Boolean)
        .sort();

      if (dates.length > 0) {
        const oldestDate = dates[0];
        const newestDate = dates[dates.length - 1];
        const uniqueDates = [...new Set(dates)];
        
        console.log(`   📅 Date range: ${oldestDate} to ${newestDate}`);
        console.log(`   📊 Found for ${targetDate}: ${matchingRecords.length} records`);
        
        if (matchingRecords.length > 0) {
          console.log(`   ✅ FOUND DATA! Sample:`);
          matchingRecords.slice(0, 2).forEach((r, idx) => {
            console.log(`      ${idx + 1}. ID: ${r.ID || r.No_Kunjungan}`);
            console.log(`         Tgl_Kunjungan: ${r.Tgl_Kunjungan || r.tgl_kunjungan}`);
            console.log(`         Patient: ${r.Pasien?.[0]?.Nama_Pasien || 'N/A'}`);
          });
        }
        
        // Check if we've passed the target date
        if (oldestDate > targetDate && matchingRecords.length === 0) {
          console.log(`   ⏹️  Dates in this page are after target date, stopping search`);
          break;
        }
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ Error fetching page ${page}:`, error.message);
      // Continue to next page even if this one fails
      continue;
    }
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`📊 Summary:`);
  console.log(`   Pages checked: ${pagesChecked}`);
  console.log(`   Total records found dengan Tgl_Kunjungan = ${targetDate}: ${foundRecords.length}`);
  
  if (foundRecords.length > 0) {
    console.log(`   ✅ Found ${foundRecords.length} records untuk tanggal ${targetDate}!`);
    console.log(`\n   Detail records:`);
    foundRecords.slice(0, 10).forEach((r, idx) => {
      console.log(`   ${idx + 1}. ID: ${r.ID || r.No_Kunjungan}`);
      console.log(`      Tgl_Kunjungan: ${r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date}`);
      console.log(`      Patient: ${r.Pasien?.[0]?.Nama_Pasien || 'N/A'}`);
      console.log(`      Dokter: ${r.Dokter || 'N/A'}`);
      console.log(`      Klinik: ${r.Klinik || 'N/A'}`);
      console.log(``);
    });
  } else {
    console.log(`   ❌ No records found untuk tanggal ${targetDate} di ${pagesChecked} pages yang dicek`);
  }
}

checkAPIReverseSearch().then(() => {
  console.log('\n✅ Check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

