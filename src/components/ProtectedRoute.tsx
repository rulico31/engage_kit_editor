import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    onRedirect: () => void;
}

/**
 * ProtectedRoute
 * 認証済みユーザーのみアクセス可能なルートを保護するコンポーネント
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onRedirect }) => {
    const { user, isInitialized } = useAuthStore();

    useEffect(() => {
        // 初期化完了後、未認証の場合はリダイレクト
        if (isInitialized && !user) {
            onRedirect();
        }
    }, [isInitialized, user, onRedirect]);

    // 初期化中はローディング表示
    if (!isInitialized) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%)',
                color: '#e4e4e7',
            }}>
                <div style={{
                    fontSize: '48px',
                    fontWeight: '800',
                    marginBottom: '24px',
                    background: 'linear-gradient(to right, #fff 0%, #e0e7ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>
                    EngageKit
                </div>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderLeftColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // 未認証の場合は何も表示しない（リダイレクト処理はuseEffectで実行）
    if (!user) {
        return null;
    }

    // 認証済みの場合は子コンポーネントを表示
    return <>{children}</>;
};
