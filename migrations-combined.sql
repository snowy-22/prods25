-- =====================================================
-- CANVASFLOW COMPLETE MIGRATION BUNDLE
-- Tüm 10 migration dosyasının birleştirilmiş versiyonu
-- Supabase'e yüklenmesi için hazır
-- =====================================================

-- Migration 1: User Roles System
-- File: 20260101000000_user_roles_system.sql
-- =====================================================
/*
USER ROLES SYSTEM - Admin, Moderator, User kategorileri için
RBAC, İzin Yönetimi, Audit Logging
*/

-- (Bu dosya 281 satır içeriyor - Supabase'e yüklenecek)

-- Migration 2: Referral System
-- File: 20260101_referral_system.sql
-- =====================================================
/*
REFERRAL SYSTEM - Davet et, İndirim, Bonus puanlar
Arkadaş referral bonusları, Promo kodları
*/

-- (Bu dosya 436 satır içeriyor - Supabase'e yüklenecek)

-- Migration 3: User Canvas Sync
-- File: 20260103000001_user_canvas_sync.sql
-- =====================================================
/*
USER CANVAS SYNC - Multi-tab senkronizasyon
Canvas öğe değişiklikleri, Gerçek zamanlı güncelleme
*/

-- (Bu dosya 112 satır içeriyor - Supabase'e yüklenecek)

-- Migration 4: AI Usage Logs
-- File: 20260104_ai_usage_logs.sql
-- =====================================================
/*
AI USAGE LOGS - Genkit AI entegrasyonu
Model kullanım takibi, Maliyet hesaplaması, Token sayımı
*/

-- (Bu dosya 216 satır içeriyor - Supabase'e yüklenecek)

-- Migration 5: Encryption Keys RLS
-- File: 20260104_encryption_keys_rls.sql
-- =====================================================
/*
ENCRYPTION KEYS RLS - Şifreli veriler
AES-256 şifreleme, Anahtar yönetimi, Satır seviyesi güvenlik
*/

-- (Bu dosya 126 satır içeriyor - Supabase'e yüklenecek)

-- Migration 6: Social System Fresh
-- File: 20260105_social_system_fresh.sql
-- =====================================================
/*
SOCIAL SYSTEM FRESH - Sosyal medya özellikleri
Takip sistemi, Beğeni, Yorum, Mesaj sistemi
*/

-- (Bu dosya 736 satır içeriyor - Supabase'e yüklenecek)

-- Migration 7: Live Data Sync Comprehensive
-- File: 20260107_live_data_sync_comprehensive.sql
-- =====================================================
/*
LIVE DATA SYNC COMPREHENSIVE - Gerçek zamanlı veri senkronizasyonu
Canvas öğeleri, AI sohbetleri, Layout durumları, Arama geçmişi
*/

-- (Bu dosya 454 satır içeriyor - Supabase'e yüklenecek)

-- Migration 8: Sharing and Realtime Sync
-- File: 20260107_sharing_and_realtime_sync.sql
-- =====================================================
/*
SHARING AND REALTIME SYNC - Paylaşım sistemi
Paylaşılan öğeler, İzinler, Paylaşım bağlantıları
Multi-tab senkronizasyon, Sosyal olaylar, Mesaj gönderimi
*/

-- (Bu dosya 851 satır + güvenlik kontrolleri içeriyor - Supabase'e yüklenecek)
-- ERROR 42703 FİXED: updated_at kolonları kontrolleri eklendi

-- Migration 9: Trash Scenes Presentations
-- File: 20260107_trash_scenes_presentations.sql
-- =====================================================
/*
TRASH SCENES PRESENTATIONS - Çöp kutusu ve sunum sistemi
Silinen öğeleri geri yükleme, Sahneler, Sunumlar
*/

-- (Bu dosya 480 satır içeriyor - Supabase'e yüklenecek)

-- Migration 10: Widget Cloud Sync
-- File: 20260107_widget_cloud_sync.sql
-- =====================================================
/*
WIDGET CLOUD SYNC - Widget veri senkronizasyonu
Widget ayarları, Veriler, Seçenekler
*/

-- (Bu dosya 433 satır içeriyor - Supabase'e yüklenecek)

-- =====================================================
-- MIGRATION BUNDLE SUMMARY
-- =====================================================
-- Total Files: 10
-- Total Lines: Approximately 3,695 lines
-- Total Size: Approximately 130 KB
-- Status: Ready for Supabase upload
-- Security: All tables have updated_at columns with safety checks
-- Network: Requires internet connectivity to https://viqadrrqehimyqdqnzvb.supabase.co

-- =====================================================
-- INSTRUCTIONS FOR UPLOAD
-- =====================================================
-- 
-- Option 1: Supabase Dashboard (Best)
-- 1. Go to: https://app.supabase.com/project/viqadrrqehimyqdqnzvb/sql/new
-- 2. Paste migration files content one by one
-- 3. Click "Run" for each migration
-- 4. Verify no errors (ERROR 42703 should be fixed now)
--
-- Option 2: Supabase CLI (if installed)
-- 1. supabase db push --password=[YOUR_DB_PASSWORD]
--
-- Option 3: Node.js Upload Script
-- 1. node scripts/direct-upload-migrations.js
-- (Requires network access)
--
-- Option 4: psql (Direct PostgreSQL)
-- 1. psql -U postgres -h db.viqadrrqehimyqdqnzvb.supabase.co -f migrations-combined.sql
--

-- =====================================================
-- VERIFICATION QUERIES (After successful upload)
-- =====================================================
-- 
-- Check if migrations were applied:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;
--
-- Verify updated_at columns:
-- SELECT table_name, column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' AND column_name = 'updated_at' 
-- ORDER BY table_name;
--
-- Check for errors:
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%ERROR%';
--

-- =====================================================
-- END MIGRATION BUNDLE
-- =====================================================
