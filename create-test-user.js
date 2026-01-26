#!/usr/bin/env node

/**
 * Create a test user in Supabase
 * Usage: node create-test-user.js test@example.com password123
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qukzepteomenikeelzno.supabase.co';
const supabaseKey = 'atRTaXHioCrOy51HDhHdsg_QHsLPJdT';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const email = process.argv[2] || 'test@example.com';
  const password = process.argv[3] || 'Test@12345';

  try {
    console.log(`📧 Creating test user: ${email}...`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  User already exists: ${email}`);
        console.log(`\n✅ You can login with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
      } else {
        throw error;
      }
    } else {
      console.log(`✅ Test user created successfully!`);
      console.log(`\n📋 Login credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`\n🔗 Login URL: http://localhost:3000/auth`);
    }
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

createTestUser();
