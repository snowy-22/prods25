# ✅ AI Sistemi Kurulumu Tamamlandı!

## 🎉 Ne Eklendi?

### 1. AI Loglama Sistemi
**Dosya:** `src/lib/ai/ai-logger.ts`

Tüm AI kullanımlarını otomatik loglar:
- ✅ Her AI isteği (prompt, user, timestamp)
- ✅ Her tool çağrısı (input, output, duration)
- ✅ Başarı/hata durumları
- ✅ Token kullanımı
- ✅ Maliyet hesaplama

**Kullanım:**
```typescript
// İstek başladı
const logId = await logAIRequest(userId, 'assistant', { prompt: '...' });

// Tool çağrıldı
await logToolCall(logId, 'youtubeSearch', { query: 'React' }, results);

// İstek tamamlandı
await updateAIRequestStatus(logId, 'success', { tokensUsed: 850 });
```

### 2. Assistant Flow Güncellemesi
**Dosya:** `src/ai/flows/assistant-flow.ts`

Artık her AI çağrısı otomatik olarak loglanıyor:
- 🔥 İstek başladığında log
- 🔥 Her tool çağrısında log
- 🔥 İstek tamamlandığında log

### 3. Database Schema
**Dosya:** `supabase/migrations/ai_usage_logs.sql`

Yeni tablo ve fonksiyonlar:
- `ai_usage_logs` - Ana log tablosu
- `ai_usage_stats` - İstatistik view
- `check_ai_quota()` - Quota kontrolü
- `get_top_tools()` - En çok kullanılan tool'lar
- `calculate_ai_cost()` - Maliyet hesaplama

### 4. Dokümantasyon
- 📚 [AI Function Calling Tutorial](./AI_FUNCTION_CALLING_TUTORIAL.md) - Detaylı eğitim
- 🧪 [AI System Test Guide](./AI_SYSTEM_TEST_GUIDE.md) - Test rehberi
- 💻 [AI Function Calling Examples](../src/lib/ai/ai-function-calling-examples.ts) - Kod örnekleri

---

## 🚀 Hızlı Başlangıç

### Adım 1: Migration Çalıştır
```bash
npx supabase db push
```

Ya da Supabase Dashboard'dan SQL editöründe çalıştır:
```sql
-- supabase/migrations/ai_usage_logs.sql içeriğini yapıştır
```

### Adım 2: Uygulamayı Başlat
```bash
npm run dev
```

### Adım 3: AI Chat'i Test Et
1. AI chat buttonuna tıkla
2. Prompt gir: **"YouTube'da React dersleri bul"**
3. Console'da logları gör:
```
🤖 AI Request Started: { id: 'ai-...', prompt: '...' }
🔧 AI Tool Called: { tool: 'youtubeSearch', ... }
✅ AI Request success: { duration: '2500ms', tokens: 850 }
```

### Adım 4: Logları Kontrol Et
**Supabase Dashboard:**
- Table Editor → `ai_usage_logs`

**SQL Query:**
```sql
SELECT * FROM ai_usage_logs 
WHERE user_id = 'your-user-id'
ORDER BY started_at DESC
LIMIT 10;
```

---

## 📊 Özellikler

### Otomatik Loglama
Her AI kullanımı otomatik kaydedilir:
```typescript
{
  id: 'ai-1704400000-abc',
  user_id: 'user-123',
  flow_type: 'assistant',
  prompt: 'YouTube\'da React dersleri bul',
  model_name: 'gemini-1.5-flash',
  tool_calls: [
    {
      tool_name: 'youtubeSearch',
      input: { query: 'React tutorials' },
      output: [ /* results */ ],
      duration_ms: 1200
    }
  ],
  status: 'success',
  tokens_used: 850,
  duration_ms: 2500
}
```

### İstatistikler
```typescript
const stats = await getUserAIStats('user-123');
// {
//   totalRequests: 45,
//   successfulRequests: 42,
//   topTools: [{ tool: 'youtubeSearch', count: 28 }],
//   totalTokensUsed: 12500
// }
```

### Quota Kontrolü
```typescript
const quota = await checkAIQuota('user-123', 24, 100);
// {
//   quota_exceeded: false,
//   remaining_requests: 73,
//   reset_at: '2024-01-05T10:00:00Z'
// }
```

### Maliyet Hesaplama
```sql
SELECT calculate_ai_cost('user-123');
-- {
--   total_tokens: 12500,
--   estimated_cost_usd: 0.0019,
--   estimated_cost_try: 0.06
-- }
```

---

## 🎯 Function Calling Nasıl Çalışır?

### 1. Tool Tanımlama
```typescript
const youtubeSearchTool = ai.defineTool(
  {
    name: 'youtubeSearch',
    description: 'YouTube\'da video arar',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.object({ title: z.string(), url: z.string() })),
  },
  async ({ query }) => {
    // YouTube API çağrısı
    const results = await searchYouTube(query);
    return results;
  }
);
```

### 2. AI Kullanımı
AI otomatik olarak tool'u çağırır:
```
Kullanıcı: "YouTube'da React dersleri bul"
  ↓
AI: youtubeSearch({ query: "React tutorials" }) çağırır
  ↓
Tool: [video1, video2, video3] döner
  ↓
AI: "İşte bulduğum videolar: ..." yanıtını verir
```

### 3. Loglama
Tüm süreç otomatik loglanır ✅

---

## 📖 Detaylı Dokümantasyon

### Eğitim Dökümanları
1. **[AI_FUNCTION_CALLING_TUTORIAL.md](./AI_FUNCTION_CALLING_TUTORIAL.md)**
   - Function calling nedir?
   - Nasıl çalışır?
   - Tool tanımlama
   - Pratik örnekler

2. **[AI_SYSTEM_TEST_GUIDE.md](./AI_SYSTEM_TEST_GUIDE.md)**
   - Test adımları
   - SQL sorguları
   - Debugging
   - Analytics örnekleri

3. **[ai-function-calling-examples.ts](../src/lib/ai/ai-function-calling-examples.ts)**
   - 10+ kod örneği
   - Copy-paste hazır
   - Best practices

---

## 🔍 Console Logları

### Başarılı İstek
```
🤖 AI Request Started: {
  id: 'ai-1704400000-abc',
  flowType: 'assistant',
  prompt: 'YouTube\'da React dersleri bul',
  userId: 'user-123'
}

🔧 AI Tool Called [ai-1704400000-abc]: {
  tool: 'youtubeSearch',
  input: '{"query":"React tutorials"}',
  hasOutput: true,
  duration: '1200ms'
}

✅ AI Request success [ai-1704400000-abc]: {
  duration: '2500ms',
  tokens: 850
}
```

### Hata Durumu
```
🤖 AI Request Started: { id: 'ai-...', ... }

🔧 AI Tool Called: { tool: 'youtubeSearch', ... }

❌ AI Request error [ai-...]: {
  error: 'YouTube API rate limit exceeded'
}
```

---

## 💡 Kullanım Örnekleri

### Basit Kullanım
```typescript
import { logAIRequest, updateAIRequestStatus } from '@/lib/ai/ai-logger';

const logId = await logAIRequest(userId, 'assistant', {
  prompt: userMessage,
});

try {
  const result = await askAI(userMessage);
  await updateAIRequestStatus(logId, 'success', { tokensUsed: 850 });
} catch (error) {
  await updateAIRequestStatus(logId, 'error', { errorMessage: error.message });
}
```

### İstatistik Görüntüleme
```typescript
import { getUserAIStats } from '@/lib/ai/ai-logger';

const stats = await getUserAIStats('user-123', {
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Son 7 gün
});

console.log('AI Kullanımı:', stats.totalRequests);
console.log('Başarı Oranı:', stats.successfulRequests / stats.totalRequests);
console.log('En Popüler Tool:', stats.topTools[0]?.tool);
```

### Quota Kontrolü
```typescript
const quota = await checkAIQuota(userId, 24, 100);

if (quota.quota_exceeded) {
  alert(`AI limiti aşıldı. ${quota.remaining_requests} istek hakkınız kaldı.`);
  return;
}
```

---

## 🛠️ Troubleshooting

### Loglar Gözükmüyor
1. Migration çalıştı mı? → `npx supabase db push`
2. Supabase'de `ai_usage_logs` tablosu var mı?
3. RLS policy'leri aktif mi?

### Tool Çağrılmıyor
1. Tool tanımı doğru mu?
2. `tools` array'ine eklendi mi?
3. Description yeterince açıklayıcı mı?

### Performance Sorunları
```sql
-- Yavaş tool'ları bul
SELECT * FROM get_top_tools('user-123', 10)
WHERE avg_duration_ms > 5000;
```

---

## 📈 Analytics (İleride Eklenebilir)

Dashboard sayfası için hazır veriler:
- Günlük/haftalık/aylık kullanım grafikleri
- Tool kullanım dağılımı (pie chart)
- Başarı/hata oranları
- Token kullanımı timeline
- Maliyet takibi

---

## ✨ Özet

**Kuruldu ve Hazır! ✅**

- ✅ Google Gemini 1.5 Flash aktif (ücretsiz)
- ✅ Function calling sistemi hazır
- ✅ Tüm kullanımlar loglanıyor
- ✅ İstatistik fonksiyonları hazır
- ✅ Quota sistemi aktif
- ✅ Maliyet hesaplama hazır
- ✅ Dokümantasyon tam

**Şimdi ne yapmalı?**
1. ✅ Migration çalıştır
2. ✅ Uygulamayı başlat
3. ✅ AI chat'i test et
4. ✅ Logları kontrol et

**Hazır! 🚀**

---

## 📞 Yardım

Sorularınız için:
- 📚 [Tutorial](./AI_FUNCTION_CALLING_TUTORIAL.md) - Detaylı eğitim
- 🧪 [Test Guide](./AI_SYSTEM_TEST_GUIDE.md) - Test adımları
- 💻 [Examples](../src/lib/ai/ai-function-calling-examples.ts) - Kod örnekleri
