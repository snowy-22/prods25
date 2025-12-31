// Security Middleware
// Protects API routes and enforces security policies

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limiter';
import { hasPermission } from '@/lib/security/rbac';

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const direct = request.headers.get('x-real-ip');
  return (forwarded?.split(',')[0] || direct || 'unknown').trim();
}

/**
 * Authentication middleware
 * Verifies user session and attaches user info to request
 */
export async function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Add user to request context
      (req as any).user = user;

      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  config = RATE_LIMIT_PRESETS.api
) {
  return async (req: NextRequest, context: any) => {
    const ip = getClientIp(req);
    const key = `rate-limit:${req.nextUrl.pathname}:${ip}`;

    if (checkRateLimit(key, config)) {
      return NextResponse.json(
        { error: config.message || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const response = await handler(req, context);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      Math.max(0, config.maxRequests - 1).toString()
    );
    response.headers.set(
      'X-RateLimit-Reset',
      (Date.now() + config.windowMs).toString()
    );

    return response;
  };
}

/**
 * Permission-based middleware
 * Checks if user has required permission
 */
export function withPermission(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  action: string,
  resource: string
) {
  return withAuth(async (req: NextRequest, context: any) => {
    const user = (req as any).user;

    // Get user role from database
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'user';

    if (!hasPermission(userRole, action, resource)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, context);
  });
}

/**
 * CORS middleware
 * Handles cross-origin requests safely
 */
export function withCors(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  allowedOrigins?: string[]
) {
  return async (req: NextRequest, context: any) => {
    const origin = req.headers.get('origin');
    const allowed = allowedOrigins || [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXT_PUBLIC_APP_URL || '',
    ];

    let allowOrigin = '';
    if (origin && allowed.includes(origin)) {
      allowOrigin = origin;
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowOrigin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(req, context);

    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

/**
 * Security headers middleware
 * Adds important security headers
 */
export function withSecurityHeaders(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const response = await handler(req, context);

    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    response.headers.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );

    return response;
  };
}

/**
 * Combine multiple middleware
 */
export function withMiddleware(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  middlewares: Array<(h: any) => any>
) {
  return middlewares.reduce((fn, middleware) => middleware(fn), handler);
}

/**
 * Input validation middleware
 * Prevents common attacks like SQL injection, XSS
 */
export function withValidation(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  schema?: any
) {
  return async (req: NextRequest, context: any) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = await req.json();

        // Basic XSS prevention - check for script tags
        const bodyString = JSON.stringify(body);
        if (/<script|javascript:|onerror=/i.test(bodyString)) {
          return NextResponse.json(
            { error: 'Invalid input detected' },
            { status: 400 }
          );
        }

        // Validate against schema if provided
        if (schema) {
          const validation = schema.safeParse(body);
          if (!validation.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: validation.error },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
    }

    return handler(req, context);
  };
}
