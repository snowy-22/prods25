// Direct login test - bypass signup issues
const SUPABASE_URL = 'https://qukzepteomenikeelzno.supabase.co';
const ANON_KEY = 'sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi';

// Pre-existing test user (created manually in Supabase)
const testEmail = 'test@example.com';
const testPassword = 'Test123!@#';

console.log('🔐 Testing login with pre-existing user...');
console.log('Email:', testEmail);

try {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
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

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Login failed:', data);
    console.log('\n📝 If user doesn\'t exist, create it manually:');
    console.log('1. Go to Supabase Console: https://app.supabase.com');
    console.log('2. Select project: qukzepteomenikeelzno');
    console.log('3. Authentication → Users');
    console.log('4. Click "Add user" (button in top right)');
    console.log('5. Enter: test@example.com / Test123!@#');
    console.log('6. Create user\n');
    process.exit(1);
  }

  console.log('✅ Login successful!');
  console.log('   Access Token:', data.access_token?.substring(0, 30) + '...');
  console.log('   Token Type:', data.token_type);
  console.log('   Expires In:', data.expires_in, 'seconds');

  console.log('\n🎉 You can now use these credentials at:');
  console.log('   http://localhost:3000/auth');
  console.log('\n📝 Credentials:');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
