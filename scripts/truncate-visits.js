#!/usr/bin/env node

/**
 * Script untuk truncate (menghapus semua data) dari tabel visits
 * 
 * ⚠️ PERINGATAN: Script ini akan menghapus SEMUA data di tabel visits!
 * 
 * Usage:
 *   node scripts/truncate-visits.js
 */

import { query, closePool } from '../lib/db.js';

async function truncateVisits() {
  console.log('⚠️  PERINGATAN: Script ini akan menghapus SEMUA data di tabel visits!');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Get count before truncate
    const [countResult] = await query('SELECT COUNT(*) as total FROM visits');
    const totalRecords = countResult?.total || 0;
    
    console.log(`📊 Total records di tabel visits: ${totalRecords.toLocaleString('id-ID')}`);
    
    if (totalRecords === 0) {
      console.log('✅ Tabel visits sudah kosong. Tidak ada yang perlu dihapus.');
      return;
    }
    
    // Confirm truncate
    console.log(`\n🗑️  Menghapus ${totalRecords.toLocaleString('id-ID')} records dari tabel visits...`);
    
    // Disable foreign key checks temporarily to allow truncate
    console.log('🔓 Menonaktifkan foreign key checks sementara...');
    await query('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      // Truncate table
      await query('TRUNCATE TABLE visits');
      console.log('✅ Tabel visits berhasil di-truncate!');
    } finally {
      // Re-enable foreign key checks
      console.log('🔒 Mengaktifkan kembali foreign key checks...');
      await query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    // Verify
    const [verifyResult] = await query('SELECT COUNT(*) as total FROM visits');
    const remainingRecords = verifyResult?.total || 0;
    
    console.log(`\n📊 Verifikasi: Total records setelah truncate: ${remainingRecords}`);
    
    if (remainingRecords === 0) {
      console.log('✅ Truncate berhasil! Tabel visits sekarang kosong.');
    } else {
      console.log('⚠️  Masih ada data di tabel visits. Mungkin ada masalah.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the script
truncateVisits().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

