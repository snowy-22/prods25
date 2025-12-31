# Geliştirme Hızlı Başlangıç Rehberi

## 🚀 Hızlı Başlangıç (5 dakika)

### 1. Bağımlılıkları Yükle
```bash
npm install
# veya
yarn install
# veya
pnpm install
```

### 2. Geliştirme Sunucusunu Başlat
```bash
npm run dev
```

Uygulamaya [http://localhost:3000](http://localhost:3000) adresinden erişin.

### 3. Supabase Veritabanını Hazırla
```bash
# docs/security_schema.sql dosyasındaki SQL komutlarını
# Supabase SQL Editor'de çalıştır
```

### 4. Environment Variables'ı Konfigüre Et
```bash
# .env.local dosyasını oluştur
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
ENCRYPTION_KEY=<32-byte-hex-key>
ENCRYPTION_SALT=<random-salt>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📁 Proje Yapısı

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Ana sayfa
│   ├── canvas/                  # Canvas çalışma alanı
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── analytics/               # Analiz kontrol paneli
│   └── layout.tsx               # Root layout
│
├── components/
│   ├── chat/                    # 🆕 Modern chat bileşenleri
│   │   ├── chat-message.tsx     # Rich message display
│   │   ├── chat-input.tsx       # Advanced input with voice/files
│   │   └── chat-window.tsx      # Chat window wrapper
│   │
│   ├── ui/                      # shadcn/ui bileşenleri
│   ├── canvas.tsx               # Main canvas renderer
│   ├── primary-sidebar.tsx      # Left navigation
│   ├── secondary-sidebar.tsx    # Content panel
│   └── [other components]
│
├── lib/
│   ├── security/                # 🔒 Güvenlik katmanları
│   │   ├── rbac.ts              # Role-based access control
│   │   ├── audit-logger.ts      # Action logging
│   │   ├── encryption.ts        # Data encryption
│   │   ├── rate-limiter.ts      # Request throttling
│   │   ├── gdpr.ts              # GDPR compliance
│   │   └── middleware.ts        # API security middleware
│   │
│   ├── supabase/                # Database utilities
│   ├── store.ts                 # Zustand state management
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Helper functions
│
├── hooks/                       # Custom React hooks
├── providers/                   # Context providers
└── ai/                          # Genkit AI flows

docs/
├── SECURITY_GUIDE.md           # 📖 Güvenlik rehberi
├── IMPLEMENTATION_SUMMARY.md   # 📝 Uygulama özeti
├── security_schema.sql         # 🗄️ DB şema
└── [other documentation]
```

---

## 🔒 Güvenlik Özeti

### Entegre Güvenlik Katmanları
1. **RBAC** - Rol tabanlı erişim kontrolü (4 rol)
2. **Audit Logging** - Tüm önemli eylemler kaydedilir
3. **Encryption** - AES-256-GCM veri şifreleme
4. **Rate Limiting** - API istek sınırlaması
5. **GDPR** - Veri dışa aktarma, silme, rıza yönetimi
6. **Security Headers** - CSP, X-Frame-Options vb.

### API Rotalarını Koruma
```typescript
// Örnek: Güvenli API rotası
import { withAuth, withRateLimit } from '@/lib/security/middleware';
import { RATE_LIMIT_PRESETS } from '@/lib/security/rate-limiter';

export const POST = withAuth(
  withRateLimit(
    handler,
    RATE_LIMIT_PRESETS.api
  )
);
```

### Eylem Günlüğü Kaydetme
```typescript
import { logAuditAction } from '@/lib/security/audit-logger';

await logAuditAction(userId, 'item.create', 'item', {
  resourceId: itemId,
  details: { name: item.name },
  status: 'success'
});
```

---

## 💬 Modern Chat Bileşenleri

### ChatMessage Özellikleri
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  contentType?: 'text' | 'code' | 'image' | 'file' | 'thinking';
  language?: string; // for code blocks
  metadata?: { model?: string; tokensUsed?: number };
  reactions?: { thumbsUp: number; thumbsDown: number };
  userReaction?: 'up' | 'down' | null;
  timestamp: number;
}
```

### ChatInput Özellikleri
- ✅ Auto-expanding textarea
- ✅ File attachment with preview
- ✅ Voice recording (MediaRecorder)
- ✅ Quick suggestions dropdown
- ✅ Model selection (GPT-4 / GPT-3.5)
- ✅ Character counter with progress bar
- ✅ Keyboard shortcuts (Enter to send)

### Kullanım
```typescript
import { ChatWindow } from '@/components/chat/chat-window';

<ChatWindow
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  messages={messages}
  onSendMessage={handleSendMessage}
  currentModel="gpt-4"
  onModelChange={setModel}
  suggestions={[
    "Bana şarkı öner",
    "Kod yaz",
    "Resim analiz et"
  ]}
/>
```

---

## 📊 State Management (Zustand)

### Store'a Erişim
```typescript
import { useAppStore } from '@/lib/store';

// Bileşende kullan
const items = useAppStore((state) => state.allItems);
const setItems = useAppStore((state) => state.setAllItems);
const layoutMode = useAppStore((state) => state.layoutMode);
```

### Store Yapısı
```typescript
type AppStore = {
  // Items & Views
  allItems: ContentItem[];
  activeView: View | null;
  setAllItems: (items: ContentItem[]) => void;
  setActiveView: (view: View) => void;

  // UI State
  layoutMode: 'grid' | 'canvas';
  setLayoutMode: (mode: 'grid' | 'canvas') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // User & Auth
  userProfile: Profile | null;
  setUserProfile: (profile: Profile) => void;
};
```

---

## 🎨 UI & Styling

### Tailwind CSS 4
- Utility-first CSS framework
- Dark mode desteği (planned: next-themes)
- Custom configuration: `tailwind.config.ts`

### shadcn/ui Components
Kullanılabilir bileşenler:
- Button, Input, Textarea
- Dialog, AlertDialog, Sheet
- Card, Badge, Avatar
- Tooltip, Popover, DropdownMenu
- ve daha fazlası...

### Framer Motion Animasyonları
```typescript
import { motion, AnimatePresence } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  İçerik
</motion.div>
```

---

## 🧪 Testing

### Build Kontrol
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

---

## 📚 Komut Referansı

```bash
# Geliştirme
npm run dev           # Dev sunucusu başlat

# Build
npm run build         # Üretim build'i
npm run start         # Üretim build'i çalıştır

# Testing & Quality
npm run lint          # ESLint çalıştır
npm run type-check    # TypeScript type checking

# Temizlik
npm run clean         # Build artifacts'ı sil
```

---

## 🚀 Deployment Hazırlığı

### Önce Yapılması Gerekenler
- [ ] Supabase security schema'sı çalıştırıldı
- [ ] Environment variables ayarlandı
- [ ] Chat komponenti entegre edildi
- [ ] API rotaları güvenlik middleware'i ile korundu
- [ ] Audit logging ayarlandı

### Vercel'e Deploy
```bash
# GitHub'a push et
git push origin main

# Vercel otomatik deploy yapacak
# https://yourapp.vercel.app
```

### Custom Domain
1. Vercel dashboard'a git
2. Settings > Domains
3. Custom domain ekle ve DNS kayıtlarını konfigüre et

---

## 🔗 Faydalı Kaynaklar

- **Türkçe Docs**: docs/SECURITY_GUIDE.md
- **API Guide**: docs/backend.json
- **Database Schema**: docs/supabase_schema.sql
- **Component Library**: shadcn/ui.com
- **Next.js**: nextjs.org/docs
- **Zustand**: github.com/pmndrs/zustand
- **Framer Motion**: framer.com/motion

---

## 💡 İpuçları

### Debugging
```typescript
// Store'u console'da incele
console.log(useAppStore.getState());

// Rerender tracking
import { useWhyDidYouRender } from '@welldone-software/why-did-you-render';
```

### Performance
- Bileşenleri gerektiği gibi memo() ile sarıl
- Zustand'da selector functions kullan
- Large listeleri virtualization ile optimize et
- Images'ı next/image ile optimize et

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Global search
- `Ctrl/Cmd + /`: Shortcuts guide (planned)
- `Escape`: Dialogs kapatma
- `Enter`: Confirm actions

---

## 🤝 Katkıda Bulunma

1. Feature branch oluştur: `git checkout -b feature/amazing-feature`
2. Değişiklikleri commit et: `git commit -m 'Add amazing feature'`
3. Branch'ı push et: `git push origin feature/amazing-feature`
4. Pull Request aç

---

## 📝 Notlar

- **TypeScript Strict Mode**: Etkindir, tüm types belirtilmelidir
- **No Console Warnings**: Production build'inde uyarı olmaz
- **Accessibility**: WCAG 2.1 AA standartlarına uyun
- **Mobile First**: Responsive design önemlidir

---

## ❓ Sık Sorulan Sorular

**S: Yeni bileşen nasıl oluşturum?**
A: `src/components/` klasöründe dosya oluştur, shadcn/ui patterns'ı kullan.

**S: State nereye eklerim?**
A: `src/lib/store.ts`'te Zustand store'una ekle.

**S: API rotası nasıl koruyum?**
A: `withAuth` ve `withRateLimit` middleware'i kulla.

**S: Yeni tablo oluştursam?**
A: `docs/security_schema.sql`'e ekle, migration yap.

---

## 📞 İletişim

- **Issue**: GitHub Issues
- **Discussion**: GitHub Discussions
- **Security**: security@canvasflow.local

---

**Son Güncelleme**: 2024
**Sürüm**: 1.0.0
