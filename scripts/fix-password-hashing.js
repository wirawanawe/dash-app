import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';

async function fixPasswordHashing() {
  try {
    console.log('🔧 Starting password hashing fix...');
    
    // Get all users with potentially unhashed passwords
    const users = await query('SELECT id, email, password FROM users');
    
    console.log(`📊 Found ${users.length} users to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      const { id, email, password } = user;
      
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (password && (password.startsWith('$2a$') || password.startsWith('$2b$'))) {
        console.log(`⏭️  Skipping ${email} - password already hashed`);
        skippedCount++;
        continue;
      }
      
      // If password is not hashed, hash it
      if (password && password.length > 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        
        console.log(`✅ Updated password for ${email}`);
        updatedCount++;
      } else {
        console.log(`⚠️  Skipping ${email} - no password found`);
        skippedCount++;
      }
    }
    
    // Also check mobile_users table
    console.log('\n📱 Checking mobile_users table...');
    const mobileUsers = await query('SELECT id, email, password FROM mobile_users');
    
    console.log(`📊 Found ${mobileUsers.length} mobile users to check`);
    
    let mobileUpdatedCount = 0;
    let mobileSkippedCount = 0;
    
    for (const user of mobileUsers) {
      const { id, email, password } = user;
      
      // Check if password is already hashed
      if (password && (password.startsWith('$2a$') || password.startsWith('$2b$'))) {
        console.log(`⏭️  Skipping mobile user ${email} - password already hashed`);
        mobileSkippedCount++;
        continue;
      }
      
      // If password is not hashed, hash it
      if (password && password.length > 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await query('UPDATE mobile_users SET password = ? WHERE id = ?', [hashedPassword, id]);
        
        console.log(`✅ Updated password for mobile user ${email}`);
        mobileUpdatedCount++;
      } else {
        console.log(`⚠️  Skipping mobile user ${email} - no password found`);
        mobileSkippedCount++;
      }
    }
    
    console.log('\n📋 Summary:');
    console.log(`Users table: ${updatedCount} updated, ${skippedCount} skipped`);
    console.log(`Mobile users table: ${mobileUpdatedCount} updated, ${mobileSkippedCount} skipped`);
    console.log(`Total updated: ${updatedCount + mobileUpdatedCount}`);
    
    if (updatedCount + mobileUpdatedCount > 0) {
      console.log('\n✅ Password hashing fix completed successfully!');
    } else {
      console.log('\n✅ All passwords are already properly hashed!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing password hashing:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixPasswordHashing();
