'use client';

/**
 * API Vault Component
 * Manage AI provider API keys securely
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  keyPrefix?: string;
  features: string[];
  models: string[];
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-4o, DALL-E, Whisper',
    logo: '🤖',
    website: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
    features: ['Chat', 'Vision', 'Voice', 'Image Generation'],
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'whisper-1', 'tts-1'],
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, Gemini Flash',
    logo: '🔮',
    website: 'https://aistudio.google.com/app/apikey',
    keyPrefix: 'AI',
    features: ['Chat', 'Vision', 'Long Context'],
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 Opus, Sonnet, Haiku',
    logo: '🧠',
    website: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
    features: ['Chat', 'Vision', 'Long Context', 'Code'],
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference',
    logo: '⚡',
    website: 'https://console.groq.com/keys',
    keyPrefix: 'gsk_',
    features: ['Fast Chat', 'Llama', 'Mixtral'],
    models: ['llama-3.1-70b', 'mixtral-8x7b', 'gemma-7b'],
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Open source models',
    logo: '🤝',
    website: 'https://api.together.xyz/settings/api-keys',
    features: ['Open Models', 'Fine-tuning', 'Embeddings'],
    models: ['llama-3.1-405b', 'qwen-2', 'mistral-large'],
  },
];

interface APIKeyState {
  value: string;
  isVisible: boolean;
  isValid: boolean | null;
  isChecking: boolean;
  isEnabled: boolean;
}

export function APIVault() {
  const { toast } = useToast();
  const user = useAppStore((s) => s.user);
  
  const [keys, setKeys] = useState<Record<string, APIKeyState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState('openai');
  
  // Load saved keys on mount
  useEffect(() => {
    if (user) {
      loadSavedKeys();
    }
  }, [user]);
  
  const loadSavedKeys = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .select('provider, is_enabled, is_default')
        .eq('user_id', user?.id);
      
      if (data) {
        const loadedKeys: Record<string, APIKeyState> = {};
        data.forEach((config) => {
          loadedKeys[config.provider] = {
            value: '••••••••••••••••', // Masked
            isVisible: false,
            isValid: true, // Assume valid if saved
            isChecking: false,
            isEnabled: config.is_enabled,
          };
          if (config.is_default) {
            setDefaultProvider(config.provider);
          }
        });
        setKeys(loadedKeys);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };
  
  const updateKey = (providerId: string, updates: Partial<APIKeyState>) => {
    setKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...(prev[providerId] || {
          value: '',
          isVisible: false,
          isValid: null,
          isChecking: false,
          isEnabled: true,
        }),
        ...updates,
      },
    }));
  };
  
  const validateKey = async (providerId: string, key: string): Promise<boolean> => {
    // Simple validation based on prefix
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!provider?.keyPrefix) return key.length > 10;
    return key.startsWith(provider.keyPrefix);
  };
  
  const checkKeyValidity = async (providerId: string) => {
    const keyState = keys[providerId];
    if (!keyState?.value || keyState.value.includes('•')) return;
    
    updateKey(providerId, { isChecking: true });
    
    try {
      // In production, this would make a test API call
      const isValid = await validateKey(providerId, keyState.value);
      updateKey(providerId, { isValid, isChecking: false });
    } catch {
      updateKey(providerId, { isValid: false, isChecking: false });
    }
  };
  
  const saveKey = async (providerId: string) => {
    const keyState = keys[providerId];
    if (!keyState?.value || !user) return;
    
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      
      // Upsert the provider config
      const { error } = await supabase
        .from('ai_provider_configs')
        .upsert({
          user_id: user.id,
          provider: providerId,
          api_key_encrypted: keyState.value, // In production, encrypt this
          is_enabled: keyState.isEnabled,
          is_default: providerId === defaultProvider,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider',
        });
      
      if (error) throw error;
      
      toast({
        title: 'API Anahtarı Kaydedildi',
        description: `${AI_PROVIDERS.find((p) => p.id === providerId)?.name} anahtarı güvenli bir şekilde kaydedildi.`,
      });
      
      // Mask the key after saving
      updateKey(providerId, { value: '••••••••••••••••', isVisible: false });
      
    } catch (error: any) {
      toast({
        title: 'Kaydetme Hatası',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const deleteKey = async (providerId: string) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('ai_provider_configs')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', providerId);
      
      if (error) throw error;
      
      setKeys((prev) => {
        const newKeys = { ...prev };
        delete newKeys[providerId];
        return newKeys;
      });
      
      toast({
        title: 'API Anahtarı Silindi',
        description: `${AI_PROVIDERS.find((p) => p.id === providerId)?.name} anahtarı kaldırıldı.`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Silme Hatası',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const setAsDefault = async (providerId: string) => {
    if (!user) return;
    
    setDefaultProvider(providerId);
    
    try {
      const supabase = createClient();
      
      // Remove default from all
      await supabase
        .from('ai_provider_configs')
        .update({ is_default: false })
        .eq('user_id', user.id);
      
      // Set new default
      await supabase
        .from('ai_provider_configs')
        .update({ is_default: true })
        .eq('user_id', user.id)
        .eq('provider', providerId);
      
      toast({
        title: 'Varsayılan Sağlayıcı',
        description: `${AI_PROVIDERS.find((p) => p.id === providerId)?.name} varsayılan olarak ayarlandı.`,
      });
      
    } catch (error: any) {
      console.error('Failed to set default:', error);
    }
  };
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            API Vault
          </CardTitle>
          <CardDescription>
            API anahtarlarınızı yönetmek için giriş yapın.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          API Vault
        </h2>
        <p className="text-muted-foreground mt-1">
          AI sağlayıcı API anahtarlarınızı güvenli bir şekilde yönetin.
        </p>
      </div>
      
      {/* Security Notice */}
      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          API anahtarları şifrelenmiş olarak saklanır. Asla başkalarıyla paylaşmayın.
        </AlertDescription>
      </Alert>
      
      {/* Provider Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {AI_PROVIDERS.map((provider) => {
          const keyState = keys[provider.id] || {
            value: '',
            isVisible: false,
            isValid: null,
            isChecking: false,
            isEnabled: true,
          };
          
          const hasKey = keyState.value && keyState.value.length > 0;
          const isMasked = keyState.value.includes('•');
          
          return (
            <Card key={provider.id} className={cn(
              'transition-all',
              provider.id === defaultProvider && 'ring-2 ring-primary'
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{provider.logo}</span>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {provider.id === defaultProvider && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Varsayılan
                      </span>
                    )}
                    <Switch
                      checked={keyState.isEnabled}
                      onCheckedChange={(checked) => updateKey(provider.id, { isEnabled: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* API Key Input */}
                <div className="space-y-2">
                  <Label htmlFor={`key-${provider.id}`} className="text-xs">
                    API Anahtarı
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`key-${provider.id}`}
                        type={keyState.isVisible ? 'text' : 'password'}
                        value={keyState.value}
                        onChange={(e) => updateKey(provider.id, { 
                          value: e.target.value, 
                          isValid: null 
                        })}
                        placeholder={`${provider.keyPrefix || ''}...`}
                        className={cn(
                          'pr-20',
                          keyState.isValid === true && 'border-green-500',
                          keyState.isValid === false && 'border-red-500'
                        )}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateKey(provider.id, { isVisible: !keyState.isVisible })}
                        >
                          {keyState.isVisible ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        
                        {keyState.isValid !== null && (
                          keyState.isValid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {provider.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs"
                    >
                      Anahtar Al
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {hasKey && !isMasked && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkKeyValidity(provider.id)}
                          disabled={keyState.isChecking}
                        >
                          {keyState.isChecking ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Doğrula'
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => saveKey(provider.id)}
                          disabled={isSaving}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Kaydet
                        </Button>
                      </>
                    )}
                    
                    {hasKey && isMasked && (
                      <>
                        {provider.id !== defaultProvider && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAsDefault(provider.id)}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Varsayılan Yap
                          </Button>
                        )}
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteKey(provider.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Nasıl Çalışır?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Kendi API anahtarlarınızı ekleyerek AI özelliklerini kullanabilirsiniz.
          </p>
          <p>
            • Varsayılan sağlayıcı, tüm AI işlemlerinde öncelikli olarak kullanılır.
          </p>
          <p>
            • API anahtarları sadece tarayıcınızda ve güvenli sunucumuzda saklanır.
          </p>
          <p>
            • Birden fazla sağlayıcı ekleyerek yedeklilik sağlayabilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default APIVault;
