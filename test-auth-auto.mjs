// Automatic authentication test
const SUPABASE_URL = 'https://qukzepteomenikeelzno.supabase.co';
const ANON_KEY = 'sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi';

const testEmail = `autotest${Date.now()}@test.com`;
const testPassword = 'Test123!@#test';

console.log('🔧 Creating test user...');
console.log('Email:', testEmail);

try {
  // 1. Sign up
  const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      data: {
        username: 'autotest',
      },
    }),
  });

  const signupData = await signupResponse.json();

  if (!signupResponse.ok) {
    console.error('❌ Signup failed:', signupData);
    process.exit(1);
  }

  console.log('✅ User created successfully!');
  console.log('   User ID:', signupData.user?.id);
  console.log('   Email:', signupData.user?.email);
  console.log('   Confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');

  // 2. Login
  console.log('\n🔐 Testing login...');
  
  const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const loginData = await loginResponse.json();

  if (!loginResponse.ok) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }

  console.log('✅ Login successful!');
  console.log('   Access Token:', loginData.access_token?.substring(0, 30) + '...');
  console.log('   Token Type:', loginData.token_type);
  console.log('   Expires In:', loginData.expires_in, 'seconds');

  console.log('\n🎉 Test Complete!');
  console.log('\n📝 Login Credentials:');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  console.log('\n🌐 You can now login at: http://localhost:3000/auth');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
