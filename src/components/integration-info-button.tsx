"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Info, X, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type IntegrationInfoProps = {
  integrationName: string;
  description: string;
  setupSteps?: string[];
  documentationUrl?: string;
  features?: string[];
  requirements?: string[];
  children?: React.ReactNode;
};

export function IntegrationInfoButton({
  integrationName,
  description,
  setupSteps = [],
  documentationUrl,
  features = [],
  requirements = [],
  children
}: IntegrationInfoProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 transition-colors"
            title={`${integrationName} Bilgisi`}
          >
            <Info className="w-4 h-4" />
          </motion.button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            {integrationName} Entegrasyonu
          </DialogTitle>
          <DialogDescription className="text-slate-300 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Özellikler</h3>
              <ul className="space-y-1">
                {features.map((feature, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Gereksinimler</h3>
              <ul className="space-y-1">
                {requirements.map((req, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Setup Steps */}
          {setupSteps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Kurulum Adımları</h3>
              <ol className="space-y-2">
                {setupSteps.map((step, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Documentation Link */}
          {documentationUrl && (
            <div className="pt-4 border-t border-slate-700">
              <a
                href={documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Detaylı Dokümantasyon
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Philips Hue Integration Info
export function HueIntegrationInfo({ children }: { children?: React.ReactNode }) {
  return (
    <IntegrationInfoButton
      integrationName="Philips Hue"
      description="Philips Hue akıllı ışıklarınızı CanvasFlow ile kontrol edin. Işıklarınızı canvas öğelerinizle senkronize edin ve özel sahneler oluşturun."
      features={[
        'Birden fazla Hue Bridge desteği',
        'Gerçek zamanlı ışık kontrolü (açma/kapama, parlaklık, renk)',
        'Sahne oluşturma ve yönetimi',
        'Canvas öğeleri ile ışık senkronizasyonu',
        'Kişisel API - verileriniz güvenli',
        'Row-Level Security (RLS) ile veri izolasyonu'
      ]}
      requirements={[
        'Philips Hue Bridge (v2 veya üstü önerilir)',
        'Bridge ve bilgisayarınız aynı ağda olmalı',
        'Supabase hesabı (veritabanı için)',
        'Bridge IP adresi ve portu'
      ]}
      setupSteps={[
        'Hue Bridge\'inizi ağa bağlayın',
        'Bridge IP adresinizi öğrenin (Hue uygulamasından veya router ayarlarından)',
        'CanvasFlow Hue panelinde "Discover" butonuna tıklayın',
        'Bridge\'inizin üstündeki link butonuna basın (30 saniye içinde)',
        'CanvasFlow\'da "Link Bridge" butonuna tıklayın',
        'Işıklarınızı kontrol etmeye başlayın!'
      ]}
      documentationUrl="/docs/HUE_PERSONAL_API_SETUP.md"
    >
      {children}
    </IntegrationInfoButton>
  );
}

// Grid Mode Info
export function GridModeInfo({ children }: { children?: React.ReactNode }) {
  return (
    <IntegrationInfoButton
      integrationName="Izgara Modu"
      description="Canvas öğelerinizi sayfalandırılmış ızgara düzeninde görüntüleyin. İki farklı mod ile içeriklerinizi organize edin."
      features={[
        'Dikey Mod: Tek sütun, aşağı kaydırma',
        'Kare Izgara Modu: Çoklu sütun ve satır, sayfalama',
        '2-5 arası sütun seçenekleri',
        'Android-tarzı sayfa göstergesi',
        'Otomatik sayfa hesaplama',
        'Responsive tasarım'
      ]}
      requirements={[
        'Canvas içeriği (en az 1 öğe)',
        'Grid layout mode aktif'
      ]}
      setupSteps={[
        'Üst menüden Dikey veya Kare modu seçin',
        'Kare modda sütun sayısını ayarlayın (2-5)',
        'Sol/sağ okları veya sayfa noktalarını kullanarak gezinin',
        'Sütun sayısı değişince sayfalar otomatik güncellenir'
      ]}
    >
      {children}
    </IntegrationInfoButton>
  );
}
