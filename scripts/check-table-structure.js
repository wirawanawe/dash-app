import { query } from '../lib/db.js';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking user_missions table structure...');
    
    // Get table structure
    const structure = await query(`
      DESCRIBE user_missions
    `);
    
    console.log('📋 Table structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Check current status values
    const statusValues = await query(`
      SELECT DISTINCT status FROM user_missions
    `);
    
    console.log('\n📊 Current status values in table:');
    statusValues.forEach(row => {
      console.log(`  - ${row.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  }
}

checkTableStructure().catch(console.error); 