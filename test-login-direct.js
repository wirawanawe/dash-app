import { query } from './lib/db.js';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testLoginDirect() {
  try {
    console.log('🧪 Testing login logic directly...\n');
    
    const email = 'test@mobile.com';
    const password = 'password123';
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🔍 JWT_SECRET length:', process.env.JWT_SECRET?.length || 'NOT SET');
    
    // Test database connection first
    console.log('\n🔗 Testing database connection...');
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Database connection successful:', testResult);
    
    // Test the actual login query
    console.log('\n🔍 Testing login query...');
    const sql = `
      SELECT mu.id, mu.name, mu.email, mu.phone, mu.date_of_birth, mu.gender, 
             mu.ktp_number, mu.address, mu.insurance, mu.insurance_card_number,
             MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
             MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
       FROM mobile_users mu
       LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
       WHERE mu.email = ?
       GROUP BY mu.id
    `;
    
    const [user] = await query(sql, [email]);
    console.log('👤 User found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('📋 User data:', {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      });
      
      // Test JWT creation
      console.log('\n🔐 Testing JWT creation...');
      const token = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "MOBILE_USER",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));
      
      console.log('✅ JWT token created successfully');
      console.log('🔑 Token length:', token.length);
      
      // Test refresh token
      const refreshToken = await new SignJWT({
        userId: user.id,
        type: "refresh",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));
      
      console.log('✅ Refresh token created successfully');
      
      // Format response
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        ktp_number: user.ktp_number,
        address: user.address,
        insurance: user.insurance,
        insurance_card_number: user.insurance_card_number,
        role: "MOBILE_USER",
      };
      
      const response = {
        success: true,
        message: "Login berhasil",
        data: {
          user: userData,
          accessToken: token,
          refreshToken: refreshToken,
        },
      };
      
      console.log('\n✅ Login test successful!');
      console.log('📋 Response:', JSON.stringify(response, null, 2));
      
    } else {
      console.log('❌ User not found in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('📋 Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

testLoginDirect();
