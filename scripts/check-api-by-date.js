#!/usr/bin/env node

/**
 * Script untuk memeriksa data di API berdasarkan kolom Tgl_Kunjungan untuk tanggal tertentu
 */

import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const targetDate = '2025-11-19';

async function checkAPIByDate() {
  console.log(`🔍 Memeriksa data di API berdasarkan kolom Tgl_Kunjungan untuk tanggal ${targetDate}`);
  console.log('═══════════════════════════════════════════\n');

  let foundRecords = [];
  let pagesChecked = 0;
  const maxPages = 20; // Check first 20 pages

  for (let page = 1; page <= maxPages; page++) {
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
        break;
      }

      // Filter berdasarkan kolom Tgl_Kunjungan
      const matchingRecords = records.filter(r => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        if (!visitDate) return false;
        
        // Extract date part (handle both date and datetime formats)
        const dateStr = visitDate.split(' ')[0].split('T')[0];
        return dateStr === targetDate;
      });

      foundRecords.push(...matchingRecords);
      pagesChecked = page;

      // Get date range in this page untuk melihat tanggal-tanggal yang ada
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
        console.log(`   📊 Total records: ${records.length}, Found for ${targetDate}: ${matchingRecords.length}`);
        console.log(`   📋 Unique dates in page: ${uniqueDates.slice(0, 5).join(', ')}${uniqueDates.length > 5 ? '...' : ''}`);

        // Show sample of Tgl_Kunjungan values
        if (records.length > 0) {
          const sampleDates = records.slice(0, 3).map(r => ({
            id: r.ID || r.No_Kunjungan,
            tgl_kunjungan: r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date,
            patient: r.Pasien?.[0]?.Nama_Pasien || 'N/A'
          }));
          console.log(`   📝 Sample Tgl_Kunjungan values:`);
          sampleDates.forEach(s => {
            console.log(`      - ID: ${s.id}, Tgl_Kunjungan: ${s.tgl_kunjungan}, Patient: ${s.patient}`);
          });
        }

        // If oldest date is after target date, we've gone too far
        if (oldestDate > targetDate) {
          console.log(`   ⏹️  Stopped: Oldest date (${oldestDate}) is after target date (${targetDate})`);
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
  console.log(`   Records found dengan Tgl_Kunjungan = ${targetDate}: ${foundRecords.length}`);
  
  if (foundRecords.length > 0) {
    console.log(`   ✅ Found ${foundRecords.length} records untuk tanggal ${targetDate}!`);
    console.log(`\n   Sample records:`);
    foundRecords.slice(0, 5).forEach((r, idx) => {
      console.log(`   ${idx + 1}. ID: ${r.ID || r.No_Kunjungan}`);
      console.log(`      Tgl_Kunjungan: ${r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date}`);
      console.log(`      Patient: ${r.Pasien?.[0]?.Nama_Pasien || 'N/A'}`);
      console.log(`      Dokter: ${r.Dokter || 'N/A'}`);
      console.log(`      Klinik: ${r.Klinik || 'N/A'}`);
      console.log(``);
    });
  } else {
    console.log(`   ❌ No records found untuk tanggal ${targetDate}`);
    console.log(`\n   Kemungkinan penyebab:`);
    console.log(`   - Data untuk tanggal ${targetDate} belum ada di API`);
    console.log(`   - Data ada di halaman yang lebih jauh (setelah page ${pagesChecked})`);
    console.log(`   - Format tanggal di kolom Tgl_Kunjungan berbeda`);
    console.log(`   - Tidak ada kunjungan yang tercatat untuk tanggal tersebut`);
  }
}

checkAPIByDate().then(() => {
  console.log('\n✅ Check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

