import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Public health check endpoint with Supabase connection test
 * No authentication required
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Test auth service
    const { error: authError } = await supabase.auth.getSession();
    const authHealthy = !authError;
    
    // Test database connection
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    const dbHealthy = !dbError;
    
    const health = {
      status: authHealthy && dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      latencyMs: Date.now() - startTime,
      services: {
        auth: authHealthy ? 'connected' : authError?.message || 'error',
        database: dbHealthy ? 'connected' : dbError?.message || 'error',
        api: 'operational',
      },
      config: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    };

    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        error: error.message || 'Health check failed',
        config: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
          hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
      { status: 503 }
    );
  }
}
