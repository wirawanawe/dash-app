import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';

async function migrateMobilePasswords() {
  try {
    console.log('🔄 Starting mobile password migration...');
    
    // Get all mobile users with plain text passwords
    const users = await query('SELECT id, email, password FROM mobile_users');
    
    if (users.length === 0) {
      console.log('✅ No mobile users found to migrate');
      return;
    }
    
    console.log(`📊 Found ${users.length} mobile users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
          console.log(`⏭️  Skipping user ${user.email} - password already hashed`);
          skippedCount++;
          continue;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update the user's password
        await query('UPDATE mobile_users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        
        console.log(`✅ Migrated password for user: ${user.email}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped (already hashed): ${skippedCount} users`);
    console.log(`📊 Total processed: ${users.length} users`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrateMobilePasswords();
