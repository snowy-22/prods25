/**
 * Integration Connection Detail API
 * 
 * Tek bir entegrasyon bağlantısını yönetir
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getProviderById } from '@/lib/integrations/providers';

// =====================================================
// GET - Entegrasyon Detayını Getir
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
    
    const { data: connection, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    if (error || !connection) {
      return NextResponse.json(
        { error: 'Entegrasyon bulunamadı' },
        { status: 404 }
      );
    }
    
    // Provider bilgisini ekle
    const provider = getProviderById(connection.providerId);
    
    // Son sync loglarını getir
    const { data: syncLogs } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('integrationId', id)
      .order('startedAt', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      connection: {
        ...connection,
        provider,
        credentials: Object.keys(connection.credentials || {}),
      },
      syncLogs: syncLogs || [],
    });
  } catch (error) {
    console.error('Get integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// PUT - Entegrasyonu Güncelle
// =====================================================

export async function PUT(
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
    
    // Mevcut bağlantıyı kontrol et
    const { data: existingConnection } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    if (!existingConnection) {
      return NextResponse.json(
        { error: 'Entegrasyon bulunamadı' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const {
      credentials,
      settings,
      syncDirection,
      syncFrequency,
      syncEnabled,
    } = body;
    
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    
    // Credentials güncelleme
    if (credentials) {
      const encryptedCredentials: Record<string, string> = {};
      for (const [key, value] of Object.entries(credentials)) {
        if (typeof value === 'string') {
          encryptedCredentials[key] = Buffer.from(value).toString('base64');
        }
      }
      updates.credentials = {
        ...existingConnection.credentials,
        ...encryptedCredentials,
      };
      // Credentials değiştiğinde durumu pending yap
      updates.status = 'pending';
    }
    
    if (settings !== undefined) {
      updates.settings = { ...existingConnection.settings, ...settings };
    }
    
    if (syncDirection !== undefined) {
      updates.syncDirection = syncDirection;
    }
    
    if (syncFrequency !== undefined) {
      updates.syncFrequency = syncFrequency;
    }
    
    if (syncEnabled !== undefined) {
      updates.syncEnabled = syncEnabled;
    }
    
    const { data: connection, error } = await supabase
      .from('integration_connections')
      .update(updates)
      .eq('id', id)
      .eq('userId', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to update integration:', error);
      return NextResponse.json(
        { error: 'Entegrasyon güncellenemedi' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      connection: {
        ...connection,
        provider: getProviderById(connection.providerId),
        credentials: Object.keys(connection.credentials || {}),
      },
    });
  } catch (error) {
    console.error('Update integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// DELETE - Entegrasyonu Sil
// =====================================================

export async function DELETE(
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
    
    // Bağlantıyı kontrol et
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('id, providerName')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Entegrasyon bulunamadı' },
        { status: 404 }
      );
    }
    
    // İlgili sync loglarını sil
    await supabase
      .from('sync_logs')
      .delete()
      .eq('integrationId', id);
    
    // Bağlantıyı sil
    const { error } = await supabase
      .from('integration_connections')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);
    
    if (error) {
      console.error('Failed to delete integration:', error);
      return NextResponse.json(
        { error: 'Entegrasyon silinemedi' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `${connection.providerName} entegrasyonu silindi`,
    });
  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
