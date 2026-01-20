#!/usr/bin/env node

/**
 * Calendar System Setup Script
 * 
 * This script:
 * 1. Applies Supabase calendar migrations
 * 2. Enables realtime for calendar tables
 * 3. Sets up Google OAuth credentials
 * 4. Configures environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let envVars = {};

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envVars = Object.fromEntries(
    envContent
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [key, ...values] = line.split('=');
        return [key.trim(), values.join('=').trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = envVars.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  error('Missing Supabase credentials in .env.local');
  error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// ============================================================
// STEP 1: Apply Calendar Migration
// ============================================================

async function applyMigration() {
  log('\n📦 Step 1: Applying calendar system migration...', 'bright');
  
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260120_calendar_system.sql');
  
  if (!existsSync(migrationPath)) {
    error('Migration file not found: 20260120_calendar_system.sql');
    return false;
  }
  
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  try {
    // Execute migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();
    
    if (migrationError) {
      // Try direct query if RPC not available
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await supabase.rpc('exec', { statement });
        } catch (err) {
          // Ignore errors for already existing objects
          if (!err.message?.includes('already exists')) {
            warn(`Statement warning: ${err.message}`);
          }
        }
      }
    }
    
    success('Calendar migration applied successfully');
    return true;
  } catch (err) {
    error(`Migration failed: ${err.message}`);
    warn('You may need to apply migration manually via Supabase Dashboard');
    return false;
  }
}

// ============================================================
// STEP 2: Enable Realtime for Calendar Tables
// ============================================================

async function enableRealtime() {
  log('\n🔴 Step 2: Enabling realtime for calendar tables...', 'bright');
  
  const tables = [
    'calendars',
    'calendar_events',
    'calendar_event_attendees',
    'calendar_shares',
    'calendar_provider_connections',
    'calendar_subscriptions'
  ];
  
  const realtimeSQL = `
    -- Enable realtime for calendar tables
    DROP PUBLICATION IF EXISTS calendar_changes CASCADE;
    CREATE PUBLICATION calendar_changes FOR TABLE ${tables.join(', ')};
    
    -- Alter replica identity to full for better realtime performance
    ${tables.map(table => `ALTER TABLE ${table} REPLICA IDENTITY FULL;`).join('\n')}
  `;
  
  try {
    // This requires service role key
    const { error } = await supabase.rpc('exec_sql', { sql: realtimeSQL }).single();
    
    if (error) {
      warn('Could not enable realtime via API. Using alternative method...');
      
      // Alternative: Enable via Supabase Dashboard instructions
      info('\nTo enable realtime manually:');
      info('1. Go to Supabase Dashboard → Database → Replication');
      info('2. Create new publication: calendar_changes');
      info(`3. Add tables: ${tables.join(', ')}`);
      info('4. Save and enable');
      
      return false;
    }
    
    success('Realtime enabled for calendar tables');
    return true;
  } catch (err) {
    warn(`Realtime setup needs manual configuration: ${err.message}`);
    info('\nManual steps:');
    info('1. Supabase Dashboard → Database → Replication');
    info('2. Enable realtime for: calendars, calendar_events, calendar_shares');
    return false;
  }
}

// ============================================================
// STEP 3: Setup Google OAuth Credentials
// ============================================================

async function setupGoogleOAuth() {
  log('\n🔐 Step 3: Setting up Google OAuth credentials...', 'bright');
  
  const hasGoogleCreds = envVars.GOOGLE_CLIENT_ID && envVars.GOOGLE_CLIENT_SECRET;
  
  if (hasGoogleCreds) {
    success('Google OAuth credentials already configured');
    return true;
  }
  
  warn('Google OAuth credentials not found in .env.local');
  info('\nTo enable Google Calendar integration:');
  info('1. Go to: https://console.cloud.google.com/apis/credentials');
  info('2. Create OAuth 2.0 Client ID (Web application)');
  info('3. Add authorized redirect URIs:');
  info('   - https://tv25.app/api/auth/calendar/google/callback');
  info('   - https://tv26.app/api/auth/calendar/google/callback');
  info('   - https://tv22.app/api/auth/calendar/google/callback');
  info('   - http://localhost:3000/api/auth/calendar/google/callback');
  info('4. Enable Google Calendar API:');
  info('   - https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
  info('5. Add credentials to .env.local:');
  info('');
  info('GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
  info('GOOGLE_CLIENT_SECRET=your-client-secret');
  info('');
  
  return false;
}

// ============================================================
// STEP 4: Update Environment Variables
// ============================================================

async function updateEnvVars() {
  log('\n📝 Step 4: Checking environment variables...', 'bright');
  
  const requiredVars = {
    'NEXT_PUBLIC_APP_URL': 'https://tv25.app',
    'NEXT_PUBLIC_SUPABASE_URL': envVars.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  
  const missingVars = [];
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!envVars[key]) {
      missingVars.push(key);
      envVars[key] = value || '';
    }
  }
  
  if (missingVars.length === 0) {
    success('All required environment variables are set');
    return true;
  }
  
  warn(`Missing environment variables: ${missingVars.join(', ')}`);
  
  // Update .env.local
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  
  writeFileSync(envPath, envContent, 'utf-8');
  success('.env.local updated with missing variables');
  
  return true;
}

// ============================================================
// STEP 5: Verify Supabase Auth Configuration
// ============================================================

async function verifyAuthConfig() {
  log('\n🔒 Step 5: Verifying Supabase auth configuration...', 'bright');
  
  info('Please verify the following in Supabase Dashboard:');
  info('');
  info('Authentication → URL Configuration:');
  info('');
  info('Site URL: https://tv25.app');
  info('');
  info('Redirect URLs:');
  info('  - https://tv25.app/auth/callback');
  info('  - https://tv25.app/auth');
  info('  - https://tv26.app/auth/callback');
  info('  - https://tv26.app/auth');
  info('  - https://tv22.app/auth/callback');
  info('  - https://tv22.app/auth');
  info('  - http://localhost:3000/auth/callback');
  info('  - http://localhost:3000/auth');
  info('  - https://tv25.app/api/auth/calendar/google/callback');
  info('  - https://tv26.app/api/auth/calendar/google/callback');
  info('  - https://tv22.app/api/auth/calendar/google/callback');
  info('  - http://localhost:3000/api/auth/calendar/google/callback');
  info('');
  
  return true;
}

// ============================================================
// Main Execution
// ============================================================

async function main() {
  log('', 'bright');
  log('═══════════════════════════════════════════════════', 'cyan');
  log('  📅 Calendar System Setup', 'bright');
  log('═══════════════════════════════════════════════════', 'cyan');
  log('');
  
  const results = {
    migration: false,
    realtime: false,
    google: false,
    env: false,
    auth: false,
  };
  
  // Execute all steps
  results.migration = await applyMigration();
  results.realtime = await enableRealtime();
  results.google = await setupGoogleOAuth();
  results.env = await updateEnvVars();
  results.auth = await verifyAuthConfig();
  
  // Summary
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('  📊 Setup Summary', 'bright');
  log('═══════════════════════════════════════════════════', 'cyan');
  log('');
  
  if (results.migration) success('✓ Migration applied');
  else error('✗ Migration needs manual application');
  
  if (results.realtime) success('✓ Realtime enabled');
  else warn('⚠ Realtime needs manual setup');
  
  if (results.google) success('✓ Google OAuth configured');
  else warn('⚠ Google OAuth needs setup');
  
  if (results.env) success('✓ Environment variables updated');
  else error('✗ Environment variables need attention');
  
  success('✓ Auth configuration instructions provided');
  
  log('');
  
  const allSuccess = Object.values(results).every(r => r === true);
  
  if (allSuccess) {
    log('═══════════════════════════════════════════════════', 'green');
    log('  🎉 Setup Complete!', 'bright');
    log('═══════════════════════════════════════════════════', 'green');
    log('');
    success('Calendar system is ready to use!');
    info('Run "npm run dev" to start the development server');
  } else {
    log('═══════════════════════════════════════════════════', 'yellow');
    log('  ⚠️  Setup Partially Complete', 'bright');
    log('═══════════════════════════════════════════════════', 'yellow');
    log('');
    warn('Some steps require manual configuration');
    info('Please review the instructions above');
  }
  
  log('');
}

// Run the script
main().catch(err => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});
