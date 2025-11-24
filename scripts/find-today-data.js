#!/usr/bin/env node

/**
 * Script untuk mencari data hari ini di beberapa halaman pertama API
 */

import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const today = new Date().toISOString().split('T')[0];

async function findTodayData() {
  console.log(`🔍 Searching for data for ${today}...`);
  console.log('═══════════════════════════════════════════\n');

  let foundRecords = [];
  let pagesChecked = 0;
  const maxPages = 20; // Check first 20 pages

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`📡 Checking page ${page}...`);
      const url = `${API_BASE_URL}?limit=1000&page=${page}`;
      
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
        break;
      }

      // Filter for today's date
      const todayInPage = records.filter(r => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        if (!visitDate) return false;
        const dateStr = visitDate.split(' ')[0].split('T')[0];
        return dateStr === today;
      });

      foundRecords.push(...todayInPage);
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
        console.log(`   📅 Date range: ${oldestDate} to ${newestDate}, Found ${todayInPage.length} records for ${today}`);

        // If oldest date is after today, we've gone too far
        if (oldestDate > today) {
          console.log(`   ⏹️  Stopped: Oldest date (${oldestDate}) is after today`);
          break;
        }
      }

      // Small delay to avoid overwhelming API
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ Error fetching page ${page}:`, error.message);
      break;
    }
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`📊 Summary:`);
  console.log(`   Pages checked: ${pagesChecked}`);
  console.log(`   Records found for ${today}: ${foundRecords.length}`);
  
  if (foundRecords.length > 0) {
    console.log(`   ✅ Found ${foundRecords.length} records for today!`);
    console.log(`   Sample records:`);
    foundRecords.slice(0, 3).forEach((r, idx) => {
      console.log(`      ${idx + 1}. ${r.ID || r.No_Kunjungan} - ${r.Pasien?.[0]?.Nama_Pasien || 'N/A'} - ${r.Tgl_Kunjungan || r.tgl_kunjungan}`);
    });
  } else {
    console.log(`   ❌ No records found for today in first ${pagesChecked} pages`);
    console.log(`   This could mean:`);
    console.log(`   - Data for today hasn't been synced to API yet`);
    console.log(`   - Data is in pages beyond ${pagesChecked}`);
    console.log(`   - No visits were recorded today`);
  }
}

findTodayData().then(() => {
  console.log('\n✅ Search completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Search failed:', error);
  process.exit(1);
});

