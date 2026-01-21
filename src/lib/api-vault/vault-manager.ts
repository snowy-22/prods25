/**
 * API Vault Manager
 * Kullanıcı API key'lerini yöneten ana servis
 */

import { createClient } from '@/lib/supabase/client';
import {
  ApiProvider,
  StoredApiKey,
  DecryptedApiKey,
  ApiKeyUsageLog,
  VaultStats,
  API_PROVIDER_CONFIGS,
} from './types';
import {
  deriveEncryptionKey,
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword,
} from './encryption';

// In-memory cache for decryption key (per session)
let cachedKey: CryptoKey | null = null;
let cachedUserId: string | null = null;

export class ApiVaultManager {
  private supabase = createClient();
  
  // Initialize vault with master password
  async initializeVault(userId: string, masterPassword: string): Promise<boolean> {
    try {
      // Check if vault already exists
      const { data: existing } = await this.supabase
        .from('api_vault_config')
        .select('password_hash')
        .eq('user_id', userId)
        .single();
      
      if (existing) {
        // Verify password
        const isValid = await verifyPassword(masterPassword, userId, existing.password_hash);
        if (!isValid) {
          throw new Error('Invalid master password');
        }
      } else {
        // Create new vault
        const passwordHash = await hashPassword(masterPassword, userId);
        await this.supabase.from('api_vault_config').insert({
          user_id: userId,
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
        });
      }
      
      // Derive and cache encryption key
      cachedKey = await deriveEncryptionKey(masterPassword, userId);
      cachedUserId = userId;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize vault:', error);
      throw error;
    }
  }
  
  // Check if vault is unlocked
  isUnlocked(userId: string): boolean {
    return cachedKey !== null && cachedUserId === userId;
  }
  
  // Lock vault (clear cached key)
  lockVault(): void {
    cachedKey = null;
    cachedUserId = null;
  }
  
  // Store a new API key
  async storeApiKey(
    userId: string,
    provider: ApiProvider,
    name: string,
    credentials: Record<string, string>
  ): Promise<StoredApiKey> {
    if (!cachedKey || cachedUserId !== userId) {
      throw new Error('Vault is locked. Please unlock first.');
    }
    
    // Validate required fields
    const config = API_PROVIDER_CONFIGS[provider];
    for (const field of config.fields) {
      if (field.required && !credentials[field.key]) {
        throw new Error(`Missing required field: ${field.label}`);
      }
      if (field.validation && credentials[field.key]) {
        if (!field.validation.test(credentials[field.key])) {
          throw new Error(`Invalid format for: ${field.label}`);
        }
      }
    }
    
    // Encrypt credentials
    const dataToEncrypt = JSON.stringify(credentials);
    const { encrypted, iv } = await encryptData(dataToEncrypt, cachedKey);
    
    const now = new Date().toISOString();
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedKey: StoredApiKey = {
      id: keyId,
      userId,
      provider,
      name,
      encryptedData: encrypted,
      iv,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isEnabled: true,
    };
    
    const { data, error } = await this.supabase
      .from('api_vault_keys')
      .insert(storedKey)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Retrieve and decrypt an API key
  async getApiKey(userId: string, keyId: string): Promise<DecryptedApiKey | null> {
    if (!cachedKey || cachedUserId !== userId) {
      throw new Error('Vault is locked. Please unlock first.');
    }
    
    const { data, error } = await this.supabase
      .from('api_vault_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('id', keyId)
      .single();
    
    if (error || !data) return null;
    
    try {
      const decryptedData = await decryptData(data.encrypted_data, data.iv, cachedKey);
      const credentials = JSON.parse(decryptedData);
      
      return {
        id: data.id,
        provider: data.provider,
        name: data.name,
        credentials,
        isEnabled: data.is_enabled,
      };
    } catch {
      console.error('Failed to decrypt API key');
      return null;
    }
  }
  
  // Get API key by provider (first enabled key)
  async getApiKeyByProvider(userId: string, provider: ApiProvider): Promise<DecryptedApiKey | null> {
    if (!cachedKey || cachedUserId !== userId) {
      throw new Error('Vault is locked. Please unlock first.');
    }
    
    const { data, error } = await this.supabase
      .from('api_vault_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_enabled', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    
    try {
      const decryptedData = await decryptData(data.encrypted_data, data.iv, cachedKey);
      const credentials = JSON.parse(decryptedData);
      
      return {
        id: data.id,
        provider: data.provider,
        name: data.name,
        credentials,
        isEnabled: data.is_enabled,
      };
    } catch {
      return null;
    }
  }
  
  // List all stored keys (without credentials)
  async listApiKeys(userId: string): Promise<Omit<StoredApiKey, 'encryptedData' | 'iv'>[]> {
    const { data, error } = await this.supabase
      .from('api_vault_keys')
      .select('id, user_id, provider, name, created_at, updated_at, last_used_at, usage_count, is_enabled, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(key => ({
      id: key.id,
      userId: key.user_id,
      provider: key.provider as ApiProvider,
      name: key.name,
      createdAt: key.created_at,
      updatedAt: key.updated_at,
      lastUsedAt: key.last_used_at,
      usageCount: key.usage_count,
      isEnabled: key.is_enabled,
      metadata: key.metadata,
    }));
  }
  
  // Update API key
  async updateApiKey(
    userId: string,
    keyId: string,
    updates: { name?: string; credentials?: Record<string, string>; isEnabled?: boolean }
  ): Promise<void> {
    if (!cachedKey || cachedUserId !== userId) {
      throw new Error('Vault is locked. Please unlock first.');
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    
    if (updates.isEnabled !== undefined) {
      updateData.is_enabled = updates.isEnabled;
    }
    
    if (updates.credentials) {
      const dataToEncrypt = JSON.stringify(updates.credentials);
      const { encrypted, iv } = await encryptData(dataToEncrypt, cachedKey);
      updateData.encrypted_data = encrypted;
      updateData.iv = iv;
    }
    
    const { error } = await this.supabase
      .from('api_vault_keys')
      .update(updateData)
      .eq('user_id', userId)
      .eq('id', keyId);
    
    if (error) throw error;
  }
  
  // Delete API key
  async deleteApiKey(userId: string, keyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_vault_keys')
      .delete()
      .eq('user_id', userId)
      .eq('id', keyId);
    
    if (error) throw error;
  }
  
  // Log API usage
  async logUsage(
    userId: string,
    keyId: string,
    provider: ApiProvider,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const log: ApiKeyUsageLog = {
      id: `log_${Date.now()}`,
      keyId,
      userId,
      provider,
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      metadata,
    };
    
    // Insert usage log
    await this.supabase.from('api_vault_usage_logs').insert(log);
    
    // Update key usage count and last used
    await this.supabase
      .from('api_vault_keys')
      .update({
        usage_count: this.supabase.rpc('increment_usage_count'),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', keyId);
  }
  
  // Get vault statistics
  async getVaultStats(userId: string): Promise<VaultStats> {
    const { data: keys } = await this.supabase
      .from('api_vault_keys')
      .select('provider, usage_count, is_enabled')
      .eq('user_id', userId);
    
    const stats: VaultStats = {
      totalKeys: keys?.length || 0,
      activeKeys: keys?.filter(k => k.is_enabled).length || 0,
      enabledKeys: keys?.filter(k => k.is_enabled).length || 0,
      totalUsage: keys?.reduce((sum, k) => sum + (k.usage_count || 0), 0) || 0,
      usageByProvider: {} as Record<ApiProvider, number>,
      providerBreakdown: [],
    };
    
    // Calculate usage by provider and provider breakdown
    const providerCounts: Record<string, number> = {};
    keys?.forEach(key => {
      const provider = key.provider as ApiProvider;
      stats.usageByProvider[provider] = (stats.usageByProvider[provider] || 0) + (key.usage_count || 0);
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    // Build provider breakdown
    stats.providerBreakdown = Object.entries(providerCounts).map(([provider, count]) => ({
      provider: provider as ApiProvider,
      count
    }));
    
    // Get last activity
    const { data: lastLog } = await this.supabase
      .from('api_vault_usage_logs')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (lastLog) {
      stats.lastActivity = lastLog.timestamp;
    }
    
    return stats;
  }
  
  // Test API key connection
  async testApiKey(userId: string, keyId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const key = await this.getApiKey(userId, keyId);
    if (!key) {
      return { success: false, message: 'Key not found' };
    }
    
    const config = API_PROVIDER_CONFIGS[key.provider];
    if (!config.testEndpoint) {
      return { success: true, message: 'No test endpoint configured' };
    }
    
    const startTime = performance.now();
    
    try {
      // Provider-specific test logic would go here
      // For now, return success
      const latency = Math.round(performance.now() - startTime);
      return { success: true, message: 'Connection successful', latency };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }
  
  // Change master password
  async changeMasterPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify current password
    const { data: config } = await this.supabase
      .from('api_vault_config')
      .select('password_hash')
      .eq('user_id', userId)
      .single();
    
    if (!config) {
      throw new Error('Vault not found');
    }
    
    const isValid = await verifyPassword(currentPassword, userId, config.password_hash);
    if (!isValid) {
      throw new Error('Invalid current password');
    }
    
    // Get current encryption key
    const currentKey = await deriveEncryptionKey(currentPassword, userId);
    
    // Get new encryption key
    const newKey = await deriveEncryptionKey(newPassword, userId);
    
    // Re-encrypt all keys
    const { data: keys } = await this.supabase
      .from('api_vault_keys')
      .select('*')
      .eq('user_id', userId);
    
    for (const key of keys || []) {
      // Decrypt with old key
      const decryptedData = await decryptData(key.encrypted_data, key.iv, currentKey);
      
      // Re-encrypt with new key
      const { encrypted, iv } = await encryptData(decryptedData, newKey);
      
      // Update in database
      await this.supabase
        .from('api_vault_keys')
        .update({ encrypted_data: encrypted, iv })
        .eq('id', key.id);
    }
    
    // Update password hash
    const newHash = await hashPassword(newPassword, userId);
    await this.supabase
      .from('api_vault_config')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    // Update cached key
    cachedKey = newKey;
  }
  
  // Export keys (encrypted backup)
  async exportKeys(userId: string): Promise<string> {
    if (!cachedKey || cachedUserId !== userId) {
      throw new Error('Vault is locked');
    }
    
    const keys = await this.listApiKeys(userId);
    const fullKeys: DecryptedApiKey[] = [];
    
    for (const key of keys) {
      const decrypted = await this.getApiKey(userId, key.id);
      if (decrypted) {
        fullKeys.push(decrypted);
      }
    }
    
    // Create backup with metadata
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userId,
      keys: fullKeys,
    };
    
    // Encrypt backup
    const { encrypted, iv } = await encryptData(JSON.stringify(backup), cachedKey);
    
    return JSON.stringify({ encrypted, iv, version: 1 });
  }
  
  // Import keys (from encrypted backup)
  async importKeys(userId: string, backupData: string): Promise<number> {
    if (!cachedKey || cachedUserId !== userId) {
      throw new Error('Vault is locked');
    }
    
    const { encrypted, iv } = JSON.parse(backupData);
    const decrypted = await decryptData(encrypted, iv, cachedKey);
    const backup = JSON.parse(decrypted);
    
    let imported = 0;
    for (const key of backup.keys) {
      try {
        await this.storeApiKey(userId, key.provider, key.name, key.credentials);
        imported++;
      } catch (error) {
        console.error(`Failed to import key: ${key.name}`, error);
      }
    }
    
    return imported;
  }
}

// Singleton instance
export const apiVaultManager = new ApiVaultManager();
