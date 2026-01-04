# AI Sistem Test Rehberi

## ✅ Kurulum Tamamlandı!

AI sisteminiz hazır ve tüm kullanımlar loglanıyor. İşte test etmek için adımlar:

---

## 🚀 Hızlı Test

### 1. Database Migration Çalıştır
```bash
# Supabase projenize migration'ı uygulayın
npx supabase db push
```

Ya da Supabase Dashboard'dan SQL editörüne şunu yapıştırın:
[supabase/migrations/ai_usage_logs.sql](../supabase/migrations/ai_usage_logs.sql)

### 2. AI Chat'i Deneyin
Uygulamayı çalıştırın ve AI chat buttonuna tıklayın:
```bash
npm run dev
```

### 3. Örnek Promptlar
```
"YouTube'da React dersleri bul"
→ youtubeSearch tool'u çağrılacak ✅

"https://react.dev sayfasının içeriğini analiz et"
→ pageScraper tool'u çağrılacak ✅

"Canvas'a bir saat widget'ı ekle"
→ addPlayerTool çağrılacak ✅
```

---

## 📊 Logları Görüntüleme

### Supabase Dashboard
1. Supabase Dashboard → Table Editor → `ai_usage_logs`
2. Tüm AI kullanımlarını görebilirsiniz

### Code ile Sorgulama
```typescript
import { getUserAIStats, getAILogs } from '@/lib/ai/ai-logger';

// Kullanıcının istatistikleri
const stats = await getUserAIStats('user-123', {
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Son 7 gün
});

console.log(stats);
// {
//   totalRequests: 45,
//   successfulRequests: 42,
//   failedRequests: 3,
//   totalTokensUsed: 12500,
//   avgDuration: 1850,
//   topTools: [
//     { tool: 'youtubeSearch', count: 28 },
//     { tool: 'pageScraper', count: 15 }
//   ]
// }

// Detaylı loglar
const logs = await getAILogs('user-123', {
  flowType: 'assistant',
  limit: 10
});
```

### SQL Sorguları (Supabase SQL Editor)
```sql
-- Kullanıcının AI quota'sını kontrol et
SELECT check_ai_quota('user-123', 24, 100);

-- En çok kullanılan tool'lar
SELECT * FROM get_top_tools('user-123', 5);

-- Maliyet tahmini (son 30 gün)
SELECT calculate_ai_cost('user-123');

-- Günlük istatistikler
SELECT * FROM ai_usage_stats
WHERE user_id = 'user-123'
ORDER BY date DESC
LIMIT 7;
```

---

## 🔍 Console Logları

Her AI isteği console'a yazdırılır:

```
🤖 AI Request Started: {
  id: 'ai-1704400000-abc123',
  flowType: 'assistant',
  prompt: 'YouTube\'da React dersleri bul',
  userId: 'user-123'
}

🔧 AI Tool Called [ai-1704400000-abc123]: {
  tool: 'youtubeSearch',
  input: '{"query":"React tutorials"}',
  hasOutput: true,
  duration: '1200ms'
}

✅ AI Request success [ai-1704400000-abc123]: {
  duration: '2500ms',
  tokens: 850
}
```

---

## 🎯 Örnek Akış (End-to-End)

### Kullanıcı İsteği
```
"YouTube'da en iyi TypeScript kurslarını bul ve canvas'a ekle"
```

### AI Otomatik Akışı
1. **youtubeSearch** tool çağrılır
   - Input: `{ query: "best TypeScript courses" }`
   - Output: 5 video bulunur
   - Loglama: ✅ Başarılı, 1200ms

2. **addPlayerTool** 3 kez çağrılır
   - Her video için ayrı ayrı
   - Canvas'a eklenir
   - Loglama: ✅ Her biri ~80ms

3. **AI Yanıtı**
   - "3 adet en iyi TypeScript kursunu canvas'a ekledim..."
   - Loglama: ✅ Toplam 2500ms, 850 token

### Database Kaydı
```json
{
  "id": "ai-1704400000-abc",
  "user_id": "user-123",
  "flow_type": "assistant",
  "prompt": "YouTube'da en iyi TypeScript kurslarını bul ve canvas'a ekle",
  "model_name": "gemini-1.5-flash",
  "tool_calls": [
    {
      "tool_name": "youtubeSearch",
      "input": { "query": "best TypeScript courses" },
      "output": [ /* 5 video */ ],
      "duration_ms": 1200,
      "timestamp": 1704400000000
    },
    {
      "tool_name": "addPlayerTool",
      "input": { "url": "...", "title": "TypeScript Full Course", "type": "video" },
      "output": { "success": true, "itemId": "ai-item-..." },
      "duration_ms": 80,
      "timestamp": 1704400001200
    }
    // ... 2 video daha
  ],
  "status": "success",
  "tokens_used": 850,
  "duration_ms": 2500,
  "started_at": 1704400000000,
  "completed_at": 1704400002500
}
```

---

## 📈 Analytics Dashboard (Opsiyonel)

İleride eklenebilecek analytics sayfası için hazır:

```typescript
// src/app/analytics/ai-usage/page.tsx
export default async function AIUsageAnalytics() {
  const stats = await getUserAIStats(currentUser.id);
  
  return (
    <div>
      <h1>AI Kullanım İstatistikleri</h1>
      
      {/* Toplam istekler */}
      <StatCard 
        title="Toplam İstekler"
        value={stats.totalRequests}
      />
      
      {/* Başarı oranı */}
      <StatCard
        title="Başarı Oranı"
        value={`${(stats.successfulRequests / stats.totalRequests * 100).toFixed(1)}%`}
      />
      
      {/* En çok kullanılan tool'lar */}
      <ToolsChart data={stats.topTools} />
      
      {/* Maliyet tahmini */}
      <CostEstimate userId={currentUser.id} />
    </div>
  );
}
```

---

## ⚙️ Yapılandırma

### Quota Limitleri Ayarlama
```typescript
// Kullanıcı her AI isteği öncesi kontrol edilebilir
const quota = await checkAIQuota(userId, 24, 100); // 24 saatte max 100 istek

if (quota.quota_exceeded) {
  throw new Error('AI quota limit exceeded. Try again later.');
}
```

### Rate Limiting
Middleware'de otomatik kontrol:
```typescript
// src/app/api/ai/assistant/route.ts
export const POST = withMiddleware(handler, [
  withValidation,
  withRateLimit, // ✅ Zaten var
  withSecurityHeaders,
]);
```

---

## 🐛 Debugging

### Hata Durumu Logları
```sql
-- Başarısız istekler
SELECT * FROM ai_usage_logs
WHERE status = 'error'
ORDER BY started_at DESC
LIMIT 10;

-- Tool hataları
SELECT
  id,
  user_id,
  tool_calls
FROM ai_usage_logs
WHERE tool_calls::text LIKE '%"error"%'
ORDER BY started_at DESC;
```

### Performance İzleme
```sql
-- Yavaş tool'lar (>5 saniye)
SELECT
  jsonb_array_elements(tool_calls) ->> 'tool_name' as tool,
  AVG((jsonb_array_elements(tool_calls) ->> 'duration_ms')::INTEGER) as avg_ms
FROM ai_usage_logs
WHERE tool_calls IS NOT NULL
GROUP BY tool
HAVING AVG((jsonb_array_elements(tool_calls) ->> 'duration_ms')::INTEGER) > 5000;
```

---

## ✨ Özet

**Kurulum Tamamlandı! ✅**

- ✅ AI function calling hazır
- ✅ Her istek loglanıyor (database)
- ✅ Console logları aktif
- ✅ Tool çağrıları tracked
- ✅ Quota sistem hazır
- ✅ Maliyet hesaplama fonksiyonları ready
- ✅ Analytics queries hazır

**Şimdi yapmanız gerekenler:**
1. Migration'ı çalıştır: `npx supabase db push`
2. Uygulamayı başlat: `npm run dev`
3. AI chat'i test et: "YouTube'da React dersleri bul"
4. Logları kontrol et: Supabase Dashboard → `ai_usage_logs`

**Hazır! 🚀**
