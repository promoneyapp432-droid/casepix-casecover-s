import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchUserRole(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (authUser: User) => {
    try {
      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      if (error) throw error;

      const hasAdminRole = roles?.some(r => r.role === 'admin') || false;
      setIsAdmin(hasAdminRole);

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.name || authUser.email?.split('@')[0] || 'User',
        role: hasAdminRole ? 'admin' : 'user',
      });
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.email?.split('@')[0] || 'User',
        role: 'user',
      });
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setIsAdmin(false);
    }
    return { error };
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };
};
