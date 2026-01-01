# Supabase & Vercel Subscription Rehberi

Bu rehber, CanvasFlow'un realtime ve production özellikleri için gerekli Supabase ve Vercel subscription ayarlamalarını kapsamaktadır.

## 📊 Özet: Ne Hangi Plan'da Çalışır?

| Özellik | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| **Supabase** | | | |
| Storage (GB) | 1 | 100 | Custom |
| Database rows | Unlimited | Unlimited | Unlimited |
| Realtime connections | 2 | 100 | Unlimited |
| Realtime messages/sec | 100 | 500 | Unlimited |
| Edge Functions | 1 | 10 | Unlimited |
| RLS Policies | ✅ | ✅ | ✅ |
| **Vercel** | | | |
| Deployments | Unlimited | Unlimited | Unlimited |
| Serverless Functions | ✅ | ✅ | ✅ |
| Custom Domains | ✅ | ✅ | ✅ |
| Analytics | ✅ | Advanced | Advanced |
| **CanvasFlow Özellikleri** | | | |
| Basic canvas usage | ✅ | ✅ | ✅ |
| OAuth (Google/GitHub) | ✅ | ✅ | ✅ |
| Realtime comments/likes | ⚠️ Sınırlı | ✅ | ✅ |
| Realtime folder sync | ⚠️ Sınırlı | ✅ | ✅ |
| Video streaming | ⚠️ 1 GB limit | 100 GB | Unlimited |
| Concurrent users | ~10 | ~100 | Unlimited |

---

## 🆓 FREE PLAN (Başlangıç)

### Supabase Free
**Sağladığı:** Geliştirme ortamı, küçük scale kullanıcılar

```bash
# Supabase CLI ile login
npx supabase login

# Project oluştur
npx supabase projects create --name "CanvasFlow"
```

**Limitler:**
- 2 concurrent realtime connection
- 100 messages/sec
- 1 GB storage
- Auto-pause after 1 hafta inaktivite

### Vercel Free
Ücretsiz Deploy ile başlayabilirsin: `vercel.com`

**Setup:**
```bash
# Vercel ile bağlantı kur
vercel link

# Environment variables ekle
vercel env pull .env.local
```

**Limitler:**
- 12 Serverless Functions invocation/sec
- 100 GB bandwidth/month

---

## 💰 PRO PLAN (Recommended - Üretim)

### Supabase Pro ($25/ay)
`https://supabase.com/pricing` → **Pro Plan**'ı seç

**Kurulum:**

1. **Supabase Dashboard'a git:**
   - https://app.supabase.com
   - Organizasyonuna git → Billing
   - "Upgrade to Pro" tıkla

2. **Vercel bağlantısı:**
   ```bash
   # Supabase connection string'i kopyala
   # Dashboard → Project → Database → Connection pooling
   
   # Vercel'e ekle
   vercel env add DATABASE_URL "postgresql://user:pass@..."
   ```

3. **RLS Policies etkinleştir:**
   ```sql
   -- Dashboard → SQL Editor'da çalıştır
   ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE item_stats ENABLE ROW LEVEL SECURITY;
   ```

### Vercel Pro ($20/ay per team)
`https://vercel.com/account/billing/overview` → **Upgrade**

**Sağladığı:**
- Unlimited Serverless Functions invocation
- 1 TB bandwidth/month
- Priority support
- Advanced analytics

**Setup:**
```bash
# Team oluştur
vercel teams create canvasflow

# Pro upgrade et (team settings'ten)
```

### Toplam Maliyet: ~$45/ay
- Supabase Pro: $25
- Vercel Pro: $20

---

## 🚀 ENTERPRISE (Yüksek Scale)

Supabase Custom Enterprise & Vercel Enterprise for agencies

**Gerekli:** 
- 1000+ aktif user
- 100+ GB storage
- Custom SLA
- Dedicated support

İletişim: `sales@supabase.io`, `sales@vercel.com`

---

## 🔧 Realtime Subscriptions Kurulumu

### 1. Supabase Realtime Enable Et

```bash
# CLI ile
npx supabase link --project-ref <project-id>
npx supabase realtime enable

# Veya Dashboard'dan:
# Settings → Realtime → Enable
```

### 2. RLS Policies (Güvenlik)

```sql
-- Users can only access their own content
CREATE POLICY "users_can_access_own_content"
  ON content_items
  FOR ALL
  USING (user_id = auth.uid());

-- Public read for shared items
CREATE POLICY "public_read_shared_items"
  ON content_items
  FOR SELECT
  USING (is_public = true);

-- Comments policy
CREATE POLICY "anyone_can_read_comments"
  ON comments
  FOR SELECT
  USING (true);

CREATE POLICY "users_can_create_comments"
  ON comments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### 3. Realtime Subscriptions Test Et

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(PUBLIC_URL, PUBLIC_KEY);

// Folder contents subscription
const subscription = supabase
  .channel('folder:123')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'content_items' },
    (payload) => console.log('Update:', payload)
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## 📁 Vercel Environment Variables

### Development (.env.local)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Production (Vercel Dashboard)
Settings → Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://tv25.org
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_OAUTH_GOOGLE_SECRET=GOCSPX-...
SUPABASE_OAUTH_GITHUB_SECRET=ghp_...
```

---

## ✅ Checklist: Production Deployment

- [ ] Supabase Pro plan aktif
- [ ] Vercel Pro team kurulu
- [ ] RLS Policies enable edilmiş
- [ ] Realtime subscriptions test edilmiş
- [ ] OAuth callback URLs güncellenmiş
- [ ] Database backups enable edilmiş
- [ ] CORS headers ayarlanmış
- [ ] Rate limiting configure edilmiş
- [ ] Error monitoring (Sentry) kurulu
- [ ] Performance monitoring aktif

---

## 💡 Cost Optimization İpuçları

### 1. Realtime Connections Minimize Et
```typescript
// ✅ Debounce subscriptions
const useRealtimeWithDebounce = (channel: string, ms = 500) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const subscribe = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Subscribe logic
    }, ms);
  };
  
  return subscribe;
};
```

### 2. Edge Functions Yerine Serverless Kullan
```bash
# Supabase Edge Functions = $0.50/million requests
# Vercel Serverless = Free (Pro'da unlimited)

# Prefer Vercel API routes
```

### 3. Database İndexes
```sql
-- Frequent queries için
CREATE INDEX idx_user_items ON content_items(user_id, created_at DESC);
CREATE INDEX idx_folder_contents ON content_items(parent_id, created_at DESC);
CREATE INDEX idx_comments_item ON comments(item_id, created_at DESC);
```

---

## 🆘 Troubleshooting

### Realtime Connection Dropped
**Çözüm:**
```typescript
.subscribe((status) => {
  if (status === 'CHANNEL_ERROR') {
    // Reconnect logic
    setTimeout(() => resubscribe(), 5000);
  }
});
```

### Rate Limit Exceeded
**Çözüm:**
- Subscriptions count'unu azalt
- Batch updates kullan (debounce)
- Pro plan'a upgrade et

### OAuth Redirect Fails
**Çözüm:**
```
1. Supabase Dashboard → Authentication → Providers
2. Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback
   - https://tv25.org/api/auth/callback
```

---

## 📞 İletişim & Destek

- **Supabase Forum:** https://github.com/supabase/supabase/discussions
- **Vercel Support:** https://vercel.com/help
- **CanvasFlow Issues:** https://github.com/snowy-22/prods25/issues

---

## 🎯 Sonraki Adımlar

1. [ ] Supabase Pro upgrade et: https://app.supabase.com
2. [ ] Vercel team kur: https://vercel.com/teams
3. [ ] RLS policies uygulamak
4. [ ] Realtime subscriptions test etmek
5. [ ] Analytics & monitoring kur

**Estimated Time:** ~30 dakika
**Toplam Maliyet:** $45/ay (Pro plan'lar)

---

**Son Güncelleme:** January 2026
**CanvasFlow v2.0**
