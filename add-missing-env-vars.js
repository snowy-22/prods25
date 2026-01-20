#!/usr/bin/env node

/**
 * Add Missing Critical Environment Variables to Vercel
 * These are required for Auth to work properly
 */

const { execSync } = require('child_process');

// Critical missing environment variables for Auth
const criticalVars = [
  {
    name: 'RESEND_API_KEY',
    value: 're_coqEdvHU_4KxBiz3m3tAF4EvktMy6hCHz',
    description: 'Email API key for authentication emails'
  },
  {
    name: 'RESEND_FROM_EMAIL',
    value: 'info@tv25.app',
    description: 'Sender email address'
  },
  {
    name: 'RESEND_REPLY_TO',
    value: 'support@tv25.app',
    description: 'Reply-to email address'
  }
];

function runCommand(cmd, description) {
  try {
    console.log(`\n   ${description}...`);
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`   ✅ ${description} - Success`);
    return { success: true, output };
  } catch (error) {
    if (error.stderr && error.stderr.includes('already exists')) {
      console.log(`   ⚠️  ${description} - Already exists`);
      return { success: true, alreadyExists: true };
    }
    console.error(`   ❌ ${description} - Failed: ${error.message}`);
    return { success: false, error };
  }
}

async function addEnvironmentVariables() {
  console.log('\n🚀 Adding Missing Critical Environment Variables to Vercel\n');
  console.log('════════════════════════════════════════════════════════════\n');

  const environments = ['production', 'preview', 'development'];
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const envVar of criticalVars) {
    console.log(`📝 Processing: ${envVar.name}`);
    console.log(`   Description: ${envVar.description}\n`);

    for (const env of environments) {
      const cmd = `echo ${envVar.value} | vercel env add ${envVar.name} ${env}`;
      const result = runCommand(cmd, `Adding to ${env}`);
      
      if (result.success) {
        if (result.alreadyExists) {
          totalSkipped++;
        } else {
          totalAdded++;
        }
      }
    }
    
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log('✅ Environment variables update complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   • Variables added: ${totalAdded}`);
  console.log(`   • Variables skipped (already exist): ${totalSkipped}`);
  console.log(`   • Total processed: ${criticalVars.length} variables × 3 environments\n`);
  console.log('📋 Next Steps:');
  console.log('   1. Redeploy to apply changes: vercel --prod');
  console.log('   2. Test authentication: https://tv25.app/auth');
  console.log('   3. Check email delivery in Resend dashboard\n');
}

// Check if Vercel CLI is available
try {
  execSync('vercel --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Error: Vercel CLI not found. Please install it with: npm i -g vercel');
  process.exit(1);
}

addEnvironmentVariables().catch(console.error);
