import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Calendar Provider OAuth Callback Handler
 * Handles the OAuth callback and token exchange
 */

const PROVIDERS = {
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  microsoft: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
  apple: {
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: null, // Apple doesn't have a userinfo endpoint
    clientIdEnv: 'APPLE_CLIENT_ID',
    clientSecretEnv: 'APPLE_CLIENT_SECRET',
  },
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email',
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
  },
  slack: {
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    userInfoUrl: 'https://slack.com/api/users.identity',
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
  },
  jira: {
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    userInfoUrl: 'https://api.atlassian.com/me',
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
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Redirect errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || error;
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=missing_code_or_state', request.url)
    );
  }

  if (!PROVIDERS[provider as ProviderKey]) {
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=unknown_provider`, request.url)
    );
  }

  // Decode and validate state
  let stateData: { userId: string; timestamp: number; provider: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=invalid_state', request.url)
    );
  }

  // Verify state hasn't expired (15 min)
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=state_expired', request.url)
    );
  }

  // Verify provider matches
  if (stateData.provider !== provider) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=provider_mismatch', request.url)
    );
  }

  const config = PROVIDERS[provider as ProviderKey];
  const env = process.env as unknown as Record<string, string | undefined>;
  const clientId = env[config.clientIdEnv];
  const clientSecret = env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${provider}_not_configured`, request.url)
    );
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/calendar/${provider}/callback`;

  try {
    // Exchange authorization code for tokens
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenBody,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error(`Token exchange error for ${provider}:`, tokenData);
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=token_exchange_failed`, request.url)
      );
    }

    // Get user info if endpoint available
    let userInfo: { id?: string; email?: string; name?: string; user?: any } = {};
    if (config.userInfoUrl) {
      try {
        const userInfoResponse = await fetch(config.userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
          },
        });
        
        if (userInfoResponse.ok) {
          userInfo = await userInfoResponse.json();
          
          // Handle Slack's nested response
          if (provider === 'slack' && userInfo.user) {
            userInfo = (userInfo as any).user;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch user info for ${provider}:`, e);
      }
    }

    // Save to database
    const supabase = await createClient();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: dbError } = await supabase
      .from('calendar_provider_connections')
      .upsert({
        user_id: stateData.userId,
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expiry: expiresAt,
        provider_account_id: userInfo.id || tokenData.user_id || null,
        provider_account_email: userInfo.email || null,
        provider_account_name: userInfo.name || null,
        scopes: tokenData.scope?.split(' ') || [],
        is_active: true,
        sync_status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (dbError) {
      console.error('Database error saving provider connection:', dbError);
      return NextResponse.redirect(
        new URL('/settings?calendar_error=save_failed', request.url)
      );
    }

    // Success!
    return NextResponse.redirect(
      new URL(`/settings?calendar_connected=${provider}&account=${encodeURIComponent(userInfo.email || userInfo.name || provider)}`, request.url)
    );

  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    return NextResponse.redirect(
      new URL('/settings?calendar_error=unexpected_error', request.url)
    );
  }
}
