# Proje Genel Bakışı: CanvasFlow

Bu doküman, CanvasFlow uygulamasının temel konseptini, mimarisini, ana fonksiyonlarını ve veri yapılarını açıklamaktadır. Projeye dahil olan veya projeyi anlamak isteyen herkes için bir başlangıç noktası olarak tasarlanmıştır.

## 1. Temel Konsept

CanvasFlow, kullanıcıların çeşitli web içeriklerini (videolar, resimler, web siteleri) ve özel olarak tasarlanmış araç takımlarını (widget'lar: saat, not defteri, yapılacaklar listesi vb.) organize etmelerine, düzenlemelerine ve bu içeriklerle etkileşime girmelerine olanak tanıyan, dinamik ve iki modlu (ızgara ve tuval) bir "dijital tuval" uygulamasıdır.

Uygulamanın temel amacı, kullanıcılara sonsuz bir yaratıcılık ve organizasyon alanı sunarak, farklı veri türlerini tek bir merkezi arayüzde birleştirmektir. Yeni sürümde tüm yerleşimler json-temelli izlenebilir, analiz edilebilir ve süreç otomasyonuna hazır olacak şekilde tasarlandı.

## 2. Ana Özellikler ve Mimarisi

Uygulama, modern React ve Next.js prensipleri üzerine inşa edilmiş bileşen tabanlı bir mimariye sahiptir. Tüm iletişim, veri koruması ve erişim kontrolü için kurumsal düzeyde güvenlik katmanları entegre edilmiştir. İşte anahtar bileşenler ve işlevleri:

### a. Ana Motor: Zustand Store (`src/lib/store.ts`)

Bu uygulama, durum yönetimi için **Zustand** kullanır. Tüm uygulama durumu (`allItems`, `activeView`, `selectedItemIds` vb.) merkezi bir store'da tutulur ve `persist` middleware'i ile tarayıcı hafızasında (localStorage) saklanır.

- **Durum Yönetimi:** Tüm içerik öğelerinin ağaç yapısı, kullanıcı tercihleri ve arayüz panellerinin durumları bu store üzerinden yönetilir.
- **Reaktif Güncellemeler:** Bileşenler, sadece ihtiyaç duydukları durum parçalarına abone olarak yüksek performanslı güncellemeler alır.
- **Kalıcılık:** Uygulama kapatılsa bile veriler `localStorage` üzerinde JSON formatında saklanmaya devam eder.

### b. Görsel Tuval: `src/components/canvas.tsx`

Bu bileşen, `activeView` içindeki içerik öğelerini (`ContentItem[]`) alıp seçilen yerleşim moduna göre ekrana çizen görsel katmandır.

- **Yerleşim Modları:** `layoutMode` artık yalnızca `grid` (ızgara) ve `canvas` (tuval) modlarını destekler. Izgara modunda responsive ve sınırlı yükseklikli bir yapı; tuval modunda ise sınırsız 2D alanda serbest yerleşim sağlanır.
- **Çakışma Önleme ve Hizalama:** Tuval modunda eksen hizalama, mesafe ölçümü ve çakışma kontrolü (AABB) ile öğeler üst üste binmez. `canvas-helpers.tsx` içindeki SVG katmanı hizalama çizgilerini, mesafe ölçümlerini ve akış oklarını gösterir.
- **Sürükle ve Bırak:** Öğeleri yeniden sıralamak veya konumlandırmak için sürükle-bırak işlevselliği, grid snap ve minimum/maximum boyut kısıtlarıyla çalışır.
- **Dinamik Stilizasyon:** `PlayerFrame` bileşeni, her öğeye minimum/maximum yükseklik (160px-600px) ve responsive stil uygular; tuval ölçeklendirmesi için `zoom` kullanılır.

### c. Kenar Çubukları ve Gezinme

- **`primary-sidebar.tsx`:** Uygulamanın en solunda yer alan ana gezinme çubuğudur. Kitaplık, Sosyal Merkez, Bildirimler ve Mesajlar gibi ana bölümlere geçişi sağlar. Ayrıca kullanıcı profili, arama ve ayarlar gibi genel eylemler için giriş noktasıdır.
- **`secondary-sidebar.tsx`:** Birincil kenar çubuğundan yapılan seçime göre içeriği değişen ikincil paneldir.
    - **Kitaplık Modu:** Tüm klasör ve listeleri hiyerarşik bir ağaç yapısında gösterir. Kullanıcıların içeriklerini düzenlemesine, yeni öğeler eklemesine ve gezinmesine olanak tanır.
    - **Sosyal/Mesajlar/Bildirimler Modu:** Kullanıcıları, paylaşılan içerikleri, sohbetleri ve uygulama içi bildirimleri gösterir.

### d. Ayar Panelleri ve Diyaloglar

- **`style-settings-panel.tsx`:** Hem "Oynatıcı Ayarları" (çerçeveler, animasyonlar, arka planlar) hem de "Düzen Ayarları"nı (ızgara boyutu, sütun/satır sayısı) içeren birleşik paneldir.
- **`share-dialog.tsx`:** Seçilen bir içeriği paylaşmak için URL, QR kod, HTML gömme kodu ve sosyal medya paylaşım seçenekleri sunar.
- **`global-search.tsx`:** `Ctrl/Cmd + K` ile açılan, hem içerik/ayar araması yapabilen hem de yapay zeka asistanına komutlar gönderebilen merkezi bir arama penceresidir.

### e. İzleme ve Analiz Katmanı

- **`src/lib/json-tracking.ts`:** Tüm modüller için sürümlemeli meta veri, kullanım günlükleri ve süreç akışları (ProcessFlowDefinition) üreten json-temelli takip altyapısı.
- **`src/components/analysis-panel.tsx`:** Modül analizleri, süreç akışları ve veri matrislerini gösteren üç sekmeli panel; yönetici modunda JSON/CSV/HTML/Excel çıktıları sunar.
- **`docs/SITEMAP_AND_DATA_MATRIX.md`:** Site haritası, veri matrisleri ve müşteri iş akışı diyagramları için güncel başvuru dokümanı.

## 3. Temel Veri Yapısı: `ContentItem`

Uygulamadaki her şey (`klasör`, `video`, `saat widget'ı` vb.) bir `ContentItem` nesnesi olarak temsil edilir. Bu yapı, `src/lib/initial-content.ts` dosyasında tanımlanmıştır.

### Anahtar Özellikler:

- **`id` (string):** Her öğe için benzersiz bir kimlik.
- **`type` (ItemType):** Öğenin türünü belirtir (ör: `folder`, `video`, `clock`). Bu, öğenin nasıl render edileceğini belirler.
- **`title` (string):** Öğenin başlığı.
- **`children` (ContentItem[] | undefined):** Bir klasör veya liste ise, içindeki alt öğeleri içeren bir dizi. Bu, uygulamanın hiyerarşik yapısını oluşturur.
- **`url` (string):** Video, resim veya web sitesi gibi harici bir kaynağın adresi.
- **`layoutMode` ve Diğer Görünüm Ayarları:** Artık `grid` ve `canvas` modlarıyla sınırlıdır. Tuval modunda `x`, `y`, `width`, `height` koordinatları ve hizalama/çakışma kuralları kullanılır.
- **Diğer Özellikler:** Oluşturma/güncelleme tarihleri, ikon, rating, öncelik, paylaşım ayarları gibi birçok meta veriyi barındırır.

## 4. Yapay Zeka Entegrasyonu

Uygulama, `src/ai/flows/assistant-flow.ts` dosyası aracılığıyla güçlü bir yapay zeka asistanı içerir. Bu asistan, Genkit ve Google AI kullanarak çalışır.

- **Araç Kullanımı (Tool Use):** Asistan, sadece metin yanıtları vermekle kalmaz, aynı zamanda belirli "araçları" kullanabilir.
- **Arayüz Rehberliği:** `highlightElement` aracını kullanarak, "Bana uygulamayı gezdir" gibi komutlara yanıt olarak arayüzdeki butonları (`data-testid` ile) görsel olarak vurgulayabilir ve kullanıcıya rehberlik edebilir.
- **Web Araması:** `googleSearchTool` ile web'de arama yapabilir ve sonuçları kullanıcıya sunabilir.
- **Ajanda Döngüsü (Agentic Loop):** Bir hedefe ulaşmak için birden fazla aracı ardı ardına çağırabilen basit bir ajanda mantığına sahiptir.

## 5. Geliştirme Süreci ve Modernizasyon

Uygulama yakın zamanda önemli bir modernizasyon ve güvenlik iyileştirmesi sürecinden geçmiştir:
- **Next.js 16 & React 19:** En güncel React özellikleri ve Next.js App Router mimarisi kullanılmaktadır.
- **Tailwind CSS 4:** Modern ve performanslı stil yönetimi.
- **Zustand:** Karmaşık `useReducer` yapısından daha esnek ve performanslı bir state yönetimine geçilmiştir.
- **Modern Chat UI:** Framer Motion animasyonları ile modern ChatMessage ve ChatInput bileşenleri.
- **Kurumsal Güvenlik:** AES-256 şifreleme, RBAC, audit logging, GDPR compliance ve rate limiting.
- **Local-First:** Veriler öncelikle kullanıcı cihazında saklanır, bu da çevrimdışı çalışma ve hız avantajı sağlar.

## 6. Güvenlik Mimarisi

Uygulamaya kurumsal düzeyde güvenlik katmanları entegre edilmiştir:

### f. Güvenlik Katmanları
- **RBAC (Role-Based Access Control)** (`src/lib/security/rbac.ts`): 4 rol seviyesi (user, moderator, admin, super_admin) ile granüler izin kontroller.
- **Audit Logging** (`src/lib/security/audit-logger.ts`): Tüm önemli kullanıcı eylemlerinin kaydı, IP adresi ve zaman bilgisi ile birlikte.
- **Data Encryption** (`src/lib/security/encryption.ts`): AES-256-GCM algoritması kullanarak hassas verilerin şifrelenmesi.
- **Rate Limiting** (`src/lib/security/rate-limiter.ts`): API isteklerinin sınırlandırılması (auth: 5/15min, api: 100/15min, sensitive: 10/60min).
- **GDPR Compliance** (`src/lib/security/gdpr.ts`): Veri dışa aktarma, silme hakkı (30 günlük harita süresi), rıza yönetimi.
- **Security Middleware** (`src/lib/security/middleware.ts`): Auth, authorization, CORS, CSP headers ve input validation.

### g. Modern Chat Bileşenleri
- **ChatMessage** (`src/components/chat/chat-message.tsx`): Syntax highlighting, kullanıcı reaksiyonları, dosya önizleme, düşünme göstergesi.
- **ChatInput** (`src/components/chat/chat-input.tsx`): Ses kaydı, dosya ekleri, hızlı öneriler, model seçimi, otomatik genişleyen textarea.
- **ChatWindow** (`src/components/chat/chat-window.tsx`): ChatMessage ve ChatInput'u orkestreler, otomatik scroll, boş durum, yüklenme göstergesi.

### h. Veritabanı Güvenliği
- **Row-Level Security (RLS):** Tüm güvenlik tablolarında çok-kiracı güvenliği.
- **Şifrelenmiş Alanlar:** Hassas veriler (API anahtarları, kişisel bilgiler) şifrelenerek saklanır.
- **Audit Triggers:** Otomatik veri silme veya güncelleme tetikleyicileri.

## 7. Gelecek Vizyonu ve Geliştirme Potansiyeli

Bu proje, modüler ve genişletilebilir yapısıyla birçok geliştirme potansiyeli sunmaktadır:

- **Gelişmiş AI Ajanları:** Yapay zekanın sadece bir asistan olmakla kalmayıp, tuval düzenini içeriğe göre otomatik olarak optimize etmesi veya yeni içerik önermesi.
- **Daha Fazla Widget:** Hava durumu, borsa, haber akışı gibi yeni ve işlevsel widget'lar.
- **3D ve VR/AR Desteği:** `3d-scene` düzen modu geliştirilerek, üç boyutlu sahneler oluşturma ve bu sahnelerle sanal veya artırılmış gerçeklikte etkileşim kurma imkanı.
- **Dark Mode & Tema Sistemi:** next-themes ile koyu tema desteği ve özel tema oluşturucu.
- **Dokunma Hareketleri:** Canvas modunda pinch-zoom, swipe nav ve iki parmak pan hareketleri.
- **Klavye Kısayolları:** Ctrl/Cmd+K arama, Ctrl/Cmd+/ yardım, türü kısayol sistemi.
- **Veritabanı Senkronizasyonu:** Yerel verilerin isteğe bağlı olarak bulut servisleri ile senkronize edilmesi.
- **2FA/MFA:** İki faktörlü kimlik doğrulama seçeneği.
