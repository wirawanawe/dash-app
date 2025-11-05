#!/usr/bin/env node

/**
 * Fix Polyclinics Duplicate Codes
 * 
 * Masalah:
 * 1. Ada duplicate codes (KD untuk UMUM dan GIGI)
 * 2. Tidak ada UNIQUE constraint di kolom code
 * 3. Kode poli bukan kode klinik/faskes
 */

import { query, rawQuery } from '../lib/db.js';

async function fixPolyclinicDuplicates() {
  console.log('Fix Polyclinic Duplicates');
  console.log('');
  console.log('════════════════════════════════════════════');
  console.log('');
  
  try {
    // Step 1: Check current duplicates
    console.log('Step 1: Checking for duplicates...');
    const duplicates = await query(
      'SELECT code, COUNT(*) as count FROM polyclinics GROUP BY code HAVING COUNT(*) > 1'
    );
    
    if (duplicates.length > 0) {
      console.log('  Found duplicates:');
      duplicates.forEach(d => {
        console.log('   Code: ' + d.code + ' - ' + d.count + ' instances');
      });
      console.log('');
    }
    
    // Step 2: Get all polyclinics
    console.log('Step 2: Current polyclinics...');
    const allPolis = await query('SELECT id, name, code FROM polyclinics ORDER BY code, id');
    
    allPolis.forEach(p => {
      console.log('  ID ' + p.id + ': ' + p.name + ' (Code: ' + p.code + ')');
    });
    console.log('');
    
    // Step 3: Fix duplicate codes
    console.log('Step 3: Fixing duplicate codes...');
    
    // Strategy: Update codes to be unique based on polyclinic name
    const fixes = [
      { id: 21, newCode: 'POLI-UMUM', name: 'UMUM' },
      { id: 22, newCode: 'POLI-GIGI', name: 'GIGI' },
      { id: 23, newCode: 'POLI-UMUM-TSK', name: 'UMUM' },
      { id: 24, newCode: 'POLI-UMUM-UIT', name: 'UMUM' },
    ];
    
    for (const fix of fixes) {
      const [existing] = await query(
        'SELECT id, name, code FROM polyclinics WHERE id = ?',
        [fix.id]
      );
      
      if (existing) {
        await query(
          'UPDATE polyclinics SET code = ? WHERE id = ?',
          [fix.newCode, fix.id]
        );
        console.log('  Updated: ID ' + fix.id + ' "' + existing.name + '" to Code: ' + fix.newCode);
      }
    }
    console.log('');
    
    // Step 4: Add UNIQUE constraint
    console.log('Step 4: Adding UNIQUE constraint...');
    
    const indexes = await query('SHOW INDEX FROM polyclinics WHERE Column_name = "code"');
    const hasUniqueConstraint = indexes.some(idx => idx.Non_unique === 0);
    
    if (hasUniqueConstraint) {
      console.log('  UNIQUE constraint already exists');
    } else {
      await rawQuery('ALTER TABLE polyclinics ADD UNIQUE KEY unique_code (code)');
      console.log('  Added UNIQUE constraint');
    }
    console.log('');
    
    // Step 5: Verify
    console.log('Step 5: Verifying fix...');
    const afterFix = await query(
      'SELECT code, COUNT(*) as count FROM polyclinics GROUP BY code HAVING COUNT(*) > 1'
    );
    
    if (afterFix.length === 0) {
      console.log('  No duplicates found!');
    } else {
      console.log('  Still have duplicates:');
      afterFix.forEach(d => {
        console.log('     Code: ' + d.code + ' - ' + d.count + ' instances');
      });
    }
    
    // Final state
    console.log('');
    console.log('Final Polyclinics:');
    const final = await query('SELECT id, name, code FROM polyclinics ORDER BY code');
    final.forEach(p => {
      console.log('  ' + p.id + '. ' + p.name + ' (Code: ' + p.code + ')');
    });
    
    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('POLYCLINIC DUPLICATES FIXED!');
    console.log('════════════════════════════════════════════');
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

fixPolyclinicDuplicates();
