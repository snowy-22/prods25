'use client';

/**
 * API Vault Custom Hooks
 * Vault yönetimi için React hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  apiVaultManager, 
  API_PROVIDER_CONFIGS, 
  PROVIDER_CATEGORIES,
  ApiProvider,
  StoredApiKey,
  DecryptedApiKey,
  VaultStats 
} from '@/lib/api-vault';
import {
  createApiClient,
  BaseApiClient,
  PhilipsHueClient,
  SmartThingsClient,
  HomeAssistantClient,
  YouTubeDataClient,
  YouTubeAnalyticsClient,
  OpenAIClient,
  AnthropicClient,
  GoogleAIClient,
  ApiClientType
} from '@/lib/api-vault/api-clients';

// Vault status hook
export function useVaultStatus() {
  const { user } = useAppStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsUnlocked(false);
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        setIsUnlocked(apiVaultManager.isUnlocked(user.id));
      } catch {
        setIsUnlocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  return { isUnlocked, isLoading, userId: user?.id };
}

// Main vault hook
export function useApiVault() {
  const { user } = useAppStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<Omit<StoredApiKey, 'encryptedData' | 'iv'>[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);

  // Check initial status
  useEffect(() => {
    if (user) {
      setIsUnlocked(apiVaultManager.isUnlocked(user.id));
    }
  }, [user]);

  // Unlock vault
  const unlock = useCallback(async (masterPassword: string) => {
    if (!user) {
      setError('Kullanıcı oturumu bulunamadı');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiVaultManager.initializeVault(user.id, masterPassword);
      setIsUnlocked(true);
      
      // Load keys after unlock
      const fetchedKeys = await apiVaultManager.listApiKeys(user.id);
      setKeys(fetchedKeys);
      
      // Load stats
      const fetchedStats = await apiVaultManager.getVaultStats(user.id);
      setStats(fetchedStats);
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Kasa açılamadı');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Lock vault
  const lock = useCallback(() => {
    apiVaultManager.lockVault();
    setIsUnlocked(false);
    setKeys([]);
    setStats(null);
  }, []);

  // Refresh keys
  const refreshKeys = useCallback(async () => {
    if (!user || !isUnlocked) return;
    
    try {
      const fetchedKeys = await apiVaultManager.listApiKeys(user.id);
      setKeys(fetchedKeys);
      
      const fetchedStats = await apiVaultManager.getVaultStats(user.id);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to refresh keys:', err);
    }
  }, [user, isUnlocked]);

  // Add key
  const addKey = useCallback(async (
    provider: ApiProvider,
    name: string,
    credentials: Record<string, string>
  ) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
    
    await apiVaultManager.storeApiKey(user.id, provider, name, credentials);
    await refreshKeys();
  }, [user, refreshKeys]);

  // Delete key
  const deleteKey = useCallback(async (keyId: string) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
    
    await apiVaultManager.deleteApiKey(user.id, keyId);
    await refreshKeys();
  }, [user, refreshKeys]);

  // Update key
  const updateKey = useCallback(async (
    keyId: string,
    updates: { name?: string; isEnabled?: boolean }
  ) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
    
    await apiVaultManager.updateApiKey(user.id, keyId, updates);
    await refreshKeys();
  }, [user, refreshKeys]);

  // Get decrypted key
  const getKey = useCallback(async (keyId: string): Promise<DecryptedApiKey | null> => {
    if (!user) return null;
    return await apiVaultManager.getApiKey(user.id, keyId);
  }, [user]);

  // Test key
  const testKey = useCallback(async (keyId: string) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
    return await apiVaultManager.testApiKey(user.id, keyId);
  }, [user]);

  // Get keys by provider
  const getKeysByProvider = useCallback((provider: ApiProvider) => {
    return keys.filter(k => k.provider === provider);
  }, [keys]);

  // Check if provider has active keys
  const hasProvider = useCallback((provider: ApiProvider) => {
    return keys.some(k => k.provider === provider && k.isEnabled);
  }, [keys]);

  // Available providers
  const availableProviders = useMemo(() => {
    return [...new Set(keys.filter(k => k.isEnabled).map(k => k.provider))];
  }, [keys]);

  return {
    isUnlocked,
    isLoading,
    error,
    keys,
    stats,
    unlock,
    lock,
    refreshKeys,
    addKey,
    deleteKey,
    updateKey,
    getKey,
    testKey,
    getKeysByProvider,
    hasProvider,
    availableProviders
  };
}

// API Client hook - returns typed client for a provider
export function useApiClient<T extends ApiClientType>(provider: ApiProvider) {
  const { user } = useAppStore();
  const [client, setClient] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setClient(null);
      return;
    }

    const initClient = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const newClient = await createApiClient<T>(user.id, provider);
        setClient(newClient);
      } catch (err: any) {
        setError(err.message);
        setClient(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only try to init if vault is unlocked
    if (apiVaultManager.isUnlocked(user.id)) {
      initClient();
    }
  }, [user, provider]);

  // Reinitialize client
  const reinitialize = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const newClient = await createApiClient<T>(user.id, provider);
      setClient(newClient);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, provider]);

  return { client, isLoading, error, reinitialize };
}

// Philips Hue hook
export function usePhilipsHue() {
  return useApiClient<PhilipsHueClient>('philips_hue');
}

// SmartThings hook
export function useSmartThings() {
  return useApiClient<SmartThingsClient>('smartthings');
}

// Home Assistant hook
export function useHomeAssistant() {
  return useApiClient<HomeAssistantClient>('home_assistant');
}

// YouTube Data hook
export function useYouTubeData() {
  return useApiClient<YouTubeDataClient>('youtube_data');
}

// YouTube Analytics hook
export function useYouTubeAnalytics() {
  return useApiClient<YouTubeAnalyticsClient>('youtube_analytics');
}

// OpenAI hook
export function useOpenAI() {
  return useApiClient<OpenAIClient>('openai');
}

// Anthropic hook
export function useAnthropic() {
  return useApiClient<AnthropicClient>('anthropic');
}

// Google AI hook
export function useGoogleAI() {
  return useApiClient<GoogleAIClient>('google_ai');
}

// Provider config hook
export function useProviderConfig(provider: ApiProvider) {
  return useMemo(() => API_PROVIDER_CONFIGS[provider], [provider]);
}

// All provider configs hook
export function useProviderConfigs() {
  return useMemo(() => ({
    configs: API_PROVIDER_CONFIGS,
    categories: PROVIDER_CATEGORIES
  }), []);
}
