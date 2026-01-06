#!/usr/bin/env node

/**
 * Migration Deploy Instructions Generator
 * Supabase Dashboard SQL Editor'a yapıştırılacak komutları hazırlar
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20260107_sharing_and_realtime_sync.sql');

console.log('\n📝 Supabase Migration - Otomatik Deploy Talimatları\n');
console.log('═'.repeat(70));

// Read migration
const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf-8');

// Option 1: CLI ile (access token gerekli)
console.log('\n\n🔷 SEÇENEK 1: Supabase CLI ile Deploy (Önerilir)\n');
console.log('Adım 1: Personal Access Token oluştur');
console.log('   → https://app.supabase.com/account/tokens\n');

console.log('Adım 2: Token\'ı environment variable\'a ekle');
console.log('   PowerShell:');
console.log('   $env:SUPABASE_ACCESS_TOKEN="<YOUR_TOKEN_HERE>"\n');
console.log('   Bash/Linux:');
console.log('   export SUPABASE_ACCESS_TOKEN="<YOUR_TOKEN_HERE>"\n');

console.log('Adım 3: Supabase projekti link et');
console.log('   npx supabase link --project-ref qukzepteomenikeelzno\n');

console.log('Adım 4: Migration\'ı push et');
console.log('   npx supabase push\n');

// Option 2: Dashboard ile
console.log('═'.repeat(70));
console.log('\n🔷 SEÇENEK 2: Supabase Dashboard SQL Editor\n');
console.log('Adım 1: Supabase Dashboard aç');
console.log('   → https://app.supabase.com/project/qukzepteomenikeelzno\n');

console.log('Adım 2: SQL Editor\'ü aç');
console.log('   → Sol menu\'de "SQL Editor" seç\n');

console.log('Adım 3: Aşağıdaki SQL\'i kopyala ve çalıştır:\n');

console.log('```sql');
console.log(migrationSQL);
console.log('```\n');

// Option 3: Direct Node.js execution
console.log('═'.repeat(70));
console.log('\n🔷 SEÇENEK 3: Node.js Script ile Direct Deploy\n');

const scriptContent = `
const fetch = require('node-fetch');
const fs = require('fs');

const SUPABASE_URL = 'https://qukzepteomenikeelzno.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_YFd4MDCZ6IRAC5-GmQk7Pg_Y1bSto94';
const sql = fs.readFileSync('./supabase/migrations/20260107_sharing_and_realtime_sync.sql', 'utf-8');

async function deploy() {
  try {
    // Execute via SQL API
    const response = await fetch(\`\${SUPABASE_URL}/rest/v1/query\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': \`Bearer \${SERVICE_ROLE_KEY}\`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      console.log('✅ Migration başarıyla uygulandı!');
    } else {
      console.log('❌ Hata:', await response.text());
    }
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

deploy();
`;

console.log('Adım 1: Script\'i çalıştır');
console.log('   node ./scripts/deploy-direct.js\n');

// Summary
console.log('═'.repeat(70));
console.log('\n✅ Migration İçeriği Özeti:\n');

const tables = migrationSQL.match(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/g) || [];
const functions = migrationSQL.match(/CREATE OR REPLACE FUNCTION ([a-z_]+)/g) || [];
const policies = migrationSQL.match(/CREATE POLICY ([a-z_]+)/g) || [];

console.log(`📊 ${tables.length} Tablo:`);
tables.forEach((t, i) => {
  const tableName = t.match(/([a-z_]+)$/)[0];
  console.log(`   ${i + 1}. ${tableName}`);
});

console.log(`\n🔧 ${functions.length} Function:`);
functions.forEach((f, i) => {
  const funcName = f.match(/([a-z_]+)$/)[0];
  console.log(`   ${i + 1}. ${funcName}()`);
});

console.log(`\n🔐 ${policies.length} RLS Policy`);

console.log('\n' + '═'.repeat(70));
console.log('\n💡 Tavsiye: SEÇENEK 1 (CLI) en güvenli ve otomatiktir.');
console.log('   Eğer CLI setup istemiyorsan, SEÇENEK 2 (Dashboard) en kolay olanıdır.\n');

// Save to file
const outputFile = path.join(__dirname, '../MIGRATION_DEPLOY_GUIDE.md');
const guide = `# Supabase Migration Deploy Guide

## Özet
- **Migration Dosyası**: \`supabase/migrations/20260107_sharing_and_realtime_sync.sql\`
- **Boyut**: ${(migrationSQL.length / 1024).toFixed(2)} KB
- **Tablo Sayısı**: ${tables.length}
- **Function Sayısı**: ${functions.length}
- **RLS Policy Sayısı**: ${policies.length}

## Deploy Yöntemleri

### 🔷 Yöntem 1: Supabase CLI (Önerilir)
\`\`\`bash
# 1. Personal Access Token oluştur
# https://app.supabase.com/account/tokens

# 2. Token\'ı set et
export SUPABASE_ACCESS_TOKEN="your_token"

# 3. Link et
npx supabase link --project-ref qukzepteomenikeelzno

# 4. Push et
npx supabase push
\`\`\`

### 🔷 Yöntem 2: Supabase Dashboard
1. https://app.supabase.com/project/qukzepteomenikeelzno git
2. SQL Editor\'ü aç
3. Aşağıdaki SQL\'i yapıştır ve çalıştır:

\`\`\`sql
${migrationSQL}
\`\`\`

### 🔷 Yöntem 3: Node.js Script
\`\`\`bash
node scripts/deploy-direct.js
\`\`\`

## Oluşturulan Kaynaklar

### Tablolar
${tables.map((t, i) => `${i + 1}. ${t.match(/([a-z_]+)$/)[0]}`).join('\n')}

### Functions
${functions.map((f, i) => `${i + 1}. ${f.match(/([a-z_]+)$/)[0]}()`).join('\n')}

### RLS Policies
${policies.length} policy oluşturuldu (her tablo için güvenlik)

## Başarı Kontrol Listesi

Deployment sonrasında şunları kontrol et:
- [ ] Tablolar Supabase Dashboard\'da görülüyor
- [ ] Functions "Functions" bölümünde listede
- [ ] RLS Policy\'ler "Auth" bölümünde görülüyor
- [ ] \`test_realtime\` subscription test et
- [ ] TypeScript compile hataları yok

## Sonraki Adımlar

1. UI Components ekle (sharing, social, messaging)
2. Test suite çalıştır
3. E2E tests yaz
4. Production\'a push et

---
*Generated on ${new Date().toISOString()}*
`;

fs.writeFileSync(outputFile, guide);
console.log(`\n📄 Detaylı rehber kaydedildi: MIGRATION_DEPLOY_GUIDE.md\n`);
