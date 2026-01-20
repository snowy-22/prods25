#!/usr/bin/env node

/**
 * Automatic Vercel Environment Variables Updater
 * Updates Supabase keys in Vercel for all environments
 */

const { execSync } = require('child_process');

const NEW_PUBLISHABLE_KEY = 'sb_publishable_i4PMqx-5M9y7gTw7G7NnJw_pgB3BW89';
const NEW_SECRET_KEY = 'sb_secret_8ghGs6KhBbV3xR4VQepRcQ_ZKS-qYzm';

console.log('\n🚀 Vercel Environment Variables Auto-Updater\n');
console.log('═'.repeat(60));

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI detected');
} catch (error) {
  console.error('\n❌ Vercel CLI not found!');
  console.log('\n📦 Install it with: npm i -g vercel');
  console.log('   Then run: vercel login\n');
  process.exit(1);
}

const environments = ['production', 'preview', 'development'];

console.log('\n🔑 Updating Supabase Keys...\n');

// Function to run Vercel commands
function runVercelCmd(cmd, successMsg, errorMsg) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`   ✅ ${successMsg}`);
    return true;
  } catch (error) {
    console.log(`   ⚠️  ${errorMsg} (may not exist, continuing...)`);
    return false;
  }
}

// 1. Remove old SERVICE_ROLE_KEY from all environments
console.log('🗑️  Step 1: Removing old SUPABASE_SERVICE_ROLE_KEY...');
environments.forEach(env => {
  runVercelCmd(
    `vercel env rm SUPABASE_SERVICE_ROLE_KEY ${env} --yes`,
    `Removed from ${env}`,
    `Could not remove from ${env}`
  );
});

// 2. Add new SUPABASE_SECRET_KEY to all environments
console.log('\n➕ Step 2: Adding new SUPABASE_SECRET_KEY...');
environments.forEach(env => {
  console.log(`\n   Adding to ${env}...`);
  try {
    execSync(`echo "${NEW_SECRET_KEY}" | vercel env add SUPABASE_SECRET_KEY ${env}`, { 
      stdio: 'inherit',
      shell: true 
    });
    console.log(`   ✅ Added to ${env}`);
  } catch (error) {
    console.log(`   ⚠️  Failed to add to ${env} (may already exist)`);
  }
});

// 3. Update NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('\n🔄 Step 3: Updating NEXT_PUBLIC_SUPABASE_ANON_KEY...');
environments.forEach(env => {
  runVercelCmd(
    `vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY ${env} --yes`,
    `Removed old from ${env}`,
    `No old key in ${env}`
  );
  
  try {
    execSync(`echo "${NEW_PUBLISHABLE_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY ${env}`, { 
      stdio: 'inherit',
      shell: true 
    });
    console.log(`   ✅ Added new to ${env}`);
  } catch (error) {
    console.log(`   ⚠️  Failed to add to ${env}`);
  }
});

// 4. Update NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
console.log('\n🔄 Step 4: Updating NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY...');
environments.forEach(env => {
  runVercelCmd(
    `vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ${env} --yes`,
    `Removed old from ${env}`,
    `No old key in ${env}`
  );
  
  try {
    execSync(`echo "${NEW_PUBLISHABLE_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ${env}`, { 
      stdio: 'inherit',
      shell: true 
    });
    console.log(`   ✅ Added new to ${env}`);
  } catch (error) {
    console.log(`   ⚠️  Failed to add to ${env}`);
  }
});

console.log('\n' + '═'.repeat(60));
console.log('✅ Environment variables update complete!\n');
console.log('📋 Next Steps:');
console.log('   1. Verify in Vercel Dashboard:');
console.log('      https://vercel.com/snowy-22/prods25/settings/environment-variables');
console.log('\n   2. Trigger a redeploy:');
console.log('      vercel --prod');
console.log('\n   3. Test your app:');
console.log('      https://tv25.app\n');
