#!/usr/bin/env node

/**
 * Test format tanggal dari API
 */

import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const today = '2025-11-19';

async function testDateFormat() {
  console.log('🔍 Testing date format from API...');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test dengan date parameter
    console.log(`📡 Fetching with date=${today}...`);
    const url = `${API_BASE_URL}?limit=5&page=1&date=${today}`;
    
    const data = await fetchJson(
      url,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      3,
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

    console.log(`✅ Fetched ${records.length} records\n`);

    if (records.length > 0) {
      console.log('📅 Date formats in records:');
      records.forEach((r, idx) => {
        const visitDate = r.Tgl_Kunjungan || r.tgl_kunjungan || r.visit_date;
        const dateOnly = visitDate ? visitDate.split(' ')[0].split('T')[0] : 'N/A';
        console.log(`   Record ${idx + 1}:`);
        console.log(`      Raw: ${visitDate}`);
        console.log(`      Date only: ${dateOnly}`);
        console.log(`      Matches ${today}? ${dateOnly === today ? '✅' : '❌'}`);
      });
    } else {
      console.log('⚠️  No records returned');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDateFormat().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

