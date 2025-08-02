import { SignJWT } from 'jose';

async function generateTestToken() {
  try {
    const secret = new TextEncoder().encode('supersecretkey123456789supersecretkey123456789');
    
    const token = await new SignJWT({ 
      userId: 6, // Test user ID
      email: 'test@example.com',
      role: 'user'
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
    
    console.log('Generated JWT token:');
    console.log(token);
    console.log('\nYou can use this token to test the meal API:');
    console.log(`curl -X GET "http://localhost:3000/api/mobile/tracking/meal/today?user_id=6" -H "Authorization: Bearer ${token}"`);
    
  } catch (error) {
    console.error('Error generating token:', error);
  }
}

generateTestToken(); 