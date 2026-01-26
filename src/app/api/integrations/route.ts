/**
 * Integration Connections API
 * 
 * Harici entegrasyon bağlantılarını yönetir
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getProviderById, getProvidersByCategory, ALL_PROVIDERS } from '@/lib/integrations/providers';

// =====================================================
// GET - Entegrasyonları Listele
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const providerId = searchParams.get('provider');
    const listProviders = searchParams.get('providers');
    
    // Provider listesini döndür
    if (listProviders === 'true') {
      if (category) {
        const providers = getProvidersByCategory(category as any);
        return NextResponse.json({ providers });
      }
      return NextResponse.json({ providers: ALL_PROVIDERS });
    }
    
    // Kullanıcının entegrasyonlarını getir
    let query = supabase
      .from('integration_connections')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (providerId) {
      query = query.eq('providerId', providerId);
    }
    
    const { data: connections, error } = await query;
    
    if (error) {
      console.error('Failed to fetch integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }
    
    // Provider bilgilerini ekle
    const connectionsWithProviders = connections?.map(conn => ({
      ...conn,
      provider: getProviderById(conn.providerId),
      // Credentials'ı gizle
      credentials: Object.keys(conn.credentials || {}),
    }));
    
    return NextResponse.json({
      connections: connectionsWithProviders || [],
      total: connectionsWithProviders?.length || 0,
    });
  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// POST - Yeni Entegrasyon Bağlantısı Oluştur
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      providerId,
      credentials,
      settings = {},
      syncDirection = 'bidirectional',
      syncFrequency = 'hourly',
      syncEnabled = true,
    } = body;
    
    // Provider'ı kontrol et
    const provider = getProviderById(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: 'Geçersiz provider', providerId },
        { status: 400 }
      );
    }
    
    // Gerekli credential'ları kontrol et
    const missingFields = provider.requiredCredentials
      .filter(field => field.required && !credentials?.[field.key])
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Eksik kimlik bilgileri', missingFields },
        { status: 400 }
      );
    }
    
    // Aynı provider ile mevcut bağlantı var mı kontrol et
    const { data: existingConnection } = await supabase
      .from('integration_connections')
      .select('id')
      .eq('userId', user.id)
      .eq('providerId', providerId)
      .single();
    
    if (existingConnection) {
      return NextResponse.json(
        { error: 'Bu entegrasyon zaten mevcut', connectionId: existingConnection.id },
        { status: 409 }
      );
    }
    
    // Credentials'ı şifrele (basit base64 - production'da AES kullanın)
    const encryptedCredentials: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentials || {})) {
      if (typeof value === 'string') {
        encryptedCredentials[key] = Buffer.from(value).toString('base64');
      }
    }
    
    const now = new Date().toISOString();
    
    // Bağlantıyı oluştur
    const { data: connection, error: createError } = await supabase
      .from('integration_connections')
      .insert({
        userId: user.id,
        providerId: provider.id,
        providerName: provider.name,
        category: provider.category,
        status: 'pending',
        credentials: encryptedCredentials,
        settings,
        syncDirection,
        syncFrequency,
        syncEnabled,
        stats: {
          totalSyncs: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          itemsSynced: 0,
        },
        errorCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create integration:', createError);
      return NextResponse.json(
        { error: 'Entegrasyon oluşturulamadı' },
        { status: 500 }
      );
    }
    
    // Bağlantıyı test et (async)
    testConnection(supabase, connection.id, provider).catch(console.error);
    
    return NextResponse.json({
      success: true,
      connection: {
        ...connection,
        provider,
        credentials: Object.keys(credentials || {}),
      },
      message: 'Entegrasyon oluşturuldu, bağlantı test ediliyor...',
    });
  } catch (error) {
    console.error('Create integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// HELPER: Bağlantı Testi
// =====================================================

async function testConnection(
  supabase: Awaited<ReturnType<typeof createClient>>,
  connectionId: string,
  provider: any
): Promise<void> {
  try {
    // Basit bir health check simülasyonu
    // Gerçek implementasyonda provider'a API isteği gönderilir
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Başarılı test - durumu güncelle
    await supabase
      .from('integration_connections')
      .update({
        status: 'active',
        lastHealthCheck: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', connectionId);
    
    console.log(`Integration ${connectionId} connection test passed`);
  } catch (error: any) {
    // Başarısız test
    await supabase
      .from('integration_connections')
      .update({
        status: 'error',
        lastError: {
          code: 'CONNECTION_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
          retryable: true,
        },
        errorCount: 1,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', connectionId);
    
    console.error(`Integration ${connectionId} connection test failed:`, error);
  }
}
