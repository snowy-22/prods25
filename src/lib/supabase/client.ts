import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing. Auth and sync features will be disabled.");
  }

  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Storage key for PKCE code verifier
        storageKey: 'supabase.auth.token',
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null;
            return window.localStorage.getItem(key);
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(key, value);
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem(key);
          },
        },
      },
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return '';
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie?.substring(name.length + 1) ?? '';
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          let cookie = `${name}=${value}`;
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
          cookie += `; path=${options?.path ?? '/'}`;
          // Use Lax for OAuth redirects to work properly
          cookie += `; samesite=${options?.sameSite ?? 'Lax'}`;
          // Only add secure flag in production (HTTPS)
          if (window.location.protocol === 'https:') {
            cookie += '; secure';
          }
          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=; path=${options?.path ?? '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
      },
    }
  )
}

// Export a default client instance for convenience
export const supabase = createClient();
