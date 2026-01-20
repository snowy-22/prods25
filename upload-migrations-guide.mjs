#!/usr/bin/env node

import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PROJECT_ID = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : 'YOUR_PROJECT_ID';

console.log('🚀 Supabase SQL Migration Uploader\n');
console.log('📖 Reading migrations-combined.sql...');

const sql = readFileSync('./migrations-combined.sql', 'utf8');
console.log(`✅ Loaded ${(sql.length / 1024).toFixed(2)} KB of SQL\n`);

console.log('📋 MIGRATION READY TO UPLOAD');
console.log('=' .repeat(60));
console.log('\n⚠️  AUTOMATED UPLOAD NOT AVAILABLE');
console.log('    Supabase requires SQL to be executed via Dashboard SQL Editor\n');
console.log('📌 MANUAL STEPS:');
console.log(`   1. Open: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`);
console.log('   2. Copy the entire content of: migrations-combined.sql');
console.log('   3. Paste into the SQL Editor');
console.log('   4. Click "RUN" button');
console.log('   5. Wait for completion (may take 30-60 seconds)\n');
console.log('=' .repeat(60));
console.log('\n💡 TIP: The SQL file is already open in VS Code for easy copying!\n');

// Alternative: Show first few lines
const preview = sql.split('\n').slice(0, 10).join('\n');
console.log('📄 SQL Preview (first 10 lines):');
console.log('-'.repeat(60));
console.log(preview);
console.log('-'.repeat(60));
console.log(`\n... and ${sql.split('\n').length - 10} more lines\n`);

console.log('✨ After uploading, restart: npm run dev\n');
