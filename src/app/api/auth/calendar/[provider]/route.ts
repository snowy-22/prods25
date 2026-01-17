import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Calendar Provider OAuth Routes
 * 
 * Supports: Google, Microsoft, Apple, Facebook, Slack, Jira
 * 
 * Flow:
 * 1. GET /api/auth/calendar/[provider] - Redirect to OAuth
 * 2. GET /api/auth/calendar/[provider]/callback - Handle callback
 */

const PROVIDERS = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access',
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scope: 'name email',
    clientIdEnv: 'APPLE_CLIENT_ID',
    clientSecretEnv: 'APPLE_CLIENT_SECRET',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'email',
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scope: 'users:read users.profile:read',
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
  },
  jira: {
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scope: 'read:me read:jira-work read:jira-user',
    clientIdEnv: 'JIRA_CLIENT_ID',
    clientSecretEnv: 'JIRA_CLIENT_SECRET',
  },
};

type ProviderKey = keyof typeof PROVIDERS;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const isCallback = searchParams.has('code') || searchParams.has('error');

  if (!PROVIDERS[provider as ProviderKey]) {
    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  }

  if (isCallback) {
    return handleCallback(request, provider as ProviderKey);
  }

  return handleAuth(request, provider as ProviderKey);
}

async function handleAuth(request: NextRequest, provider: ProviderKey) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
  }

  const config = PROVIDERS[provider];
  const env = process.env as unknown as Record<string, string | undefined>;
  const clientId = env[config.clientIdEnv];

  if (!clientId) {
    return NextResponse.json(
      { error: `${provider} OAuth not configured` },
      { status: 500 }
    );
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/calendar/${provider}/callback`;

  // Generate state for CSRF protection
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
    provider,
  })).toString('base64url');

  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
    access_type: 'offline', // For Google
    prompt: 'consent', // Force consent to get refresh token
  });

  // Provider-specific adjustments
  if (provider === 'jira') {
    authParams.set('audience', 'api.atlassian.com');
  }

  const authUrl = `${config.authUrl}?${authParams.toString()}`;
  return NextResponse.redirect(authUrl);
}

async function handleCallback(request: NextRequest, provider: ProviderKey) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=missing_params', request.url)
    );
  }

  // Verify state
  let stateData;
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=invalid_state', request.url)
    );
  }

  // Check state expiration (15 minutes)
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=expired_state', request.url)
    );
  }

  const config = PROVIDERS[provider];
  const env = process.env as unknown as Record<string, string | undefined>;
  const clientId = env[config.clientIdEnv];
  const clientSecret = env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=not_configured', request.url)
    );
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/calendar/${provider}/callback`;

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error(`Token exchange failed for ${provider}:`, errorData);
      return NextResponse.redirect(
        new URL('/settings?calendar_error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Save tokens to database
    const supabase = await createClient();
    
    // Calculate expiration
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await supabase.from('calendar_provider_connections').upsert({
      user_id: stateData.userId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expiry: expiresAt,
      provider_account_id: tokens.user_id || tokens.id || null,
      provider_account_email: tokens.email || null,
      scopes: config.scope.split(' '),
      is_active: true,
      last_sync_at: null,
      sync_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider',
    });

    return NextResponse.redirect(
      new URL(`/settings?calendar_connected=${provider}`, request.url)
    );
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    return NextResponse.redirect(
      new URL('/settings?calendar_error=callback_failed', request.url)
    );
  }
}
