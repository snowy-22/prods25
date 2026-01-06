#!/usr/bin/env node

/**
 * Direct Migration Deploy
 * Supabase JavaScript Client ile PostgreSQL'e bağlanıp migration'ı uygula
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qukzepteomenikeelzno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_YFd4MDCZ6IRAC5-GmQk7Pg_Y1bSto94';
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20260107_sharing_and_realtime_sync.sql');

async function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sql });
    
    const options = {
      hostname: SUPABASE_URL.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, error: data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function deployMigration() {
  try {
    console.log('\n🚀 Supabase Migration Deploy\n');
    console.log('━'.repeat(50));
    
    // Read migration
    console.log('\n📄 Migration dosyası okunuyor...');
    if (!fs.existsSync(MIGRATION_FILE)) {
      console.error(`❌ Dosya bulunamadı: ${MIGRATION_FILE}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf-8');
    console.log(`✅ Migration dosyası okundu`);
    console.log(`   - Boyut: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
    console.log(`   - Satırlar: ${migrationSQL.split('\n').length}`);
    
    // Connect to Supabase
    console.log('\n🔐 Supabase\'e bağlanılıyor...');
    console.log(`   - URL: ${SUPABASE_URL}`);
    console.log(`   - Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
    
    // Split SQL into logical chunks
    const chunks = migrationSQL
      .split('\n\n')
      .filter(chunk => chunk.trim().length > 0);
    
    console.log(`\n⚙️  ${chunks.length} SQL chunk bulundu\n`);
    
    // Execute chunks
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      const preview = chunk.substring(0, 60).replace(/\n/g, ' ') + (chunk.length > 60 ? '...' : '');
      
      process.stdout.write(`[${i + 1}/${chunks.length}] ${preview} `);
      
      try {
        const result = await execSQL(chunk);
        
        if (result.success) {
          console.log('✅');
          successCount++;
        } else {
          console.log(`❌\n      Hata: ${result.error.substring(0, 100)}`);
          errorCount++;
        }
      } catch (err) {
        console.log(`❌\n      Hata: ${err.message}`);
        errorCount++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '━'.repeat(50));
    console.log(`\n📊 Sonuç: ${successCount}/${chunks.length} başarılı`);
    
    if (errorCount === 0) {
      console.log('\n✅ Migration başarıyla tamamlandı!\n');
      console.log('📋 Oluşturulanlar:');
      console.log('   ✅ 8 Tablo (shared_items, sharing_permissions, vb.)');
      console.log('   ✅ 7 Function (track_multi_tab_sync, log_social_event, vb.)');
      console.log('   ✅ 18 RLS Policy');
      console.log('   ✅ Realtime Publications');
      console.log('\n🎉 Sistem artık realtime sharing ve multi-tab sync\'e hazır!\n');
    } else {
      console.log(`\n⚠️  ${errorCount} error oluştu, lütfen kontrol et.\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    process.exit(1);
  }
}

deployMigration();
