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
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  linkWithGoogle: () => Promise<void>; // アカウント連携用
  signOut: () => Promise<void>;

  // --- Getters ---
  isAnonymous: boolean;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: false,

  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({
      session,
      user,
      isAnonymous: user?.is_anonymous ?? false,
      isLoading: false
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({
        session,
        user,
        isAnonymous: user?.is_anonymous ?? false,
        isLoading: false
      });
    });
  },

  signInAnonymously: async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous login error:", error.message);
      // alert("ゲストログインに失敗しました"); // 自動ログインなのでアラートは出さない方が良いかも
    }
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

  linkWithGoogle: async () => {
    // OAuth認証前の状態をセッションストレージに保存
    // プロジェクトIDを保存（グローバルストアから取得）
    if (typeof window !== 'undefined') {
      const projectStore = (window as any).__PROJECT_STORE__;
      if (projectStore?.currentProjectId) {
        sessionStorage.setItem('auth_return_project_id', projectStore.currentProjectId);
        console.log("💾 プロジェクトID保存:", projectStore.currentProjectId);
      }
    }

    console.log("🔗 Google連携を開始します...");

    // ★ 重要: 既存アカウント衝突時のエラーハンドリングは呼び出し元で行う前提
    const result = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // ルートに戻す
      }
    });

    // 詳細なデバッグログ
    console.log("📊 linkIdentity結果:", result);
    console.log("エラー:", result.error);
    console.log("データ:", result.data);

    if (result.error) {
      console.error("❌ Link identity error:", result.error);
      throw result.error;
    }

    // エラーがない場合でも、dataの内容を確認
    if (!result.data?.url) {
      console.warn("⚠️ リダイレクトURLが取得できませんでした。Supabaseの設定を確認してください。");
      console.warn("返り値:", JSON.stringify(result, null, 2));
      throw new Error("Google認証URLを取得できませんでした。Supabaseの設定（Googleプロバイダー、Manual Linking）を確認してください。");
    }

    console.log("✅ リダイレクト準備完了:", result.data.url);

    // デバッグ用alert
    alert("これからGoogleの認証ページにリダイレクトします。OKを押すと遷移します。\n\nURL: " + result.data.url);

    // 手動でGoogle認証ページにリダイレクト
    window.location.href = result.data.url;
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