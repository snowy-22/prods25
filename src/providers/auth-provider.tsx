'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ user: User | null; session: any | null }>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => void;
  generateReferralCode: (userId: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { setUser: setStoreUser, setUsername } = useAppStore();

  useEffect(() => {
    let mounted = true;
    
    // Check active session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (session?.user && mounted) {
          setUser(session.user);
          setStoreUser(session.user);
          const username = session.user.user_metadata?.username || 
                          session.user.email?.split('@')[0] || 
                          'User';
          setUsername(username);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          setStoreUser(session.user);
          const username = session.user.user_metadata?.username || 
                          session.user.email?.split('@')[0] || 
                          'User';
          setUsername(username);
        } else {
          setUser(null);
          setStoreUser(null);
          setUsername(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setStoreUser, setUsername]);

  const generateReferralCode = (userId: string): string => {
    // Generate referral code from first 4 chars of userId + random string
    const prefix = userId.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ SignIn error:', error.message);
        throw error;
      }

      if (!data.session?.user) {
        throw new Error('SignIn failed: No session returned');
      }

      // Update state immediately (onAuthStateChange will also fire)
      setUser(data.session.user);
      setStoreUser(data.session.user);
      const username = data.session.user.user_metadata?.username || 
                      data.session.user.email?.split('@')[0] || 
                      'User';
      setUsername(username);
      console.log('✅ SignIn successful:', data.session.user.email);
      
      // Wait a bit for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('❌ SignIn failed:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username,
          referral_code: undefined, // Will be generated after user creation
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // Update user state immediately if we have a session
    if (data.session?.user) {
      setUser(data.session.user);
      setStoreUser(data.session.user);
      setUsername(username);
      console.log('✅ SignUp user state updated:', data.session.user.email);
    }

    // Create profile directly (trigger disabled for reliability)
    if (data.user) {
      try {
        // Generate referral code for new user
        const generatedReferralCode = generateReferralCode(data.user.id);
        
        // Find referred_by user if referral code provided
        let referredBy: string | null = null;
        if (referralCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single();
          
          if (referrer) {
            referredBy = referrer.id;
          }
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: username,
            referral_code: generatedReferralCode,
            referred_by: referredBy,
            referral_count: 0,
            is_referrer: false,
          }, {
            count: 'exact',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }
        
        console.log('✅ Profile created successfully for:', data.user.email);
        console.log('✅ Referral code:', generatedReferralCode);
        if (referredBy) console.log('✅ Referred by:', referralCode);
      } catch (err: any) {
        console.error('Failed to create profile:', err?.message || err);
        throw err;
      }
    }

    return { user: data.user, session: data.session };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ SignOut error:', error.message);
        throw error;
      }
      
      // Clear state immediately
      setUser(null);
      setStoreUser(null);
      setUsername(null);
      
      // Clear ALL auth cookies (critical for re-authentication)
      const cookies = [
        'sb-access-token', 
        'sb-refresh-token', 
        'supabase-auth-token', 
        'sb-auth-token',
        // Clear all possible Supabase cookie names
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`,
      ];
      
      cookies.forEach(name => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; SameSite=Lax`;
        // Also try without domain for localhost
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      });
      
      console.log('🧹 Auth cookies cleared on logout');
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        console.log('🧹 Auth localStorage cleared');
      }
      
      console.log('✅ SignOut successful');
    } catch (err) {
      console.error('❌ SignOut failed:', err);
      // Still clear state even if signOut fails
      setUser(null);
      setStoreUser(null);
      setUsername(null);
      throw err;
    }
  };

  const signInAnonymously = async () => {
    // For guest/anonymous access without Supabase auth
    const guestUsername = `Guest_${Date.now()}`;
    setUser(null);
    setStoreUser(null);
    setUsername(guestUsername);
    setLoading(false);
  };

  const signInWithOAuth = async (provider: 'google') => {
    try {
      // CRITICAL: Supabase OAuth callback MUST be Supabase's own URL
      // NOT your custom domain callback!
      const isDevelopment = window.location.hostname === 'localhost';
      const callbackUrl = isDevelopment
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`;
      
      console.log(`🔐 Initiating ${provider} OAuth...`);
      console.log(`📍 Callback URL: ${callbackUrl}`);
      console.log(`🌍 Environment: ${isDevelopment ? 'development' : 'production'}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'consent',
          },
          skipBrowserRedirect: false, // Let Supabase handle redirect
        },
      });

      if (error) {
        console.error(`❌ ${provider} OAuth error:`, error);
        throw error;
      }
      
      console.log(`✅ ${provider} OAuth initiated:`, data);
      // Browser will be redirected to OAuth provider
    } catch (error) {
      console.error(`❌ Error signing in with ${provider}:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInAnonymously, signInWithOAuth, generateReferralCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
