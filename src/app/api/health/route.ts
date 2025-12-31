import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/health
 * Public health check endpoint
 * No authentication required
 * No rate limiting (for monitoring)
 */
export async function GET(req: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected', // TODO: Check actual database connection
        redis: 'connected', // TODO: Check actual Redis connection
        api: 'operational',
      },
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
