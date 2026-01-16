// Quick test script for authentication
// Run with: node test-auth.js

const fetch = require('node-fetch');

const SUPABASE_URL = 'https://qukzepteomenikeelzno.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi';

async function createTestUser() {
  try {
    // Sign up with email/password
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#test',
        data: {
          username: 'testuser',
        },
      }),
    });

    const data = await response.json();
    console.log('Response:', data);

    if (response.ok) {
      console.log('✓ Test user created successfully!');
      console.log('Email:', data.user?.email);
      console.log('User ID:', data.user?.id);
    } else {
      console.error('✗ Error:', data.message || data.error_description);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestUser();
