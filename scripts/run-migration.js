import { query } from '../lib/db.js';

async function runMigration() {
  try {
    console.log('🔄 Running migration to add cancelled_at column...');
    
    // Add cancelled_at column
    await query(`
      ALTER TABLE user_missions 
      ADD COLUMN cancelled_at TIMESTAMP NULL AFTER completed_at
    `);
    console.log('✅ Added cancelled_at column');
    
    // Add notes column
    await query(`
      ALTER TABLE user_missions 
      ADD COLUMN notes TEXT NULL AFTER cancelled_at
    `);
    console.log('✅ Added notes column');
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if columns already exist
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Columns already exist, skipping...');
    } else {
      throw error;
    }
  }
}

runMigration().catch(console.error); 