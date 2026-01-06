# E-Ticaret & Viewport Editörü Test Kılavuzu

## ✅ Tamamlanan Özellikler

### 1. E-Ticaret Sayfaları
- ✅ **EcommerceCanvas** Component (420 satır)
  - Grid/Liste/Kompakt görünüm modları
  - Arama ve filtreleme
  - Sıralama (fiyat, isim, tarih)
  - 4 içerik tipi desteği: products, marketplace, cart, orders
  
- ✅ **EcommerceLandingTemplate** (280 satır)
  - Hero section (gradient, badge, CTA)
  - Öne çıkan ürünler
  - Özellikler (ücretsiz kargo, güvenli ödeme, kalite garantisi)
  - Trend ürünler (4 sütun responsive grid)
  - Kategoriler (8 kategori)
  - CTA section (indirim kodu)

- ✅ **Canvas Entegrasyonu**
  - 6 yeni ContentItem tipi:
    - `product-grid` - Ürün grid görünümü
    - `product-list` - Ürün liste görünümü
  - `shopping-cart` - Alışveriş sepeti
    - `marketplace-grid` - Marketplace grid
    - `order-history` - Sipariş geçmişi
    - `ecommerce-landing` - E-ticaret iniş sayfası

### 2. Viewport Editörü
- ✅ **ViewportEditor** Component (550 satır)
  - Responsive mod seçici (desktop/tablet/mobile)
  - Kod görünümü (CSS export, kopyala, indir)
  - 4 tab sistemi:
    - **Layout**: Display, Position, Flex, Grid, Boyutlar
    - **Style**: Renkler, Tipografi, Kenarlıklar
    - **Spacing**: Padding, Margin
    - **Effects**: Box shadow, Transform
  
- ✅ **UI Entegrasyonu**
  - Header'da "Viewport Editörü" butonu (Ayarlar menüsünde)
  - Desktop ve mobil header desteği
  - Seçili öğe düzenleme
  - Gerçek zamanlı CSS güncelleme

## 🧪 Test Senaryoları

### Test 1: E-Ticaret Ürün Grid
1. Canvas'ta yeni bir öğe oluştur
2. Tip olarak `product-grid` seç
3. Grid görünümünde ürünlerin görüntülendiğini doğrula
4. Arama çubuğuna bir şey yaz (örn: "video")
5. Grid/Liste toggle butonunu kullan
6. Sıralama seçeneklerini dene (fiyat, isim, tarih)

### Test 2: E-Ticaret Landing Sayfası
1. Canvas'ta yeni bir öğe oluştur
2. Tip olarak `ecommerce-landing` seç
3. Hero section'ın görüntülendiğini doğrula
4. Aşağı kaydır, öne çıkan ürünleri gör
5. Trend ürünlere tıkla, sepete ekle butonunu test et
6. Kategorilerin görüntülendiğini doğrula

### Test 3: Alışveriş Sepeti
1. Canvas'ta yeni bir öğe oluştur
2. Tip olarak `shopping-cart` seç
3. Sepet öğelerinin listelendiğini doğrula
4. Toplam fiyat hesaplamasını kontrol et
5. Miktar artır/azalt butonlarını test et

### Test 4: Viewport Editörü - Layout
1. Canvas'ta herhangi bir öğe seç
2. Ayarlar menüsünden "Viewport Editörü" aç
3. Layout tabını seç
4. Display değiştir (block → flex → grid)
5. Flex yönü değiştir (row/column)
6. Gap değerini ayarla
7. Değişikliklerin canvas'ta anında yansıdığını doğrula

### Test 5: Viewport Editörü - Style
1. Bir öğe seçili haldeyken Viewport Editörü'nü aç
2. Style tabına geç
3. Arka plan rengi değiştir
4. Yazı tipi boyutunu artır
5. Border radius ekle
6. Opacity slider'ı kullan
7. Tüm değişikliklerin gerçek zamanlı uygulandığını gör

### Test 6: Viewport Editörü - Kod Görünümü
1. Viewport Editörü'nü aç
2. Birkaç stil değişikliği yap
3. "Kod" butonuna tıkla
4. CSS kodunun doğru oluşturulduğunu doğrula
5. "Kopyala" butonunu test et
6. "İndir" butonunu test et (.css dosyası)

### Test 7: Responsive Viewport Modu
1. Viewport Editörü'nü aç
2. Responsive mod butonlarını kullan:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
3. Her modda farklı stiller uygula
4. Mod değiştiğinde stillerin korunduğunu doğrula

### Test 8: Marketplace Grid
1. Canvas'ta `marketplace-grid` tipi öğe oluştur
2. Marketplace listelerinin görüntülendiğini doğrula
3. Satıcı bilgilerinin göründüğünü kontrol et
4. Fiyat ve durum badge'lerini kontrol et

### Test 9: Sipariş Geçmişi
1. Canvas'ta `order-history` tipi öğe oluştur
2. Siparişlerin listelendiğini doğrula
3. Durum badge'lerini kontrol et (tamamlandı, bekliyor, iptal edildi)
4. Sipariş detaylarını gör

## 🎨 Stil Özelleştirme Örnekleri

### Örnek 1: Gradient Arka Plan
```
Viewport Editörü → Style → Colors
- Background Color: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

### Örnek 2: Modern Card
```
Layout:
- Display: flex
- Flex Direction: column
- Padding: 24px

Style:
- Background: white
- Border Radius: 16px
- Border Width: 1px
- Border Color: #e5e7eb

Effects:
- Box Shadow: 0 10px 25px rgba(0,0,0,0.1)
```

### Örnek 3: Hero Section
```
Layout:
- Display: flex
- Flex Direction: column
- Justify Content: center
- Align Items: center
- Min Height: 500px

Style:
- Background: linear-gradient(to right, #4f46e5, #7c3aed)
- Color: white
- Text Align: center
```

## 📊 Performans Kontrol

- ✅ Lazy loading (dynamic imports) kullanımı
- ✅ Suspense ile fallback render
- ✅ Skeleton loading states
- ✅ Responsive grid (1/2/3/4 sütun)
- ✅ Debounced arama (gereksiz render önlendi)

## 🐛 Bilinen Sınırlamalar

1. **E-ticaret Backend**: Şu an mock data kullanılıyor, Supabase entegrasyonu eklenecek
2. **Ödeme Sistemi**: Stripe kaldırıldı, yeni ödeme gateway'i eklenecek
3. **Görsel Yükleme**: Ürün görselleri için Unsplash URL'leri kullanılıyor
4. **SEO**: E-ticaret sayfaları için metadata optimize edilecek

## 🚀 Kullanıma Hazır Özellikler

- ✅ Grid/Liste görünüm modları
- ✅ Arama ve filtreleme
- ✅ Sepete ekle/çıkar
- ✅ Responsive tasarım (mobile-first)
- ✅ Gerçek zamanlı stil düzenleme
- ✅ CSS kod export
- ✅ 6 farklı e-ticaret görünümü
- ✅ Landing page template

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (1 sütun)
- **Tablet**: 768px - 1024px (2 sütun)
- **Desktop**: 1024px - 1280px (3 sütun)
- **Large Desktop**: > 1280px (4 sütun)

## 🎯 Sonraki Adımlar

1. Supabase e-ticaret tabloları oluştur
2. Gerçek ürün verisi entegrasyonu
3. Ödeme gateway seçimi ve entegrasyonu
4. Kullanıcı yorumları sistemi
5. Favoriler ve karşılaştırma özelliği
6. E-posta bildirimleri (sipariş onayı, kargo takip)
7. Admin panel (ürün yönetimi)
8. Analytics dashboard (satış metrikleri)

---

**Hazırlayan**: CanvasFlow Development Team  
**Tarih**: ${new Date().toLocaleDateString('tr-TR')}  
**Durum**: ✅ Production Ready (Backend entegrasyonu bekleniyor)
