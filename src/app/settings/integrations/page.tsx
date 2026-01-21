'use client';

/**
 * Integrations Settings Page
 * API Vault, Smart Home, YouTube ve AI entegrasyonları yönetim sayfası
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Home, Youtube, Brain, Settings, Key, 
  ChevronRight, Lock, Unlock, Plus, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiVaultManager } from '@/components/settings/api-vault-manager';
import { UserAISettings } from '@/components/settings/user-ai-settings';
import { SmartHomePanel } from '@/components/smart-home/smart-home-panel';
import { YouTubeAnalyticsPanel } from '@/components/youtube/youtube-analytics-panel';
import { PersonalAIChat } from '@/components/ai/personal-ai-chat';
import { useApiVault } from '@/lib/api-vault/hooks';
import { cn } from '@/lib/utils';

export default function IntegrationsPage() {
  const { isUnlocked, keys, stats } = useApiVault();
  const [activeTab, setActiveTab] = useState('vault');

  // Count keys by category
  const smartHomeKeys = keys.filter(k => 
    ['philips_hue', 'smartthings', 'home_assistant', 'tuya', 'lifx'].includes(k.provider)
  ).length;
  
  const aiKeys = keys.filter(k =>
    ['openai', 'anthropic', 'google_ai', 'mistral', 'groq', 'together', 'replicate', 'huggingface', 'cohere', 'perplexity'].includes(k.provider)
  ).length;
  
  const mediaKeys = keys.filter(k =>
    ['youtube_data', 'youtube_analytics', 'twitch', 'vimeo', 'spotify', 'soundcloud'].includes(k.provider)
  ).length;

  const integrationCategories = [
    {
      id: 'vault',
      name: 'API Kasası',
      description: 'Tüm API anahtarlarınızı güvenle yönetin',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      count: stats?.totalKeys || 0
    },
    {
      id: 'smart-home',
      name: 'Akıllı Ev',
      description: 'Philips Hue, SmartThings, Home Assistant',
      icon: Home,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      count: smartHomeKeys
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Kanal analizleri ve içerik yönetimi',
      icon: Youtube,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      count: mediaKeys
    },
    {
      id: 'ai',
      name: 'Yapay Zeka',
      description: 'OpenAI, Anthropic, Google AI ve daha fazlası',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      count: aiKeys
    },
    {
      id: 'ai-settings',
      name: 'AI Ayarları',
      description: 'Model tercihleri ve yapılandırma',
      icon: Settings,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      count: null
    }
  ];

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Entegrasyonlar</h1>
        <p className="text-muted-foreground">
          API anahtarlarınızı yönetin ve üçüncü parti servisleri entegre edin
        </p>
      </div>

      {/* Vault Status */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isUnlocked ? 'bg-green-500/10' : 'bg-muted'
              )}>
                {isUnlocked ? (
                  <Unlock className="h-6 w-6 text-green-500" />
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {isUnlocked ? 'Kasa Açık' : 'Kasa Kilitli'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isUnlocked 
                    ? `${stats?.totalKeys || 0} API anahtarı yönetiliyor`
                    : 'Erişim için kasanızı açın'
                  }
                </p>
              </div>
            </div>
            
            {isUnlocked && stats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg">{stats.totalKeys}</div>
                  <div className="text-muted-foreground">Toplam</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-500">{stats.enabledKeys}</div>
                  <div className="text-muted-foreground">Aktif</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{stats.providerBreakdown?.length || 0}</div>
                  <div className="text-muted-foreground">Sağlayıcı</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {integrationCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      activeTab === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      activeTab === category.id
                        ? 'bg-primary-foreground/10'
                        : category.bgColor
                    )}>
                      <category.icon className={cn(
                        'h-5 w-5',
                        activeTab === category.id
                          ? 'text-primary-foreground'
                          : category.color
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className={cn(
                        'text-xs truncate',
                        activeTab === category.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}>
                        {category.description}
                      </div>
                    </div>
                    {category.count !== null && category.count > 0 && (
                      <Badge 
                        variant={activeTab === category.id ? 'secondary' : 'outline'}
                        className="ml-auto"
                      >
                        {category.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hızlı Erişim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setActiveTab('vault')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Yeni API Ekle
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setActiveTab('ai')}
              >
                <Brain className="mr-2 h-4 w-4" />
                AI Sohbet
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setActiveTab('smart-home')}
              >
                <Zap className="mr-2 h-4 w-4" />
                Cihazları Kontrol Et
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="col-span-9">
          <Card className="min-h-[600px]">
            <CardContent className="p-6">
              {activeTab === 'vault' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ApiVaultManager />
                </motion.div>
              )}
              
              {activeTab === 'smart-home' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SmartHomePanel />
                </motion.div>
              )}
              
              {activeTab === 'youtube' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <YouTubeAnalyticsPanel />
                </motion.div>
              )}
              
              {activeTab === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PersonalAIChat />
                </motion.div>
              )}
              
              {activeTab === 'ai-settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserAISettings />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
