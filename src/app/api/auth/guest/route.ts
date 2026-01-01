import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

const GUEST_CANVAS_TEMPLATE = {
  tabs: [
    {
      id: 'welcome-tab',
      title: 'Hoş Geldiniz 👋',
      type: 'folder',
      activeViewId: 'welcome-tab',
      isTemporary: false,
      history: ['welcome-tab'],
      historyIndex: 0,
      navigationHistory: ['welcome-tab'],
      navigationIndex: 0,
      undoRedoStack: [{ activeViewId: 'welcome-tab', timestamp: Date.now() }],
      undoRedoIndex: 0,
      children: [
        {
          id: 'welcome-message',
          type: 'note',
          title: 'CanvasFlow\'a Hoş Geldiniz!',
          content: `# Merhaba! 👋

Bu misafir oturumunda CanvasFlow'u keşfedebilirsiniz.

## Özellikler:
- 📂 Klasörler ve listeler oluşturun
- 🎥 Video içeriklerini organize edin
- 📝 Not ve todo widget'ları ekleyin
- 🎨 Temalarla görünümü özelleştirin

## Sınırlamalar:
- Misafir veriler 24 saat sonra silinir
- Bulut senkronizasyonu yoktur
- Paylaşım özellikleri devre dışıdır

**Tam deneyim için ücretsiz hesap oluşturun!**`,
          parentId: 'welcome-tab',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeletable: false,
          order: 0
        },
        {
          id: 'demo-videos',
          type: 'folder',
          title: '🎬 Demo Videolar',
          icon: 'film',
          parentId: 'welcome-tab',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeletable: true,
          order: 1,
          children: [
            {
              id: 'sample-video-1',
              type: 'youtube',
              title: 'CanvasFlow Tanıtım',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
              parentId: 'demo-videos',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: 0
            }
          ]
        },
        {
          id: 'demo-widgets',
          type: 'folder',
          title: '⚙️ Widget Örnekleri',
          icon: 'puzzle',
          parentId: 'welcome-tab',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeletable: true,
          order: 2,
          children: [
            {
              id: 'demo-clock',
              type: 'clock',
              title: 'Saat',
              clockMode: 'digital',
              parentId: 'demo-widgets',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: 0
            },
            {
              id: 'demo-todo',
              type: 'todolist',
              title: 'Yapılacaklar',
              tasksByStatus: {
                backlog: [],
                todo: [
                  { id: '1', text: 'CanvasFlow\'u keşfet', completed: false, createdAt: new Date().toISOString() },
                  { id: '2', text: 'Kendi içeriklerini ekle', completed: false, createdAt: new Date().toISOString() }
                ],
                'in-progress': [],
                done: []
              },
              parentId: 'demo-widgets',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: 1
            }
          ]
        }
      ]
    }
  ],
  activeTabId: 'welcome-tab',
  layoutMode: 'grid',
  newTabBehavior: 'chrome-style'
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Generate unique guest session
    const guestId = nanoid(10);
    const guestUsername = `Guest_${guestId}`;
    const sessionToken = nanoid(32);
    
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Insert guest session
    const { data: session, error } = await supabase
      .from('guest_sessions')
      .insert({
        session_token: sessionToken,
        guest_username: guestUsername,
        canvas_data: GUEST_CANVAS_TEMPLATE,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, return local session only
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          isLocal: true,
          session: {
            id: nanoid(),
            username: guestUsername,
            sessionToken,
            expiresAt: expiresAt.toISOString(),
            canvasData: GUEST_CANVAS_TEMPLATE
          }
        });
      }
      
      console.error('Guest session creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create guest session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      isLocal: false,
      session: {
        id: session.id,
        username: guestUsername,
        sessionToken,
        expiresAt: session.expires_at,
        canvasData: session.canvas_data
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify/retrieve guest session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get('token');
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    const { data: session, error } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 404 }
      );
    }
    
    // Update last accessed time
    await supabase
      .from('guest_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', session.id);
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        username: session.guest_username,
        sessionToken: session.session_token,
        expiresAt: session.expires_at,
        canvasData: session.canvas_data
      }
    });
  } catch (error) {
    console.error('Guest session retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
