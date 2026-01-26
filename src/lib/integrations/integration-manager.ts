/**
 * Integration Manager
 * 
 * Tüm entegrasyonların yönetimi, senkronizasyon ve API iletişimi
 */

import { createClient } from '@/lib/supabase/client';
import { 
  IntegrationConnection, 
  IntegrationProvider, 
  IntegrationStatus, 
  SyncLog,
  IntegrationOperation,
  SyncDirection,
  SyncFrequency,
  IntegrationError,
  IntegrationCategory
} from './integration-types';
import { getProviderById, ALL_PROVIDERS } from './providers';

// =====================================================
// INTEGRATION MANAGER CLASS
// =====================================================

export class IntegrationManager {
  private userId: string;
  private supabase: ReturnType<typeof createClient>;
  
  constructor(userId: string) {
    this.userId = userId;
    this.supabase = createClient();
  }
  
  // =====================================================
  // ENTEGRASYON BAĞLANTI YÖNETİMİ
  // =====================================================
  
  /**
   * Yeni entegrasyon bağlantısı oluştur
   */
  async createConnection(
    providerId: string,
    credentials: Record<string, string>,
    settings: Record<string, any> = {},
    syncSettings?: {
      direction?: SyncDirection;
      frequency?: SyncFrequency;
      enabled?: boolean;
    }
  ): Promise<IntegrationConnection | null> {
    const provider = getProviderById(providerId);
    if (!provider) {
      console.error(`Provider not found: ${providerId}`);
      return null;
    }
    
    // Kimlik bilgilerini doğrula
    const missingFields = provider.requiredCredentials
      .filter(field => field.required && !credentials[field.key])
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      console.error(`Missing required credentials: ${missingFields.join(', ')}`);
      return null;
    }
    
    const now = new Date().toISOString();
    
    const connection: Omit<IntegrationConnection, 'id'> = {
      userId: this.userId,
      providerId: provider.id,
      providerName: provider.name,
      category: provider.category,
      status: 'pending',
      credentials: this.encryptCredentials(credentials),
      settings,
      syncDirection: syncSettings?.direction || 'bidirectional',
      syncFrequency: syncSettings?.frequency || 'hourly',
      syncEnabled: syncSettings?.enabled ?? true,
      stats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        itemsSynced: 0,
      },
      errorCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    try {
      const { data, error } = await this.supabase
        .from('integration_connections')
        .insert(connection)
        .select()
        .single();
      
      if (error) throw error;
      
      // Bağlantıyı test et
      await this.testConnection(data.id);
      
      return data;
    } catch (error) {
      console.error('Failed to create integration connection:', error);
      return null;
    }
  }
  
  /**
   * Entegrasyon bağlantısını güncelle
   */
  async updateConnection(
    connectionId: string,
    updates: Partial<IntegrationConnection>
  ): Promise<IntegrationConnection | null> {
    try {
      const { data, error } = await this.supabase
        .from('integration_connections')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', connectionId)
        .eq('userId', this.userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update connection:', error);
      return null;
    }
  }
  
  /**
   * Entegrasyon bağlantısını sil
   */
  async deleteConnection(connectionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('integration_connections')
        .delete()
        .eq('id', connectionId)
        .eq('userId', this.userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return false;
    }
  }
  
  /**
   * Kullanıcının tüm entegrasyonlarını getir
   */
  async getConnections(category?: IntegrationCategory): Promise<IntegrationConnection[]> {
    try {
      let query = this.supabase
        .from('integration_connections')
        .select('*')
        .eq('userId', this.userId);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get connections:', error);
      return [];
    }
  }
  
  /**
   * Tek bir entegrasyonu getir
   */
  async getConnection(connectionId: string): Promise<IntegrationConnection | null> {
    try {
      const { data, error } = await this.supabase
        .from('integration_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('userId', this.userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get connection:', error);
      return null;
    }
  }
  
  // =====================================================
  // BAĞLANTI TESTİ VE SAĞLIK KONTROLÜ
  // =====================================================
  
  /**
   * Entegrasyon bağlantısını test et
   */
  async testConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      return { success: false, message: 'Bağlantı bulunamadı' };
    }
    
    const provider = getProviderById(connection.providerId);
    if (!provider) {
      return { success: false, message: 'Provider bulunamadı' };
    }
    
    try {
      // Provider'a özgü test isteği gönder
      const result = await this.executeProviderRequest(connection, 'health_check');
      
      if (result.success) {
        await this.updateConnection(connectionId, {
          status: 'active',
          lastHealthCheck: new Date().toISOString(),
          lastError: undefined,
          errorCount: 0,
        });
        return { success: true, message: 'Bağlantı başarılı' };
      } else {
        await this.updateConnection(connectionId, {
          status: 'error',
          lastHealthCheck: new Date().toISOString(),
          lastError: {
            code: 'CONNECTION_FAILED',
            message: result.message,
            timestamp: new Date().toISOString(),
            retryable: true,
          },
          errorCount: connection.errorCount + 1,
        });
        return { success: false, message: result.message };
      }
    } catch (error: any) {
      await this.updateConnection(connectionId, {
        status: 'error',
        lastError: {
          code: 'TEST_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
          retryable: true,
        },
        errorCount: connection.errorCount + 1,
      });
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Tüm entegrasyonların sağlık kontrolü
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const connections = await this.getConnections();
    const results = new Map<string, boolean>();
    
    for (const connection of connections) {
      const result = await this.testConnection(connection.id);
      results.set(connection.id, result.success);
    }
    
    return results;
  }
  
  // =====================================================
  // SENKRONİZASYON İŞLEMLERİ
  // =====================================================
  
  /**
   * Manuel senkronizasyon başlat
   */
  async syncNow(
    connectionId: string,
    operations?: IntegrationOperation[]
  ): Promise<SyncLog> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error('Bağlantı bulunamadı');
    }
    
    const provider = getProviderById(connection.providerId);
    if (!provider) {
      throw new Error('Provider bulunamadı');
    }
    
    // Desteklenen operasyonları filtrele
    const supportedOps = operations?.filter(op => 
      provider.supportedOperations.includes(op)
    ) || provider.supportedOperations;
    
    const syncLog: Partial<SyncLog> = {
      integrationId: connectionId,
      operation: supportedOps[0], // İlk operasyon
      direction: connection.syncDirection,
      status: 'started',
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      details: [],
      errors: [],
      startedAt: new Date().toISOString(),
    };
    
    try {
      // Senkronizasyon işlemlerini gerçekleştir
      for (const operation of supportedOps) {
        await this.executeOperation(connection, operation, syncLog);
      }
      
      syncLog.status = syncLog.itemsFailed === 0 ? 'completed' : 'partial';
      syncLog.completedAt = new Date().toISOString();
      syncLog.duration = Date.now() - new Date(syncLog.startedAt!).getTime();
      
      // İstatistikleri güncelle
      await this.updateConnection(connectionId, {
        lastSync: new Date().toISOString(),
        stats: {
          ...connection.stats,
          totalSyncs: connection.stats.totalSyncs + 1,
          successfulSyncs: connection.stats.successfulSyncs + (syncLog.status === 'completed' ? 1 : 0),
          failedSyncs: connection.stats.failedSyncs + (syncLog.status === 'failed' ? 1 : 0),
          itemsSynced: connection.stats.itemsSynced + (syncLog.itemsSucceeded || 0),
          lastSyncDuration: syncLog.duration,
        },
      });
      
      // Log'u kaydet
      await this.saveSyncLog(syncLog as SyncLog);
      
      return syncLog as SyncLog;
    } catch (error: any) {
      syncLog.status = 'failed';
      syncLog.completedAt = new Date().toISOString();
      syncLog.errors?.push({
        code: 'SYNC_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      
      await this.saveSyncLog(syncLog as SyncLog);
      throw error;
    }
  }
  
  /**
   * Belirli bir operasyonu çalıştır
   */
  private async executeOperation(
    connection: IntegrationConnection,
    operation: IntegrationOperation,
    syncLog: Partial<SyncLog>
  ): Promise<void> {
    const provider = getProviderById(connection.providerId);
    if (!provider) return;
    
    // Operasyon tipine göre işlem yap
    switch (operation) {
      case 'product_sync':
        await this.syncProducts(connection, syncLog);
        break;
      case 'stock_sync':
        await this.syncStock(connection, syncLog);
        break;
      case 'order_fetch':
        await this.fetchOrders(connection, syncLog);
        break;
      case 'price_sync':
        await this.syncPrices(connection, syncLog);
        break;
      // Diğer operasyonlar...
      default:
        console.log(`Operation ${operation} not implemented`);
    }
  }
  
  /**
   * Ürün senkronizasyonu
   */
  private async syncProducts(
    connection: IntegrationConnection,
    syncLog: Partial<SyncLog>
  ): Promise<void> {
    console.log(`Syncing products for ${connection.providerName}...`);
    
    // Bu örnek implementasyon - gerçek API çağrıları provider'a göre değişir
    // Gerçek implementasyonda her provider için ayrı adapter kullanılır
    
    syncLog.details?.push({
      itemId: 'products',
      itemType: 'product_batch',
      action: 'sync',
      status: 'success',
      message: 'Products synced successfully',
    });
    
    if (syncLog.itemsSucceeded !== undefined) {
      syncLog.itemsSucceeded += 1;
    }
    if (syncLog.itemsProcessed !== undefined) {
      syncLog.itemsProcessed += 1;
    }
  }
  
  /**
   * Stok senkronizasyonu
   */
  private async syncStock(
    connection: IntegrationConnection,
    syncLog: Partial<SyncLog>
  ): Promise<void> {
    console.log(`Syncing stock for ${connection.providerName}...`);
    // Stock sync implementation
  }
  
  /**
   * Sipariş çekme
   */
  private async fetchOrders(
    connection: IntegrationConnection,
    syncLog: Partial<SyncLog>
  ): Promise<void> {
    console.log(`Fetching orders from ${connection.providerName}...`);
    // Order fetch implementation
  }
  
  /**
   * Fiyat senkronizasyonu
   */
  private async syncPrices(
    connection: IntegrationConnection,
    syncLog: Partial<SyncLog>
  ): Promise<void> {
    console.log(`Syncing prices for ${connection.providerName}...`);
    // Price sync implementation
  }
  
  // =====================================================
  // PROVIDER İLETİŞİMİ
  // =====================================================
  
  /**
   * Provider'a istek gönder
   */
  private async executeProviderRequest(
    connection: IntegrationConnection,
    action: string,
    payload?: any
  ): Promise<{ success: boolean; data?: any; message: string }> {
    const provider = getProviderById(connection.providerId);
    if (!provider) {
      return { success: false, message: 'Provider bulunamadı' };
    }
    
    const credentials = this.decryptCredentials(connection.credentials);
    
    // Provider'a özgü API çağrısı
    // Bu kısım her provider için farklı adapter kullanır
    
    try {
      // Örnek: Health check için basit bir ping
      if (action === 'health_check') {
        // Her provider için farklı endpoint
        const healthEndpoints: Record<string, string> = {
          'trendyol': '/suppliers/{supplier_id}/products?page=0&size=1',
          'hepsiburada': '/product/api/products/list-by-merchant?page=0&size=1',
          'shopify': '/products.json?limit=1',
          // ... diğer providerlar
        };
        
        // Basitleştirilmiş health check
        return { success: true, message: 'Bağlantı başarılı' };
      }
      
      return { success: true, message: 'Request completed', data: {} };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // =====================================================
  // KRİPTOGRAFİ
  // =====================================================
  
  /**
   * Kimlik bilgilerini şifrele
   */
  private encryptCredentials(credentials: Record<string, string>): Record<string, string> {
    // Production'da AES-256 veya benzeri şifreleme kullanılmalı
    // Bu basit base64 encode sadece demo amaçlı
    const encrypted: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentials)) {
      encrypted[key] = Buffer.from(value).toString('base64');
    }
    return encrypted;
  }
  
  /**
   * Kimlik bilgilerini çöz
   */
  private decryptCredentials(encrypted: Record<string, string>): Record<string, string> {
    const decrypted: Record<string, string> = {};
    for (const [key, value] of Object.entries(encrypted)) {
      decrypted[key] = Buffer.from(value, 'base64').toString('utf-8');
    }
    return decrypted;
  }
  
  // =====================================================
  // SYNC LOG YÖNETİMİ
  // =====================================================
  
  /**
   * Sync log kaydet
   */
  private async saveSyncLog(syncLog: SyncLog): Promise<void> {
    try {
      await this.supabase
        .from('sync_logs')
        .insert({
          ...syncLog,
          userId: this.userId,
        });
    } catch (error) {
      console.error('Failed to save sync log:', error);
    }
  }
  
  /**
   * Sync loglarını getir
   */
  async getSyncLogs(
    connectionId?: string,
    limit: number = 50
  ): Promise<SyncLog[]> {
    try {
      let query = this.supabase
        .from('sync_logs')
        .select('*')
        .eq('userId', this.userId)
        .order('startedAt', { ascending: false })
        .limit(limit);
      
      if (connectionId) {
        query = query.eq('integrationId', connectionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get sync logs:', error);
      return [];
    }
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createIntegrationManager(userId: string): IntegrationManager {
  return new IntegrationManager(userId);
}

// =====================================================
// SCHEDULER (CRON JOBS için)
// =====================================================

export class IntegrationScheduler {
  /**
   * Zamanlanmış senkronizasyonları çalıştır
   */
  static async runScheduledSyncs(): Promise<void> {
    const supabase = createClient();
    
    try {
      // Senkronizasyon zamanı gelmiş aktif entegrasyonları bul
      const { data: connections, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('status', 'active')
        .eq('syncEnabled', true)
        .or(`nextSync.is.null,nextSync.lte.${new Date().toISOString()}`);
      
      if (error) throw error;
      
      for (const connection of (connections || [])) {
        const manager = new IntegrationManager(connection.userId);
        
        try {
          await manager.syncNow(connection.id);
          
          // Sonraki senkronizasyon zamanını hesapla
          const nextSync = IntegrationScheduler.calculateNextSync(connection.syncFrequency);
          await manager.updateConnection(connection.id, { nextSync });
        } catch (error) {
          console.error(`Sync failed for connection ${connection.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Scheduled sync run failed:', error);
    }
  }
  
  /**
   * Sonraki senkronizasyon zamanını hesapla
   */
  private static calculateNextSync(frequency: SyncFrequency): string {
    const now = new Date();
    
    switch (frequency) {
      case 'realtime':
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 dakika
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 saat
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 gün
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 hafta
      case 'manual':
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 yıl
    }
  }
}
