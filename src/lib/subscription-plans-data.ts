/**
 * Subscription Plans - Detaylı Özellik Grupları
 * Temel, Plus, Pro ve Kurumsal paketler için tüm özellikler
 */

import { SubscriptionPlan } from './subscription-types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Temel',
    displayName: 'Temel Plan',
    tier: 'free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: ['Temel canvas özellikleri', 'Sınırlı AI kullanımı', 'Topluluk desteği'],
    featureGroups: [
      {
        name: 'Canvas & Workspace',
        features: [
          { name: 'Sınırsız Canvas Oluşturma', included: true },
          { name: 'Canvas Öğe Limiti', included: true, limit: '50 öğe/canvas' },
          { name: 'Grid & Canvas Modu', included: true },
          { name: 'Temel Widget Kitaplığı', included: true, limit: '10 widget' },
          { name: 'Gelişmiş Widget Kitaplığı', included: false },
        ]
      },
      {
        name: 'Medya & Oynatıcılar',
        features: [
          { name: 'YouTube Oynatıcı', included: true },
          { name: 'Video/Audio Oynatıcı', included: true },
          { name: 'Görsel Yönetimi', included: true },
          { name: 'PDF Görüntüleyici', included: true },
          { name: 'Philips Hue Entegrasyonu', included: false },
          { name: 'Recording Studio', included: false },
        ]
      },
      {
        name: 'AI Özellikleri',
        features: [
          { name: 'AI Chat Asistanı', included: true, limit: '50 mesaj/ay' },
          { name: 'AI Görsel Analizi', included: false },
          { name: 'AI İçerik Önerileri', included: false },
          { name: 'Gelişmiş AI Modelleri', included: false },
        ]
      },
      {
        name: 'İşbirliği & Paylaşım',
        features: [
          { name: 'Canvas Paylaşımı', included: true, limit: 'Sadece görüntüleme' },
          { name: 'Gerçek Zamanlı İşbirliği', included: false },
          { name: 'Yorum & Geri Bildirim', included: false },
          { name: 'Sürüm Kontrolü', included: false },
        ]
      },
      {
        name: 'Depolama & Senkronizasyon',
        features: [
          { name: 'Bulut Depolama', included: true, limit: '1 GB' },
          { name: 'Otomatik Yedekleme', included: true },
          { name: 'Çoklu Cihaz Senkronizasyonu', included: true },
          { name: 'Gelişmiş Sürüm Yönetimi', included: false },
        ]
      },
    ],
    limits: {
      maxProjects: 5,
      maxStorage: 1000, // 1 GB
      maxCollaborators: 0,
      maxCanvasItems: 50,
      maxAIRequests: 50,
      maxWidgets: 10,
    },
  },
  {
    id: 'basic',
    name: 'Plus',
    displayName: 'Plus Plan',
    tier: 'basic',
    price: 999, // $9.99/ay
    currency: 'USD',
    interval: 'month',
    popular: true,
    features: ['Tüm Temel özellikler', 'Gelişmiş AI', 'Öncelikli destek', 'Gelişmiş widget\'lar'],
    featureGroups: [
      {
        name: 'Canvas & Workspace',
        features: [
          { name: 'Sınırsız Canvas Oluşturma', included: true },
          { name: 'Canvas Öğe Limiti', included: true, limit: '200 öğe/canvas' },
          { name: 'Grid & Canvas Modu', included: true },
          { name: 'Temel Widget Kitaplığı', included: true, limit: 'Sınırsız' },
          { name: 'Gelişmiş Widget Kitaplığı', included: true, limit: '50 widget' },
        ]
      },
      {
        name: 'Medya & Oynatıcılar',
        features: [
          { name: 'YouTube Oynatıcı', included: true },
          { name: 'Video/Audio Oynatıcı', included: true },
          { name: 'Görsel Yönetimi', included: true },
          { name: 'PDF Görüntüleyici', included: true },
          { name: 'Philips Hue Entegrasyonu', included: true },
          { name: 'Recording Studio', included: true, limit: 'Temel özellikler' },
        ]
      },
      {
        name: 'AI Özellikleri',
        features: [
          { name: 'AI Chat Asistanı', included: true, limit: '500 mesaj/ay' },
          { name: 'AI Görsel Analizi', included: true, limit: '100 görsel/ay' },
          { name: 'AI İçerik Önerileri', included: true },
          { name: 'Gelişmiş AI Modelleri', included: false },
        ]
      },
      {
        name: 'İşbirliği & Paylaşım',
        features: [
          { name: 'Canvas Paylaşımı', included: true, limit: 'Düzenleme izni' },
          { name: 'Gerçek Zamanlı İşbirliği', included: true, limit: '3 kişi' },
          { name: 'Yorum & Geri Bildirim', included: true },
          { name: 'Sürüm Kontrolü', included: true, limit: '30 gün geçmiş' },
        ]
      },
      {
        name: 'Depolama & Senkronizasyon',
        features: [
          { name: 'Bulut Depolama', included: true, limit: '10 GB' },
          { name: 'Otomatik Yedekleme', included: true },
          { name: 'Çoklu Cihaz Senkronizasyonu', included: true },
          { name: 'Gelişmiş Sürüm Yönetimi', included: true },
        ]
      },
    ],
    limits: {
      maxProjects: 25,
      maxStorage: 10000, // 10 GB
      maxCollaborators: 3,
      maxCanvasItems: 200,
      maxAIRequests: 500,
      maxWidgets: 50,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    displayName: 'Pro Plan',
    tier: 'pro',
    price: 2999, // $29.99/ay
    currency: 'USD',
    interval: 'month',
    features: ['Tüm Plus özellikler', 'Sınırsız AI', 'API erişimi', 'Premium destek'],
    featureGroups: [
      {
        name: 'Canvas & Workspace',
        features: [
          { name: 'Sınırsız Canvas Oluşturma', included: true },
          { name: 'Canvas Öğe Limiti', included: true, limit: 'Sınırsız' },
          { name: 'Grid & Canvas Modu', included: true },
          { name: 'Temel Widget Kitaplığı', included: true, limit: 'Sınırsız' },
          { name: 'Gelişmiş Widget Kitaplığı', included: true, limit: 'Sınırsız' },
        ]
      },
      {
        name: 'Medya & Oynatıcılar',
        features: [
          { name: 'YouTube Oynatıcı', included: true },
          { name: 'Video/Audio Oynatıcı', included: true },
          { name: 'Görsel Yönetimi', included: true },
          { name: 'PDF Görüntüleyici', included: true },
          { name: 'Philips Hue Entegrasyonu', included: true },
          { name: 'Recording Studio', included: true, limit: 'Tüm özellikler' },
        ]
      },
      {
        name: 'AI Özellikleri',
        features: [
          { name: 'AI Chat Asistanı', included: true, limit: 'Sınırsız' },
          { name: 'AI Görsel Analizi', included: true, limit: 'Sınırsız' },
          { name: 'AI İçerik Önerileri', included: true },
          { name: 'Gelişmiş AI Modelleri', included: true, description: 'GPT-4, Claude, Gemini' },
        ]
      },
      {
        name: 'İşbirliği & Paylaşım',
        features: [
          { name: 'Canvas Paylaşımı', included: true, limit: 'Tam yetki' },
          { name: 'Gerçek Zamanlı İşbirliği', included: true, limit: 'Sınırsız' },
          { name: 'Yorum & Geri Bildirim', included: true },
          { name: 'Sürüm Kontrolü', included: true, limit: 'Sınırsız geçmiş' },
        ]
      },
      {
        name: 'Depolama & Senkronizasyon',
        features: [
          { name: 'Bulut Depolama', included: true, limit: '100 GB' },
          { name: 'Otomatik Yedekleme', included: true },
          { name: 'Çoklu Cihaz Senkronizasyonu', included: true },
          { name: 'Gelişmiş Sürüm Yönetimi', included: true },
        ]
      },
      {
        name: 'Gelişmiş Özellikler',
        features: [
          { name: 'API Erişimi', included: true, limit: '10,000 istek/ay' },
          { name: 'Webhook Entegrasyonları', included: true },
          { name: 'Özel Entegrasyonlar', included: true },
          { name: 'Premium Destek (24/7)', included: true },
          { name: 'SLA Garantisi', included: true },
        ]
      },
    ],
    limits: {
      maxProjects: -1, // sınırsız
      maxStorage: 100000, // 100 GB
      maxCollaborators: -1, // sınırsız
      maxCanvasItems: -1, // sınırsız
      maxAIRequests: -1, // sınırsız
      maxWidgets: -1, // sınırsız
      maxAPIRequests: 10000,
    },
  },
  {
    id: 'enterprise',
    name: 'Kurumsal',
    displayName: 'Kurumsal Plan',
    tier: 'enterprise',
    price: 9999, // $99.99/ay (özel fiyatlandırma)
    currency: 'USD',
    interval: 'month',
    features: ['Tüm Pro özellikler', 'Özel SLA', 'Özel entegrasyonlar', 'Dedicated support'],
    featureGroups: [
      {
        name: 'Kurumsal Özellikler',
        features: [
          { name: 'Tüm Pro Özellikleri', included: true },
          { name: 'Özel Domain & Branding', included: true },
          { name: 'SSO/SAML Entegrasyonu', included: true },
          { name: 'Gelişmiş Güvenlik & Uyumluluk', included: true },
          { name: 'Özel SLA (99.9% uptime)', included: true },
          { name: 'Dedicated Account Manager', included: true },
          { name: 'On-premise Deployment Seçeneği', included: true },
          { name: 'Öncelikli Özellik İstekleri', included: true },
        ]
      },
    ],
    limits: {
      maxProjects: -1,
      maxStorage: -1,
      maxCollaborators: -1,
      maxCanvasItems: -1,
      maxAIRequests: -1,
      maxWidgets: -1,
      maxAPIRequests: -1,
    },
  },
];
