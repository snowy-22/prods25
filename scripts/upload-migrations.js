#!/usr/bin/env node
/**
 * Supabase Migration Uploader
 * Tüm migration dosyalarını sırayla Supabase'e yükler
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_ID = 'viqadrrqehimyqdqnzvb';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWFkcnJxZWhpbXlxZHF6dniIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMwMTA1MTM4LCJleHAiOjE4ODc4NzExMzh9.xT6nWP0A6PjDDqK5h1yBuVJVU3Pw5Oz9SvfV9YU5LkA';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWFkcnJxZWhpbXlxZHF6dniIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzAxMDUxMzgsImV4cCI6MTg4Nzg3MTEzOH0.X_1kLVL6dHgI_z4rVTi1MdGY5KnU7pWYOY9PEK0XLp0';

const supabase = createClient(
  `https://${PROJECT_ID}.supabase.co`,
  SERVICE_KEY
);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// Migration files to upload (in order)
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

async function uploadMigration(filename) {
  try {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Dosya bulunamadı: ${filename}`);
      return false;
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n📤 Yükleniyor: ${filename}`);
    console.log(`   Boyut: ${(sql.length / 1024).toFixed(2)} KB`);
    
    // Execute SQL
    const { error, data } = await supabase.rpc('exec', { sql_string: sql });
    
    if (error) {
      console.log(`❌ Hata: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Başarılı: ${filename}`);
    return true;
    
  } catch (err) {
    console.log(`❌ Hata: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n🚀 SUPABASE MIGRATIONS YÜKLEME BAŞLANIYOR`);
  console.log(`📍 Project: ${PROJECT_ID}`);
  console.log(`📂 Migration Dosyaları: ${MIGRATION_FILES.length}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of MIGRATION_FILES) {
    const result = await uploadMigration(file);
    if (result) successCount++;
    else failCount++;
    
    // 1 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 SONUÇ:`);
  console.log(`   ✅ Başarılı: ${successCount}/${MIGRATION_FILES.length}`);
  console.log(`   ❌ Başarısız: ${failCount}/${MIGRATION_FILES.length}`);
  
  if (failCount === 0) {
    console.log(`\n🎉 TÜM MİGRATIONLAR BAŞARILI!`);
  } else {
    console.log(`\n⚠️  Başarısız dosyalar hata ile görülmektedir`);
  }
}

main().catch(console.error);
