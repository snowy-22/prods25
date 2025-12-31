# CanvasFlow Sitesi Haritası & Veri Matrisi

**Son Güncelleme:** 31 Aralık 2025

## 1. Site Haritası (Sitemap)

### Ana Alanlar

```
ROOT
├── Giriş Yap / Kayıt Ol
├── Dashboard
│   ├── Son Öğeler
│   ├── Sık Kullanılan Klasörler
│   └── Paylaşılan İçerikler
│
├── Tuval Çalışma Alanı
│   ├── İzgara Modu
│   │   ├── Duyarlı Izgara Düzeni
│   │   ├── Otomatik Akış
│   │   └── Kayıt Desteği
│   │
│   └── Tuval Modu
│       ├── Sınırsız 2D Alan
│       ├── Özgür Konumlandırma
│       ├── Hizalama Yardımcıları
│       ├── Mesafe Ölçümleri
│       ├── Flow Chart Dinamikleri
│       └── İframe Bağlantıları
│
├── Modül Yönetimi
│   ├── Modülleri Oluştur
│   ├── İçe Aktar / Dışa Aktar
│   ├── Versiyon Kontrol
│   └── Etiketleme & Kategorize Etme
│
├── Analiz Merkezi
│   ├── Modül Analizi
│   │   ├── Kullanım İstatistikleri
│   │   ├── Bağımlılık Haritası
│   │   ├── Performans Metrikleri
│   │   └── Kalite Göstergeleri
│   │
│   ├── İş Akışları
│   │   ├── Process Flow Diyagramları
│   │   ├── Müşteri Yolculuğu
│   │   ├── Veri Akışı
│   │   └── Sistem Mimarisi
│   │
│   └── Veri Matrisleri
│       ├── Özellik Matrisleri
│       ├── Entegrasyon Haritaları
│       └── Sorumluluk Matrisleri
│
├── İşbirliği & Paylaşım
│   ├── Paylaşılan Öğelerim
│   │   ├── Sosyal Analiz
│   │   └── Low Code Analizi
│   │
│   ├── Ekip Çalışması
│   ├── Yorum & Geri Bildirim
│   └── Erişim Yönetimi
│
├── Gelişmiş Özellikler
│   ├── JSON Export/Import
│   ├── HTML Render
│   ├── API Entegrasyonu
│   ├── Webhook Desteği
│   └── Process Otomasyon
│
└── Ayarlar & Yönetim
    ├── Profil Yönetimi
    ├── API Keys
    ├── İndir Ayarları
    └── Pro Admin Dashboard
        ├── JSON Analizleri
        ├── Sistem İstatistikleri
        ├── Kullanıcı Yönetimi
        └── Denetim Kaydı
```

---

## 2. Veri Matrisi

### 2.1 Modül Türleri vs. Özellikler

| Modül Türü | JSON Export | HTML Render | API Aktif | Flow Bağlantı | Analiz |
|------------|-----------|-----------|---------|---------------|--------|
| Player | ✅ | ✅ | ✅ | ✅ | ✅ |
| Folder | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Widget | ✅ | ✅ | ✅ | ✅ | ✅ |
| iframe | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| List | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Custom | ✅ | ✅ | ⚠️ | ✅ | ✅ |

### 2.2 Kullanıcı Rolü vs. İzinler

| Rol | Görüntüle | Düzenle | Sil | Analiz | Admin | Export |
|-----|-----------|--------|-----|--------|-------|--------|
| Guest | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Power User | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pro Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.3 Görüntüleme Modları vs. Desteklenen İşlemler

| Mod | Editleme | Taşıma | Yeniden Boyutlandırma | Hizalama | Mesafe Ölçümü | Flow Chart |
|-----|----------|--------|----------------------|----------|---------------|-----------|
| İzgara | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ |
| Tuval | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sunum | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.4 Veri Akışı

```
Kullanıcı İnputu
    ↓
Modül Oluştur/Düzenle
    ↓
JSON Tracking Sistemi
    ↓
├─→ Yerel Depolama
├─→ Veritabanı
└─→ Analiz Motoru
    ↓
├─→ Kullanıcı Analizi (Paylaşılan Öğeler)
├─→ Admin Analizi (Pro Dashboard)
└─→ Flow Chart Optimizasyonu
    ↓
Export (JSON/HTML/CSV)
```

---

## 3. Müşteri İş Akışı Diyagramı

### 3.1 Ana Kullanıcı Yolculuğu

```
START: Giriş Yap
  ↓
Dashboard Görüntüle
  ↓
[Seç] → Yeni Modül Oluştur / Var Olanı Aç
  ↓
  ├─→ İzgara Modu Seç
  │   ├─ Izgara Düzeninde Çalış
  │   ├─ Otomatik Hizalama
  │   └─ Responsif Layoutta Görüntüle
  │       ↓
  │   Kaydet & Dışa Aktar
  │       ↓
  │
  └─→ Tuval Modu Seç
      ├─ Sınırsız Alande Tasarım
      ├─ Hizalama Kılavuzlarını Kullan
      ├─ Mesafeleri Ölç
      ├─ Flow Chart Bağlantıları Yarat
      └─ İframe'leri Bağla
          ↓
      Analiz et (Modül Analizi)
          ↓
      İş Akışını Tanımla
          ↓
      Dışa Aktar (JSON/HTML/CSV)
          ↓

END: Paylaş / Yayınla
```

### 3.2 Analiz İş Akışı (Pro Users)

```
START: Analiz Merkezi Aç
  ↓
[Seç Analiz Türü]
  ├─→ Modül Analizi
  │   ├─ Kullanım İstatistikleri
  │   ├─ Bağımlılıkları Görselleştir
  │   ├─ Performans Raportu
  │   └─ Kalite Puanı
  │       ↓
  │   [Düzenle & Optimize Et]
  │
  ├─→ İş Akışı Diyagramı
  │   ├─ Process Flow Oluştur
  │   ├─ Adımları Tanımla
  │   ├─ Bağlantıları Kur
  │   └─ Koşulları Ayarla
  │       ↓
  │   [Simülasyon Yap]
  │
  └─→ Veri Matrisi
      ├─ Satırlar & Sütunlar Tanımla
      ├─ Hücreleri Doldur
      ├─ Analiz Yap
      └─ Trend Raporu
          ↓

END: Admin Dashboard'a Gönder / Dışa Aktar
```

### 3.3 Process Otomasyon İş Akışı (Gelecek)

```
START: Process Otomasyon Alanı
  ↓
[Workflow Şablonunu Seç ya da Yeni Yarat]
  ↓
Flow Chart Düzenleyicisinde Tasarla
  ├─ Başlama Noktası
  ├─ Karar Düğümleri (IF/THEN/ELSE)
  ├─ Action Modülleri
  ├─ Subprocesses
  └─ Sonlandırma Noktası
      ↓
Modül Bağlantılarını Kur
  ├─ Input Modülleri Seç
  ├─ Output Modülleri Seç
  └─ Veri Transformation Kuralları Tanımla
      ↓
Tetikleme Koşullarını Ayarla
  ├─ Manual Tetik
  ├─ Schedule (Zaman Tabanlı)
  ├─ Event (Olaya Bağlı)
  └─ Webhook
      ↓
Test Çalıştırması
  ├─ Mock Data ile Test
  ├─ Gerçek Veriyle Test
  └─ Hata Yönetimini Doğrula
      ↓
Yayınla & İzle
  ├─ Execution Logs
  ├─ Error Tracking
  ├─ Performance Monitoring
  └─ Audit Trail

END: İstatistik & Raporlar
```

---

## 4. Fonksiyonal Harita

### 4.1 Core Modüller

| Modül | Dosya | Sorumluluk | Durum |
|-------|-------|-----------|-------|
| Layout Engine | `src/lib/layout-engine.ts` | İzgara & Tuval modu hesaplamaları | ✅ Tamamlandı |
| JSON Tracking | `src/lib/json-tracking.ts` | Modül tracking ve analiz | ✅ Tamamlandı |
| Player Mode Dialog | `src/components/player-mode-dialog.tsx` | Mod seçim arayüzü | ✅ Güncellendi |
| Canvas Helpers | `src/components/canvas-helpers.tsx` | Hizalama & mesafe göstergeleri | ✅ Tamamlandı |
| Analysis Panel | `src/components/analysis-panel.tsx` | Analiz görüntüleme | ✅ Tamamlandı |

### 4.2 Geliştirilecek Modüller

| Modül | Hedef | Süre |
|-------|-------|------|
| Process Automation Engine | Flow chart çalıştırma motoru | Q2 2026 |
| Advanced Flow Visualizer | 3D flow chart görselleştirmesi | Q2 2026 |
| Webhook Integration | Harici sistem entegrasyonu | Q1 2026 |
| Real-time Collaboration | Çoklu kullanıcı düzenleme | Q3 2026 |
| Mobile Apps | iOS/Android uygulamaları | Q4 2026 |

---

## 5. Teknoloji Stack

| Katman | Teknoloji |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| State Management | Zustand |
| UI Components | shadcn/ui |
| Visualization | Framer Motion, SVG |
| Database | Supabase (PostgreSQL) |
| Export | JSON, HTML, CSV |
| Analytics | Custom JSON Tracking |

---

## 6. API Endpoints (Planlanan)

### Modül Yönetimi
- `GET /api/modules` - Modülleri listele
- `POST /api/modules` - Yeni modül oluştur
- `GET /api/modules/:id` - Modül detayı
- `PUT /api/modules/:id` - Modülü güncelle
- `DELETE /api/modules/:id` - Modülü sil
- `GET /api/modules/:id/analysis` - Modül analizi

### İş Akışları
- `GET /api/workflows` - İş akışlarını listele
- `POST /api/workflows` - Yeni iş akışı oluştur
- `POST /api/workflows/:id/execute` - İş akışını çalıştır
- `GET /api/workflows/:id/logs` - Çalıştırma kayıtları

### Analiz
- `GET /api/analytics/modules` - Modül analizleri
- `GET /api/analytics/workflows` - İş akışı istatistikleri
- `GET /api/analytics/dashboard` - Admin dashboard verileri

---

## 7. Güvenlik & Uyum

- ✅ Rol Tabanlı Erişim Kontrolü (RBAC)
- ✅ Veri Şifreleme (Transit & Rest)
- ⏳ GDPR Uyumluluğu
- ⏳ Denetim Kaydı (Audit Logging)
- ⏳ API Rate Limiting
- ⏳ DDoS Koruması

---

## 8. Kullanıcı Deneyimi İyileştirmeleri

### Planlanmış Özellikler
- [ ] Dark Mode desteği
- [ ] Tuval modu için Touch Gestures
- [ ] Klavye Kısayolları Rehberi
- [ ] Bağlamsal Yardım Sistemi
- [ ] Gerçek zamanlı İşbirliği Göstergeleri
- [ ] Özel Tema Oluşturucu

---

**Son Not:** Bu dokümantasyon dönem dönem güncellenir. En son güncellemeler için GitHub projesi takip edilmelidir.
