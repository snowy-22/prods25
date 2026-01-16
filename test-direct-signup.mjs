// Test email/password signup with detailed error reporting
const SUPABASE_URL = 'https://qukzepteomenikeelzno.supabase.co';
const ANON_KEY = 'sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi';

console.log('🔐 Testing email/password signup...\n');

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test123!@#';

try {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      data: {
        username: `testuser_${Date.now().toString().slice(-6)}`,
        full_name: 'Test User',
      },
    }),
  });

  const data = await response.json();

  console.log('📊 Response Status:', response.status);
  console.log('📋 Response Body:');
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    console.log('\n❌ Signup failed!');
    console.log('\n🔍 Possible causes:');
    
    if (data.error_code === 'user_already_exists') {
      console.log('   - User with this email already exists');
    } else if (data.error_code === 'validation_failed') {
      console.log('   - Email/password validation failed');
      console.log('   - Check password length (min 6 chars)');
    } else if (data.msg?.includes('Email confirmation')) {
      console.log('   - Email confirmation is REQUIRED');
      console.log('   - Solution: Go to Supabase Console → Auth → Providers → Email');
      console.log('   - Toggle OFF "Confirm email"');
    } else {
      console.log('   - Database error (trigger issue)');
      console.log('   - Profile creation might have failed');
    }
    
    process.exit(1);
  }

  console.log('\n✅ Signup successful!');
  console.log('   User ID:', data.user?.id);
  console.log('   Email:', data.user?.email);
  console.log('   Email Confirmed:', data.user?.email_confirmed_at ? '✅ Yes' : '❌ No');
  console.log('   Session:', data.session ? '✅ Created' : '❌ Not created');

  if (data.user && !data.user.email_confirmed_at) {
    console.log('\n⚠️  Email not confirmed - user needs to verify email');
    console.log('   (Or disable "Confirm email" in Supabase Auth settings)');
  }

  console.log('\n🎯 Next: Try login at http://localhost:3000/auth');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);

} catch (error) {
  console.error('❌ Network error:', error.message);
  process.exit(1);
}
