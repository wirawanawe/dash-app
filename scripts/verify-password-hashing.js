import { query } from '../lib/db.js';

async function verifyPasswordHashing() {
  try {
    console.log('🔍 Verifying password hashing...');
    
    // Check users table
    console.log('\n📊 Checking users table...');
    const users = await query('SELECT id, email, password FROM users');
    
    let usersWithPlainText = 0;
    let usersWithHash = 0;
    
    for (const user of users) {
      if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        usersWithHash++;
      } else if (user.password && user.password.length > 0) {
        usersWithPlainText++;
        console.log(`⚠️  User ${user.email} has plain text password`);
      }
    }
    
    console.log(`Users with hashed passwords: ${usersWithHash}`);
    console.log(`Users with plain text passwords: ${usersWithPlainText}`);
    
    // Check mobile_users table
    console.log('\n📱 Checking mobile_users table...');
    const mobileUsers = await query('SELECT id, email, password FROM mobile_users');
    
    let mobileUsersWithPlainText = 0;
    let mobileUsersWithHash = 0;
    
    for (const user of mobileUsers) {
      if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        mobileUsersWithHash++;
      } else if (user.password && user.password.length > 0) {
        mobileUsersWithPlainText++;
        console.log(`⚠️  Mobile user ${user.email} has plain text password`);
      }
    }
    
    console.log(`Mobile users with hashed passwords: ${mobileUsersWithHash}`);
    console.log(`Mobile users with plain text passwords: ${mobileUsersWithPlainText}`);
    
    // Summary
    console.log('\n📋 Security Summary:');
    console.log(`Total users checked: ${users.length + mobileUsers.length}`);
    console.log(`Total with hashed passwords: ${usersWithHash + mobileUsersWithHash}`);
    console.log(`Total with plain text passwords: ${usersWithPlainText + mobileUsersWithPlainText}`);
    
    if (usersWithPlainText + mobileUsersWithPlainText === 0) {
      console.log('\n✅ All passwords are properly hashed! Security is good.');
    } else {
      console.log('\n❌ Found users with plain text passwords. Security issue detected!');
      console.log('Run the fix-password-hashing.js script to resolve this.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying password hashing:', error);
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyPasswordHashing();
