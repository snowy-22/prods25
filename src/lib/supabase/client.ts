import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing. Auth and sync features will be disabled.");
    // Return a mock client or handle it gracefully
    // For now, we'll just return the client and let it fail if used, 
    // but we've warned the user.
  }

  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
      cookies: {
        get(name: string) {
          // Read cookie from document.cookie
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie?.substring(name.length + 1) ?? '';
        },
        set(name: string, value: string, options: any) {
          // Set cookie in document.cookie
          let cookie = `${name}=${value}`;
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options?.path) cookie += `; path=${options.path}`;
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options?.secure) cookie += '; secure';
          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          // Remove cookie by setting expiry to past
          document.cookie = `${name}=; path=${options?.path ?? '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
      },
    }
  )
}

// Export a default client instance for convenience
export const supabase = createClient();
