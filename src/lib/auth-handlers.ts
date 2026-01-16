// Signup handler with direct user table insertion
import { createClient } from './src/lib/supabase/client.js';

const supabase = createClient();

export async function signUpUser(email, password, fullName) {
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'User',
          username: email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 8),
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'User creation failed' };
    }

    // Step 2: If auth user created, ensure profile exists
    // The trigger should handle this, but if it fails, we can retry
    const userId = authData.user.id;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      // Profile wasn't created by trigger, insert manually
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          username: email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 8),
          full_name: fullName || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail - auth user was created successfully
      }
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: error.message };
  }
}

// Login handler
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return { error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { error: error.message };
  }
}

// Logout handler
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: error.message };
  }
}

// Check auth status
export async function getAuthStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      authenticated: !!session,
      user: session?.user || null,
    };
  } catch (error) {
    console.error('Auth status error:', error);
    return { authenticated: false, user: null };
  }
}
