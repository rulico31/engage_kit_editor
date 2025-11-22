// src/stores/useAuthStore.ts

import create from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface AuthStoreState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  
  // --- Actions ---
  initializeAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ 
      session, 
      user: session?.user ?? null, 
      isLoading: false 
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ 
        session, 
        user: session?.user ?? null,
        isLoading: false
      });
    });
  },

  signInWithGoogle: async () => {
    // ★ 修正: redirectTo オプションを追加して、ログイン後の戻り先を明示
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // http://localhost:5173 に戻る
      },
    });
    if (error) {
      console.error("Google login error:", error.message);
      alert("Googleログインに失敗しました: " + error.message);
    }
  },

  signInWithEmail: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Email login error:", error.message);
      throw error;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error.message);
    }
  },
}));