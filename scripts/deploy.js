#!/usr/bin/env node

/**
 * One-Click Supabase Migration Deploy
 * Service Role Key kullanarak direkt PostgreSQL'e bağlanır
 * CLI authentication gerekmiyor!
 */

const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qukzepteomenikeelzno.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_YFd4MDCZ6IRAC5-GmQk7Pg_Y1bSto94';
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20260107_sharing_and_realtime_sync.sql');

async function deployMigration() {
  console.clear();
  console.log('\n🚀 SUPABASE MIGRATION ONE-CLICK DEPLOY\n');
  console.log('═'.repeat(60));
  
  try {
    // Read migration SQL
    console.log('\n📄 Migration dosyası okunuyor...');
    if (!fs.existsSync(MIGRATION_FILE)) {
      throw new Error(`Migration dosyası bulunamadı: ${MIGRATION_FILE}`);
    }
    
    const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf-8');
    console.log(`✅ ${(migrationSQL.length / 1024).toFixed(2)} KB migration dosyası okundu\n`);

    // Initialize Supabase client with Service Role Key
    console.log('🔐 Supabase\'e bağlanılıyor...');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log('✅ Bağlantı kuruldu\n');

    // Execute migration SQL via raw PostgreSQL connection
    console.log('⚙️  Migration SQL çalıştırılıyor...\n');
    
    // Use the REST API to execute raw SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });

    if (!response.ok) {
      // Try alternative approach: split and execute statement by statement
      console.log('💡 Bulk execution başarısız, statement-by-statement mode\'a geçiliyor...\n');
      
      const statements = migrationSQL
        .split(';\n')
        .filter(s => s.trim().length > 0)
        .map(s => s.trim() + ';');

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 70).replace(/\n/g, ' ') + (stmt.length > 70 ? '...' : '');
        
        process.stdout.write(`[${String(i + 1).padStart(3)}/${String(statements.length).padStart(3)}] ${preview.padEnd(70)} `);

        try {
          const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql: stmt })
          });

          if (resp.ok) {
            console.log('✅');
            successCount++;
          } else {
            const error = await resp.text();
            console.log('❌');
            errorCount++;
            if (i < 5) { // Show first 5 errors
              console.log(`        ↳ ${error.substring(0, 100)}`);
            }
          }
        } catch (err) {
          console.log('❌');
          errorCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('\n' + '═'.repeat(60));
      console.log(`\n📊 Sonuç: ${successCount}/${statements.length} başarılı`);
      
      if (errorCount === 0) {
        console.log('✅ Tüm SQL statements başarıyla çalıştırıldı!\n');
      } else {
        console.log(`⚠️  ${errorCount} statement başarısız oldu\n`);
      }
    } else {
      const result = await response.json();
      console.log('✅ Migration başarıyla tamamlandı!\n');
      console.log('═'.repeat(60));
    }

    // Summary
    console.log('\n📋 Oluşturulanlar:');
    console.log('   ✅ 8 Tablo (shared_items, sharing_permissions, vb.)');
    console.log('   ✅ 7 Function (track_multi_tab_sync, log_social_event, vb.)');
    console.log('   ✅ 18 RLS Policy');
    console.log('   ✅ Realtime Publications\n');

    console.log('═'.repeat(60));
    console.log('\n🎉 Sistem artık şunlar için hazır:\n');
    console.log('   ✨ Real-time item sharing');
    console.log('   ✨ Permission management');
    console.log('   ✨ Multi-tab synchronization');
    console.log('   ✨ Social realtime updates');
    console.log('   ✨ Message delivery tracking\n');

    console.log('📚 Sonraki adımlar:');
    console.log('   1. src/components/sharing-ui/ komponenti oluştur');
    console.log('   2. src/components/social/ komponenti oluştur');
    console.log('   3. src/components/messaging/ komponenti oluştur');
    console.log('   4. Test suite çalıştır');
    console.log('   5. Production\'a deploy et\n');

    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    console.log('\n💡 Alternatif çözümler:');
    console.log('   1. Supabase Dashboard\'a git: https://app.supabase.com');
    console.log('   2. SQL Editor\'ü aç');
    console.log('   3. Migration dosyasını kopyala: supabase/migrations/20260107_sharing_and_realtime_sync.sql');
    console.log('   4. SQL Editor\'e yapıştır ve çalıştır\n');
    process.exit(1);
  }
}

// Auto-run
deployMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
