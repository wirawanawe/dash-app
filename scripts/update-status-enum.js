import { query } from '../lib/db.js';

async function updateStatusEnum() {
  try {
    console.log('🔄 Updating status ENUM to include "abandoned"...');
    
    await query(`
      ALTER TABLE user_missions 
      MODIFY COLUMN status ENUM('active', 'completed', 'failed', 'abandoned', 'expired', 'cancelled') DEFAULT 'active'
    `);
    
    console.log('✅ Status ENUM updated successfully!');
    
    // Verify the change
    const structure = await query(`
      DESCRIBE user_missions
    `);
    
    const statusColumn = structure.find(col => col.Field === 'status');
    console.log('📋 Updated status column type:', statusColumn.Type);
    
  } catch (error) {
    console.error('❌ Error updating status ENUM:', error.message);
  }
}

updateStatusEnum().catch(console.error); 