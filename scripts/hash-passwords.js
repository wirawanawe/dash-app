import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function hashPasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pr1k1t1w',
    database: 'phc_dashboard'
  });

  try {
    // Get all users with plain text passwords
    const [users] = await connection.execute(
      'SELECT id, password FROM mobile_users WHERE password NOT LIKE "$2a$%"'
    );

    console.log(`Found ${users.length} users with plain text passwords`);

    for (const user of users) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update the user's password
      await connection.execute(
        'UPDATE mobile_users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`Updated password for user ID ${user.id}`);
    }

    console.log('All passwords have been hashed successfully!');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await connection.end();
  }
}

hashPasswords();
