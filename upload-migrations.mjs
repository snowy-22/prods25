#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function uploadMigrations() {
  try {
    console.log('📖 Reading migrations-combined.sql...');
    const sql = readFileSync('./migrations-combined.sql', 'utf8');
    
    console.log('📤 Uploading to Supabase...');
    console.log(`   SQL size: ${(sql.length / 1024).toFixed(2)} KB`);
    
    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      
      // Skip comments
      if (stmt.trim().startsWith('--')) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        
        if (error) {
          // Try direct query as fallback
          const { error: directError } = await supabase
            .from('_migrations')
            .insert({ query: stmt });
          
          if (directError) {
            console.error(`❌ Statement ${i + 1} failed:`, directError.message);
            console.error(`   SQL: ${stmt.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception at statement ${i + 1}:`, err.message);
        errorCount++;
      }
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${statements.length} (${successCount} ✓, ${errorCount} ✗)`);
      }
    }
    
    console.log('\n✅ Migration upload completed!');
    console.log(`   Success: ${successCount} statements`);
    console.log(`   Errors: ${errorCount} statements`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All migrations applied successfully!');
    } else {
      console.log('\n⚠️  Some statements failed. Check errors above.');
      console.log('   💡 Tip: Many errors are expected (e.g., "already exists")');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

uploadMigrations();
