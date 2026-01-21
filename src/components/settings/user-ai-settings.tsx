'use client';

/**
 * User AI Settings Component
 * Kullanıcının kendi AI provider'larını yönettiği bileşen
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Sparkles, Settings, Zap, DollarSign, Clock, 
  Check, AlertCircle, RefreshCw, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { apiVaultManager, API_PROVIDER_CONFIGS, ApiProvider } from '@/lib/api-vault';
import { 
  createApiClient, 
  OpenAIClient, 
  AnthropicClient, 
  GoogleAIClient 
} from '@/lib/api-vault/api-clients';
import { cn } from '@/lib/utils';

interface AIModel {
  id: string;
  name: string;
  provider: ApiProvider;
  contextLength: number;
  inputCost: number; // per 1M tokens
  outputCost: number;
  speed: 'fast' | 'medium' | 'slow';
  capabilities: string[];
}

const AI_MODELS: AIModel[] = [
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextLength: 128000, inputCost: 2.5, outputCost: 10, speed: 'fast', capabilities: ['chat', 'vision', 'function'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextLength: 128000, inputCost: 0.15, outputCost: 0.6, speed: 'fast', capabilities: ['chat', 'vision', 'function'] },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextLength: 128000, inputCost: 10, outputCost: 30, speed: 'medium', capabilities: ['chat', 'vision', 'function'] },
  { id: 'o1-preview', name: 'O1 Preview', provider: 'openai', contextLength: 128000, inputCost: 15, outputCost: 60, speed: 'slow', capabilities: ['reasoning'] },
  
  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextLength: 200000, inputCost: 3, outputCost: 15, speed: 'fast', capabilities: ['chat', 'vision', 'artifacts'] },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextLength: 200000, inputCost: 15, outputCost: 75, speed: 'medium', capabilities: ['chat', 'vision'] },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', contextLength: 200000, inputCost: 0.25, outputCost: 1.25, speed: 'fast', capabilities: ['chat'] },
  
  // Google
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google_ai', contextLength: 1000000, inputCost: 1.25, outputCost: 5, speed: 'medium', capabilities: ['chat', 'vision', 'audio'] },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google_ai', contextLength: 1000000, inputCost: 0.075, outputCost: 0.3, speed: 'fast', capabilities: ['chat', 'vision'] },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google_ai', contextLength: 1000000, inputCost: 0, outputCost: 0, speed: 'fast', capabilities: ['chat', 'vision', 'realtime'] },
];

const AI_PROVIDERS = ['openai', 'anthropic', 'google_ai', 'mistral', 'groq', 'together'] as const;

export function UserAISettings() {
  const { user, aiAgentConfig, updateAIAgentConfig } = useAppStore();
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<ApiProvider[]>([]);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number }>>({});

  // Check vault status and available providers
  useEffect(() => {
    if (!user) return;
    
    const checkProviders = async () => {
      try {
        const keys = await apiVaultManager.listApiKeys(user.id);
        const providers = keys
          .filter(k => k.isEnabled && AI_PROVIDERS.includes(k.provider as any))
          .map(k => k.provider as ApiProvider);
        setAvailableProviders(providers);
        setIsVaultUnlocked(apiVaultManager.isUnlocked(user.id));
      } catch {
        setIsVaultUnlocked(false);
      }
    };
    
    checkProviders();
  }, [user]);

  // Test provider connection
  const testProvider = async (provider: ApiProvider) => {
    if (!user) return;
    
    setIsLoading(true);
    const start = performance.now();
    
    try {
      let client;
      switch (provider) {
        case 'openai':
          client = await createApiClient<OpenAIClient>(user.id, 'openai');
          if (client) {
            await client.chat([{ role: 'user', content: 'Hi' }], 'gpt-4o-mini');
          }
          break;
        case 'anthropic':
          client = await createApiClient<AnthropicClient>(user.id, 'anthropic');
          if (client) {
            await client.chat([{ role: 'user', content: 'Hi' }], 'claude-3-haiku-20240307');
          }
          break;
        case 'google_ai':
          client = await createApiClient<GoogleAIClient>(user.id, 'google_ai');
          if (client) {
            await client.generateContent('Hi', 'gemini-1.5-flash');
          }
          break;
      }
      
      const latency = Math.round(performance.now() - start);
      setTestResults(prev => ({ ...prev, [provider]: { success: true, latency } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: { success: false } }));
    } finally {
      setIsLoading(false);
    }
  };

  // Get models for available providers
  const availableModels = AI_MODELS.filter(m => availableProviders.includes(m.provider));

  // Calculate estimated cost
  const calculateCost = (model: AIModel, inputTokens: number, outputTokens: number) => {
    return ((inputTokens / 1000000) * model.inputCost + (outputTokens / 1000000) * model.outputCost).toFixed(4);
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Giriş yapmanız gerekiyor
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Kişisel AI Ayarları</h2>
            <p className="text-sm text-muted-foreground">
              Kendi API anahtarlarınızla AI modellerini kullanın
            </p>
          </div>
        </div>
        
        <Badge variant={availableProviders.length > 0 ? 'default' : 'secondary'}>
          {availableProviders.length} sağlayıcı aktif
        </Badge>
      </div>

      {/* Vault Status */}
      {!isVaultUnlocked && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">API Kasası kilitli</p>
                <p className="text-sm text-muted-foreground">
                  AI sağlayıcılarını kullanmak için önce API Kasasını açın ve anahtarlarınızı ekleyin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Sağlayıcılar</TabsTrigger>
          <TabsTrigger value="models">Modeller</TabsTrigger>
          <TabsTrigger value="preferences">Tercihler</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {AI_PROVIDERS.map((provider) => {
              const config = API_PROVIDER_CONFIGS[provider];
              const isAvailable = availableProviders.includes(provider);
              const result = testResults[provider];
              
              return (
                <Card 
                  key={provider}
                  className={cn(
                    'transition-all',
                    isAvailable && 'border-green-500/20 bg-green-500/5'
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config?.icon}</span>
                        <CardTitle className="text-base">{config?.name}</CardTitle>
                      </div>
                      {isAvailable && (
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                          <Check className="mr-1 h-3 w-3" />
                          Aktif
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{config?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAvailable ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {result ? (
                            result.success ? (
                              <span className="text-green-500">
                                ✓ Bağlantı başarılı ({result.latency}ms)
                              </span>
                            ) : (
                              <span className="text-red-500">✗ Bağlantı hatası</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">Test edilmedi</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testProvider(provider)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test Et'
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        API Kasasından anahtar ekleyin
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          {availableModels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Henüz kullanılabilir model yok</p>
              <p className="text-sm">API Kasasına bir sağlayıcı anahtarı ekleyin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableModels.map((model) => {
                const providerConfig = API_PROVIDER_CONFIGS[model.provider];
                
                return (
                  <Card 
                    key={model.id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50',
                      selectedModel === model.id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{providerConfig?.icon}</span>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {(model.contextLength / 1000).toFixed(0)}K context
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Speed indicator */}
                          <div className="flex items-center gap-1 text-sm">
                            <Zap className={cn(
                              'h-4 w-4',
                              model.speed === 'fast' && 'text-green-500',
                              model.speed === 'medium' && 'text-yellow-500',
                              model.speed === 'slow' && 'text-orange-500'
                            )} />
                            <span className="capitalize">{model.speed}</span>
                          </div>
                          
                          {/* Cost */}
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>${model.inputCost}/${model.outputCost}</span>
                          </div>
                          
                          {/* Capabilities */}
                          <div className="flex gap-1">
                            {model.capabilities.slice(0, 3).map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Varsayılan Model</CardTitle>
              <CardDescription>
                Tüm AI özelliklerinde varsayılan olarak kullanılacak model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {API_PROVIDER_CONFIGS[model.provider]?.icon} {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Otomatik Model Seçimi</CardTitle>
              <CardDescription>
                Görev türüne göre en uygun modeli otomatik seç
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maliyete göre optimize et</Label>
                  <p className="text-sm text-muted-foreground">
                    Basit görevler için ucuz modeller kullan
                  </p>
                </div>
                <Switch
                  checked={aiAgentConfig.autoSelectByCost}
                  onCheckedChange={(checked) => 
                    updateAIAgentConfig({ autoSelectByCost: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Hıza göre optimize et</Label>
                  <p className="text-sm text-muted-foreground">
                    Hızlı yanıt gerektiren durumlarda hızlı modeller kullan
                  </p>
                </div>
                <Switch
                  checked={aiAgentConfig.autoSelectBySpeed}
                  onCheckedChange={(checked) => 
                    updateAIAgentConfig({ autoSelectBySpeed: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Yeteneğe göre optimize et</Label>
                  <p className="text-sm text-muted-foreground">
                    Görsel analiz için vision destekli modeller kullan
                  </p>
                </div>
                <Switch
                  checked={aiAgentConfig.autoSelectByCapability}
                  onCheckedChange={(checked) => 
                    updateAIAgentConfig({ autoSelectByCapability: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maliyet Tahmini</CardTitle>
              <CardDescription>
                Seçili model için tahmini maliyet hesaplayıcı
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedModel && (() => {
                const model = AI_MODELS.find(m => m.id === selectedModel);
                if (!model) return null;
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">1000 mesaj (kısa)</span>
                        <div className="font-medium">${calculateCost(model, 500000, 500000)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">1000 mesaj (uzun)</span>
                        <div className="font-medium">${calculateCost(model, 2000000, 2000000)}</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Maliyet Detayları</span>
                      </div>
                      <div className="text-muted-foreground">
                        Giriş: ${model.inputCost}/M token • Çıkış: ${model.outputCost}/M token
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
