#!/usr/bin/env node

/**
 * Quick Script: Open Supabase Email Templates Dashboard
 * 
 * Usage:
 *   npm run open:supabase:email
 *   node scripts/open-supabase-dashboard.mjs
 */

import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execPromise = promisify(exec);

const SUPABASE_PROJECT_ID = 'qukzepteomenikeelzno';
const DASHBOARD_URL = `https://app.supabase.com/project/${SUPABASE_PROJECT_ID}/auth/templates`;

async function openDashboard() {
  console.log(`\n🌐 Opening Supabase Email Templates Dashboard...`);
  console.log(`📍 URL: ${DASHBOARD_URL}\n`);

  let command;
  const os = platform();

  if (os === 'win32') {
    // Windows
    command = `start "${DASHBOARD_URL}"`;
  } else if (os === 'darwin') {
    // macOS
    command = `open "${DASHBOARD_URL}"`;
  } else {
    // Linux
    command = `xdg-open "${DASHBOARD_URL}"`;
  }

  try {
    await execPromise(command);
    console.log(`✅ Dashboard opened in default browser!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Select "Confirmation" or your email type`);
    console.log(`   2. Go to HTML tab`);
    console.log(`   3. Copy-paste template HTML`);
    console.log(`   4. Click Save`);
    console.log(`\n💾 Template Location: src/emails/templates/\n`);
  } catch (error) {
    console.error(`❌ Failed to open browser:`, error.message);
    console.log(`\n📍 Open this URL manually:`);
    console.log(`   ${DASHBOARD_URL}`);
    process.exit(1);
  }
}

openDashboard().catch(console.error);
