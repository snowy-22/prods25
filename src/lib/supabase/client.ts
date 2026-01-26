import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn("Supabase environment variables are missing. Auth and sync features will be disabled.");
  }

  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabasePublishableKey || 'placeholder',
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return [];
          return document.cookie.split('; ').map(cookie => {
            const [name, ...value] = cookie.split('=');
            return { name, value: value.join('=') };
          });
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return;
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}`;
            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
            if (options?.expires) cookie += `; expires=${options.expires.toUTCString()}`;
            cookie += `; path=${options?.path ?? '/'}`;
            cookie += `; samesite=${options?.sameSite ?? 'Lax'}`;
            if (options?.secure) cookie += '; secure';
            document.cookie = cookie;
          });
        },
      },
    }
  )
}

// Export a default client instance for convenience
export const supabase = createClient();
