import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface AdminAuthState {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useAdminAuth(): AdminAuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (currentSession: Session | null) => {
    if (!currentSession || !isSupabaseConfigured) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', currentSession.user.id)
      .maybeSingle();

    setIsAdmin(!error && Boolean(data));
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void checkAdminRole(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void checkAdminRole(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return 'Supabase is not configured.';
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return error.message;
    }

    const { data: adminRow, error: adminErr } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (adminErr) {
      await supabase.auth.signOut();
      return `Database error checking admin role: ${adminErr.message}`;
    }

    if (!adminRow) {
      await supabase.auth.signOut();
      return `Account (${data.user.id}) is not in public.admin_users.`;
    }

    setIsAdmin(true);
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSession(null);
  };

  return { session, isAdmin, loading, signIn, signOut };
}
