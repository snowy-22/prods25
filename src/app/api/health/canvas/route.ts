import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/canvas
 * Comprehensive canvas system health check
 * Tests database tables, realtime, and API connectivity
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error' | 'warning'; message: string; latencyMs?: number }> = {};
  
  try {
    const supabase = await createClient();
    
    // 1. Test Auth Service
    const authStart = Date.now();
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    checks.auth = {
      status: authError ? 'error' : 'ok',
      message: authError ? authError.message : sessionData?.session ? 'Authenticated' : 'No session (anonymous)',
      latencyMs: Date.now() - authStart,
    };

    // 2. Test canvas_items table (primary canvas storage)
    const canvasItemsStart = Date.now();
    const { count: canvasItemsCount, error: canvasItemsError } = await supabase
      .from('canvas_items')
      .select('*', { count: 'exact', head: true });
    checks.canvas_items_table = {
      status: canvasItemsError ? 'error' : 'ok',
      message: canvasItemsError 
        ? `Table error: ${canvasItemsError.message}` 
        : `Table exists with ${canvasItemsCount ?? 0} items`,
      latencyMs: Date.now() - canvasItemsStart,
    };

    // 3. Test profiles table
    const profilesStart = Date.now();
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    checks.profiles_table = {
      status: profilesError ? 'error' : 'ok',
      message: profilesError 
        ? `Table error: ${profilesError.message}` 
        : `Table exists with ${profilesCount ?? 0} profiles`,
      latencyMs: Date.now() - profilesStart,
    };

    // 4. Test trash_items table
    const trashStart = Date.now();
    const { count: trashCount, error: trashError } = await supabase
      .from('trash_items')
      .select('*', { count: 'exact', head: true });
    checks.trash_items_table = {
      status: trashError ? 'error' : 'ok',
      message: trashError 
        ? `Table error: ${trashError.message}` 
        : `Table exists with ${trashCount ?? 0} items`,
      latencyMs: Date.now() - trashStart,
    };

    // 5. Test folder_items_cloud table (cross-device sync)
    const folderItemsStart = Date.now();
    const { count: folderItemsCount, error: folderItemsError } = await supabase
      .from('folder_items_cloud')
      .select('*', { count: 'exact', head: true });
    checks.folder_items_cloud_table = {
      status: folderItemsError ? 'error' : 'ok',
      message: folderItemsError 
        ? `Table error: ${folderItemsError.message}` 
        : `Table exists with ${folderItemsCount ?? 0} items`,
      latencyMs: Date.now() - folderItemsStart,
    };

    // 6. Test ai_conversations table
    const aiConversationsStart = Date.now();
    const { count: aiConvCount, error: aiConvError } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true });
    checks.ai_conversations_table = {
      status: aiConvError ? 'error' : 'ok',
      message: aiConvError 
        ? `Table error: ${aiConvError.message}` 
        : `Table exists with ${aiConvCount ?? 0} conversations`,
      latencyMs: Date.now() - aiConversationsStart,
    };

    // 7. Test exports table (export & sharing system)
    const exportsStart = Date.now();
    const { count: exportsCount, error: exportsError } = await supabase
      .from('exports')
      .select('*', { count: 'exact', head: true });
    checks.exports_table = {
      status: exportsError ? 'error' : 'ok',
      message: exportsError 
        ? `Table error: ${exportsError.message}` 
        : `Table exists with ${exportsCount ?? 0} exports`,
      latencyMs: Date.now() - exportsStart,
    };

    // 8. Test Realtime channel subscription capability
    const realtimeStart = Date.now();
    try {
      const channel = supabase.channel('health-check-test');
      const subscribePromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });
      const realtimeOk = await subscribePromise;
      await supabase.removeChannel(channel);
      
      checks.realtime = {
        status: realtimeOk ? 'ok' : 'warning',
        message: realtimeOk ? 'Realtime subscription working' : 'Realtime subscription timeout (may still work)',
        latencyMs: Date.now() - realtimeStart,
      };
    } catch (realtimeError: any) {
      checks.realtime = {
        status: 'error',
        message: `Realtime error: ${realtimeError.message}`,
        latencyMs: Date.now() - realtimeStart,
      };
    }

    // 9. Environment configuration check
    checks.environment = {
      status: 'ok',
      message: 'Configuration validated',
    };
    
    const envIssues: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) envIssues.push('NEXT_PUBLIC_SUPABASE_URL missing');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      envIssues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) envIssues.push('SUPABASE_SERVICE_ROLE_KEY missing');
    if (!process.env.NEXT_PUBLIC_APP_URL) envIssues.push('NEXT_PUBLIC_APP_URL missing');
    
    if (envIssues.length > 0) {
      checks.environment = {
        status: envIssues.length > 2 ? 'error' : 'warning',
        message: `Issues: ${envIssues.join(', ')}`,
      };
    }

    // Calculate overall status
    const errorCount = Object.values(checks).filter(c => c.status === 'error').length;
    const warningCount = Object.values(checks).filter(c => c.status === 'warning').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorCount > 0) overallStatus = errorCount >= 3 ? 'unhealthy' : 'degraded';
    else if (warningCount > 0) overallStatus = 'degraded';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalLatencyMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary: {
        totalChecks: Object.keys(checks).length,
        passed: Object.values(checks).filter(c => c.status === 'ok').length,
        warnings: warningCount,
        errors: errorCount,
      },
      recommendations: errorCount > 0 ? [
        'Check Supabase dashboard for table creation status',
        'Verify all environment variables are set in Vercel',
        'Run database migrations if tables are missing',
      ] : [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        totalLatencyMs: Date.now() - startTime,
        error: error.message || 'Health check failed',
        checks,
      },
      { status: 503 }
    );
  }
}
