import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

/**
 * AuthService
 * Supabase OAuth認証（Google & Microsoft）を管理するサービス
 */
class AuthService {
    /**
     * Googleアカウントでサインイン
     * @param forceAccountSelection - trueの場合、必ずアカウント選択画面を表示
     */
    async signInWithGoogle(forceAccountSelection: boolean = false): Promise<void> {
        const options: any = {
            redirectTo: window.location.origin,
        };

        // アカウント選択を強制する場合
        if (forceAccountSelection) {
            options.queryParams = {
                prompt: 'select_account',
            };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options,
        });

        if (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    /**
     * Microsoftアカウントでサインイン
     * @param forceAccountSelection - trueの場合、必ずアカウント選択画面を表示
     */
    async signInWithMicrosoft(forceAccountSelection: boolean = false): Promise<void> {
        const options: any = {
            redirectTo: window.location.origin,
            scopes: 'email',
        };

        // アカウント選択を強制する場合
        if (forceAccountSelection) {
            options.queryParams = {
                prompt: 'select_account',
            };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options,
        });

        if (error) {
            console.error('Microsoft sign-in error:', error);
            throw error;
        }
    }

    /**
     * サインアウト
     */
    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * 現在のユーザーを取得
     */
    getCurrentUser(): User | null {
        const { data: { user } } = supabase.auth.getUser() as unknown as { data: { user: User | null } };
        return user;
    }

    /**
     * 現在のセッションを取得
     */
    async getSession(): Promise<Session | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }

    /**
     * 認証状態を確認
     */
    isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    }

    /**
     * 認証状態の変化を監視
     */
    onAuthStateChange(callback: (user: User | null) => void): () => void {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                callback(session?.user ?? null);
            }
        );

        // クリーンアップ関数を返す
        return () => {
            subscription.unsubscribe();
        };
    }
}

export const authService = new AuthService();
