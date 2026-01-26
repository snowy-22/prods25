/**
 * Integration Sync API
 * 
 * Entegrasyon senkronizasyonunu yönetir
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getProviderById } from '@/lib/integrations/providers';
import { IntegrationOperation, SyncLog } from '@/lib/integrations/integration-types';

// =====================================================
// POST - Manuel Senkronizasyon Başlat
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Bağlantıyı getir
    const { data: connection, error: connError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Entegrasyon bulunamadı' },
        { status: 404 }
      );
    }
    
    // Durum kontrolü
    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Entegrasyon aktif değil', status: connection.status },
        { status: 400 }
      );
    }
    
    // Zaten sync yapılıyorsa bekle
    if (connection.status === 'syncing') {
      return NextResponse.json(
        { error: 'Senkronizasyon zaten devam ediyor' },
        { status: 409 }
      );
    }
    
    const body = await request.json().catch(() => ({}));
    const { operations } = body as { operations?: IntegrationOperation[] };
    
    const provider = getProviderById(connection.providerId);
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider bulunamadı' },
        { status: 400 }
      );
    }
    
    // Desteklenen operasyonları belirle
    const supportedOps = operations?.filter(op => 
      provider.supportedOperations.includes(op)
    ) || provider.supportedOperations;
    
    // Durumu 'syncing' olarak güncelle
    await supabase
      .from('integration_connections')
      .update({
        status: 'syncing',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);
    
    // Sync log oluştur
    const syncLogId = crypto.randomUUID();
    const syncStartTime = new Date().toISOString();
    
    const syncLog: Partial<SyncLog> = {
      id: syncLogId,
      integrationId: id,
      operation: supportedOps[0],
      direction: connection.syncDirection,
      status: 'started',
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      details: [],
      errors: [],
      startedAt: syncStartTime,
    };
    
    // Log'u kaydet
    await supabase
      .from('sync_logs')
      .insert({
        ...syncLog,
        userId: user.id,
      });
    
    // Senkronizasyonu arka planda başlat
    performSync(supabase, connection, provider, supportedOps, syncLogId).catch(console.error);
    
    return NextResponse.json({
      success: true,
      message: 'Senkronizasyon başlatıldı',
      syncLogId,
      operations: supportedOps,
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// GET - Sync Durumunu Getir
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const syncLogId = searchParams.get('logId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Belirli bir sync log'u getir
    if (syncLogId) {
      const { data: syncLog, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('id', syncLogId)
        .eq('integrationId', id)
        .single();
      
      if (error || !syncLog) {
        return NextResponse.json(
          { error: 'Sync log bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ syncLog });
    }
    
    // Tüm sync loglarını getir
    const { data: syncLogs, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('integrationId', id)
      .order('startedAt', { ascending: false })
      .limit(limit);
    
    if (error) {
      return NextResponse.json(
        { error: 'Sync logları getirilemedi' },
        { status: 500 }
      );
    }
    
    // Bağlantının mevcut durumunu da getir
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('status, lastSync, stats')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    return NextResponse.json({
      syncLogs: syncLogs || [],
      connectionStatus: connection?.status,
      lastSync: connection?.lastSync,
      stats: connection?.stats,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// HELPER: Senkronizasyonu Gerçekleştir
// =====================================================

async function performSync(
  supabase: Awaited<ReturnType<typeof createClient>>,
  connection: any,
  provider: any,
  operations: IntegrationOperation[],
  syncLogId: string
): Promise<void> {
  const startTime = Date.now();
  let itemsProcessed = 0;
  let itemsSucceeded = 0;
  let itemsFailed = 0;
  const details: any[] = [];
  const errors: any[] = [];
  
  try {
    // Her operasyon için işlem yap
    for (const operation of operations) {
      try {
        const result = await executeOperation(connection, provider, operation);
        
        itemsProcessed += result.processed;
        itemsSucceeded += result.succeeded;
        itemsFailed += result.failed;
        
        details.push({
          operation,
          status: result.failed === 0 ? 'success' : 'partial',
          message: `${operation}: ${result.succeeded}/${result.processed} başarılı`,
          timestamp: new Date().toISOString(),
        });
      } catch (opError: any) {
        errors.push({
          code: `${operation.toUpperCase()}_FAILED`,
          message: opError.message,
          timestamp: new Date().toISOString(),
        });
        itemsFailed++;
      }
    }
    
    // Sync log'u güncelle
    const duration = Date.now() - startTime;
    const status = itemsFailed === 0 ? 'completed' : (itemsSucceeded > 0 ? 'partial' : 'failed');
    
    await supabase
      .from('sync_logs')
      .update({
        status,
        itemsProcessed,
        itemsSucceeded,
        itemsFailed,
        details,
        errors,
        completedAt: new Date().toISOString(),
        duration,
      })
      .eq('id', syncLogId);
    
    // Bağlantı istatistiklerini güncelle
    await supabase
      .from('integration_connections')
      .update({
        status: 'active',
        lastSync: new Date().toISOString(),
        stats: {
          totalSyncs: (connection.stats?.totalSyncs || 0) + 1,
          successfulSyncs: (connection.stats?.successfulSyncs || 0) + (status === 'completed' ? 1 : 0),
          failedSyncs: (connection.stats?.failedSyncs || 0) + (status === 'failed' ? 1 : 0),
          itemsSynced: (connection.stats?.itemsSynced || 0) + itemsSucceeded,
          lastSyncDuration: duration,
        },
        updatedAt: new Date().toISOString(),
      })
      .eq('id', connection.id);
    
    console.log(`Sync completed for ${connection.providerName}: ${itemsSucceeded}/${itemsProcessed} items`);
  } catch (error: any) {
    // Genel hata
    await supabase
      .from('sync_logs')
      .update({
        status: 'failed',
        errors: [...errors, {
          code: 'SYNC_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        }],
        completedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      })
      .eq('id', syncLogId);
    
    await supabase
      .from('integration_connections')
      .update({
        status: 'error',
        lastError: {
          code: 'SYNC_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
          retryable: true,
        },
        errorCount: (connection.errorCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', connection.id);
    
    console.error(`Sync failed for ${connection.providerName}:`, error);
  }
}

// =====================================================
// HELPER: Operasyonu Çalıştır
// =====================================================

async function executeOperation(
  connection: any,
  provider: any,
  operation: IntegrationOperation
): Promise<{ processed: number; succeeded: number; failed: number }> {
  // Bu fonksiyon her operasyon için provider-specific API çağrılarını yapar
  // Şimdilik simüle ediyoruz
  
  console.log(`Executing ${operation} for ${provider.name}...`);
  
  // Simüle edilmiş işlem süresi
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simüle edilmiş sonuçlar
  const processed = Math.floor(Math.random() * 50) + 10;
  const failed = Math.floor(Math.random() * 3);
  const succeeded = processed - failed;
  
  return { processed, succeeded, failed };
}
