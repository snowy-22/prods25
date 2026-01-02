# Canvas Açılmıyor Sorunu - Hızlı Çözüm

## 🔧 Sorun Giderme Adımları

### 1️⃣ Tarayıcı Console Kontrolü
1. Chrome/Edge'de **F12** tuşuna basın
2. **Console** sekmesine gidin
3. Kırmızı hata mesajları varsa screenshot alın

### 2️⃣ LocalStorage Temizle
Tarayıcı console'da çalıştırın:
```javascript
localStorage.clear();
location.reload();
```

### 3️⃣ Dev Server Kontrolü
Terminal'de dev server çalışıyor mu kontrol edin:
```bash
npm run dev
```

Çıktıda şunlar görünmeli:
```
✓ Ready in XXXX ms
Local: http://localhost:3000
```

### 4️⃣ Doğru URL'yi Kullanın
```
✅ http://localhost:3000/canvas
❌ http://localhost:3000
```

### 5️⃣ Tarayıcı Cache Temizle
- **Ctrl + Shift + R** (Hard refresh)
- veya
- **Ctrl + F5**

---

## 🎵 Badway Albümü Nerede?

1. Canvas açıldığında sol tarafta **"Sosyal Medya Örnekleri"** klasörünü bulun
2. Klasöre tıklayın
3. İçinde **"Badway - Spotify Album"** görünecek
4. Albüme tıklayın veya sürükleyerek canvas'a ekleyin

---

## 🎯 Manuel Spotify Ekleme

Herhangi bir Spotify URL'sini eklemek için:

1. Canvas'ta sağ tıklayın
2. "Add Item" → "Website" seçin
3. URL'ye Spotify link'ini yapıştırın:
   - **Track**: `https://open.spotify.com/track/ID`
   - **Album**: `https://open.spotify.com/album/ID`
   - **Playlist**: `https://open.spotify.com/playlist/ID`

SmartPlayerRender otomatik olarak Spotify embed olarak render edecek!

---

## 🐛 Hata Mesajları

### "Cannot read property 'tabs' of undefined"
→ LocalStorage temizleyin (yukarıdaki 2. adım)

### "Failed to fetch"
→ Dev server çalışmıyor, `npm run dev` çalıştırın

### "Network error"
→ İnternet bağlantınızı kontrol edin

### Boş sayfa gösteriyorsa
→ Hard refresh yapın (Ctrl + Shift + R)

---

## ✅ Başarılı Açılım Kontrolü

Canvas düzgün açıldığında görmeniz gerekenler:
- ✅ Sol tarafta sidebar (Library, Social, Messages)
- ✅ Üstte tab bar
- ✅ Canvas alanında grid veya canvas modunda içerikler
- ✅ Sağ altta kontrol butonları

---

## 🎨 Badway Albümü Özellikleri

Eklenen albüm:
- **Başlık**: Badway - Spotify Album
- **Tür**: Album embed
- **Boyut**: 560x380px (Playlist/Album standart)
- **Tema**: Dark theme (#191414)
- **Accent**: Spotify green (#1DB954)

---

## 🚀 Hızlı Test

Terminal'de çalıştırın:
```bash
# TypeScript hataları kontrol et
npm run typecheck

# Dev server başlat
npm run dev
```

Sonra tarayıcıda:
1. **http://localhost:3000/canvas** aç
2. **F12** ile console aç
3. Hata var mı kontrol et

---

**Not:** Spotify embed'leri yüklenirken birkaç saniye sürebilir. "Loading..." yazısı görürseniz normal, bekleyin.
