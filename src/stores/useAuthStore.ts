import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { authService } from '../lib/AuthService';
import { useToastStore } from './useToastStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  switchAccount: (provider: 'google' | 'microsoft') => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  // 認証状態の初期化
  initialize: () => {
    // セッションの取得
    authService.getSession().then((session) => {
      set({ user: session?.user ?? null, isInitialized: true });
    });

    // 認証状態の変化を監視
    authService.onAuthStateChange((user) => {
      set({ user });
    });
  },

  // Googleサインイン
  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      await authService.signInWithGoogle();
      // OAuth リダイレクトが発生するため、ここでのユーザー設定は不要
    } catch (error: any) {
      console.error('Google sign in failed:', error);
      useToastStore.getState().addToast('Googleログインに失敗しました', 'error');
      set({ isLoading: false });
    }
  },

  // Microsoftサインイン
  signInWithMicrosoft: async () => {
    set({ isLoading: true });
    try {
      await authService.signInWithMicrosoft();
      // OAuth リダイレクトが発生するため、ここでのユーザー設定は不要
    } catch (error: any) {
      console.error('Microsoft sign in failed:', error);
      useToastStore.getState().addToast('Microsoftログインに失敗しました', 'error');
      set({ isLoading: false });
    }
  },

  // アカウント切り替え（別のアカウントでログイン）
  switchAccount: async (provider: 'google' | 'microsoft') => {
    set({ isLoading: true });
    try {
      // 現在のセッションをログアウト
      await authService.signOut();

      // アカウント選択を強制してログイン
      if (provider === 'google') {
        await authService.signInWithGoogle(true);
      } else {
        await authService.signInWithMicrosoft(true);
      }
    } catch (error: any) {
      console.error('Account switch failed:', error);
      useToastStore.getState().addToast('アカウント切り替えに失敗しました', 'error');
      set({ isLoading: false });
    }
  },

  // サインアウト
  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, isLoading: false });
      useToastStore.getState().addToast('ログアウトしました', 'info');
    } catch (error: any) {
      console.error('Sign out failed:', error);
      useToastStore.getState().addToast('ログアウトに失敗しました', 'error');
      set({ isLoading: false });
    }
  },

  // ユーザー設定（内部使用）
  setUser: (user) => set({ user }),
}));
