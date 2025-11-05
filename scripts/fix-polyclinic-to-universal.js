#!/usr/bin/env node

/**
 * Fix Polyclinics - Keep Only Universal Poli
 * 
 * Masalah:
 * - Ada poli spesifik ke klinik (POLI-UMUM-TSK, POLI-UMUM-UIT)
 * - Seharusnya poli itu universal (bisa digunakan di semua klinik)
 * 
 * Solusi:
 * - Hapus poli yang spesifik ke klinik
 * - Buat poli universal standar
 */

import { query, rawQuery } from '../lib/db.js';

async function fixToUniversalPoli() {
  console.log('Fix Polyclinics - Universal Only');
  console.log('');
  console.log('════════════════════════════════════════════');
  console.log('');
  
  try {
    // Step 1: Check current data
    console.log('Step 1: Current polyclinics...');
    const current = await query('SELECT id, name, code FROM polyclinics ORDER BY id');
    
    current.forEach(p => {
      const isSpecific = p.code.includes('-TSK') || p.code.includes('-UIT') || p.code.includes('-KD');
      console.log('  ' + p.id + '. ' + p.name.padEnd(15) + ' → ' + p.code + (isSpecific ? ' ❌' : ' ✅'));
    });
    console.log('');
    
    // Step 2: Delete clinic-specific poli
    console.log('Step 2: Deleting clinic-specific poli...');
    
    const toDelete = current.filter(p => 
      p.code.includes('-TSK') || p.code.includes('-UIT')
    );
    
    for (const poli of toDelete) {
      await query('DELETE FROM polyclinics WHERE id = ?', [poli.id]);
      console.log('  Deleted: ' + poli.name + ' (' + poli.code + ')');
    }
    console.log('');
    
    // Step 3: Ensure we have standard universal poli
    console.log('Step 3: Ensuring universal poli exist...');
    
    const standardPoli = [
      { name: 'UMUM', code: 'POLI-UMUM', description: 'Pelayanan kesehatan umum' },
      { name: 'GIGI', code: 'POLI-GIGI', description: 'Pelayanan kesehatan gigi dan mulut' },
      { name: 'ANAK', code: 'POLI-ANAK', description: 'Pelayanan kesehatan anak' },
      { name: 'KEBIDANAN', code: 'POLI-KEBIDANAN', description: 'Pelayanan kesehatan ibu dan anak' },
      { name: 'BEDAH', code: 'POLI-BEDAH', description: 'Pelayanan bedah umum' },
      { name: 'JANTUNG', code: 'POLI-JANTUNG', description: 'Pelayanan kesehatan jantung' },
      { name: 'MATA', code: 'POLI-MATA', description: 'Pelayanan kesehatan mata' },
      { name: 'THT', code: 'POLI-THT', description: 'Telinga, Hidung, Tenggorokan' },
    ];
    
    for (const poli of standardPoli) {
      // Check if exists
      const [exists] = await query(
        'SELECT id FROM polyclinics WHERE code = ?',
        [poli.code]
      );
      
      if (!exists) {
        await query(
          'INSERT INTO polyclinics (name, code, description, status) VALUES (?, ?, ?, ?)',
          [poli.name, poli.code, poli.description, 'Aktif']
        );
        console.log('  Added: ' + poli.name + ' (' + poli.code + ')');
      } else {
        console.log('  Exists: ' + poli.name + ' (' + poli.code + ')');
      }
    }
    console.log('');
    
    // Step 4: Verify
    console.log('Step 4: Final polyclinics...');
    const final = await query('SELECT id, name, code, status FROM polyclinics ORDER BY name');
    
    console.log('');
    final.forEach(p => {
      console.log('  ' + p.id + '. ' + p.name.padEnd(15) + ' → ' + p.code.padEnd(20) + ' (' + p.status + ')');
    });
    
    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('POLYCLINICS NOW UNIVERSAL!');
    console.log('Total: ' + final.length + ' universal poli');
    console.log('════════════════════════════════════════════');
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

fixToUniversalPoli();

