#!/usr/bin/env node
/**
 * Supabase Direct SQL Upload Script
 * Tüm migration dosyalarını sırayla Supabase'e yükler
 * REST API endpoint kullanarak doğrudan SQL execution
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'viqadrrqehimyqdqnzvb';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWFkcnJxZWhpbXlxZHF6dnpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODE4MzI5MCwiZXhwIjoxNzU0ODI4MDkwLCJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWFkcnJxZWhpbXlxZHF6dnpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODE4MzI5MCwiZXhwIjoxNzU0ODI4MDkwfQ.NVxhYxSwDxM2ybYOQKbEVQfFoO_8a7gp81TrLXJ_chc';

const MIGRATION_FILES = [
  '20260101000000_user_roles_system.sql',
  '20260101_referral_system.sql',
  '20260103000001_user_canvas_sync.sql',
  '20260104_ai_usage_logs.sql',
  '20260104_encryption_keys_rls.sql',
  '20260105_social_system_fresh.sql',
  '20260107_live_data_sync_comprehensive.sql',
  '20260107_sharing_and_realtime_sync.sql',
  '20260107_trash_scenes_presentations.sql',
  '20260107_widget_cloud_sync.sql'
];

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

/**
 * Execute SQL via Supabase SQL API
 */
function executeSql(sqlContent) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Length': Buffer.byteLength(JSON.stringify({ sql: sqlContent }))
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          try {
            const parsed = JSON.parse(data);
            reject(new Error(`Status ${res.statusCode}: ${parsed.message || data}`));
          } catch (e) {
            reject(new Error(`Status ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(JSON.stringify({ sql: sqlContent }));
    req.end();
  });
}

/**
 * Upload single migration file
 */
async function uploadMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const stats = fs.statSync(filepath);

  console.log(`\n📤 Yükleniyor: ${filename}`);
  console.log(`   Boyut: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Satır: ${content.split('\n').length}`);

  try {
    await executeSql(content);
    console.log(`✅ Başarılı: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error(`❌ Hata: ${error.message}`);
    return { success: false, filename, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   🚀 SUPABASE MIGRATIONS DIRECT UPLOAD                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Project: ${PROJECT_ID}`);
  console.log(`📂 Migration Dosyaları: ${MIGRATION_FILES.length}`);
  console.log(`📁 Dizin: ${MIGRATIONS_DIR}\n`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (const filename of MIGRATION_FILES) {
    try {
      const result = await uploadMigration(filename);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Delay between uploads
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Exception: ${error.message}`);
      failureCount++;
      results.push({ success: false, filename, error: error.message });
    }
  }

  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   📊 SONUÇ                                              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Başarılı: ${successCount}/${MIGRATION_FILES.length}`);
  console.log(`❌ Başarısız: ${failureCount}/${MIGRATION_FILES.length}`);

  if (failureCount > 0) {
    console.log('\n⚠️  Başarısız dosyalar:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   • ${r.filename}`);
        if (r.error) console.log(`     → ${r.error}`);
      });
  }

  if (successCount === MIGRATION_FILES.length) {
    console.log('\n🎉 TÜM MİGRATIONLAR BAŞARILI!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Bazı migrasyonlar başarısız oldu.');
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
