import React, { useState } from 'react';
import './AccountMenu.css';
import { useAuthStore } from '../../stores/useAuthStore';

interface AccountMenuProps {
    user: any;
    onClose: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ user, onClose }) => {
    const { switchAccount, signOut } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleSwitchGoogle = async () => {
        setIsLoading(true);
        await switchAccount('google');
        onClose();
    };

    const handleSwitchMicrosoft = async () => {
        setIsLoading(true);
        await switchAccount('microsoft');
        onClose();
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
        window.location.reload();
    };

    return (
        <div className="account-menu-overlay" onClick={onClose}>
            <div className="account-menu" onClick={(e) => e.stopPropagation()}>
                {/* 現在のアカウント情報 */}
                <div className="account-menu-header">
                    {user.user_metadata?.avatar_url && (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="User avatar"
                            className="account-menu-avatar"
                        />
                    )}
                    <div className="account-menu-info">
                        <div className="account-menu-name">
                            {user.user_metadata?.name || user.email || 'ユーザー'}
                        </div>
                        <div className="account-menu-email">{user.email}</div>
                    </div>
                </div>

                <div className="account-menu-divider" />

                {/* アカウント切り替えセクション */}
                <div className="account-menu-section">
                    <div className="account-menu-section-title">別のアカウントでログイン</div>

                    <button
                        className="account-menu-button google"
                        onClick={handleSwitchGoogle}
                        disabled={isLoading}
                    >
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        {isLoading ? '切り替え中...' : 'Googleアカウント'}
                    </button>

                    <button
                        className="account-menu-button microsoft"
                        onClick={handleSwitchMicrosoft}
                        disabled={isLoading}
                    >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                            <rect width="9" height="9" fill="white" />
                            <rect x="11" width="9" height="9" fill="white" />
                            <rect y="11" width="9" height="9" fill="white" />
                            <rect x="11" y="11" width="9" height="9" fill="white" />
                        </svg>
                        {isLoading ? '切り替え中...' : 'Microsoftアカウント'}
                    </button>
                </div>



                <div className="account-menu-divider" />

                {/* サポート・お問い合わせ */}
                <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfPC-HSe-lJToJank0irAG_3MDQKOIdCKnFTZZ5Jyd2jJqkfg/viewform?usp=dialog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="account-menu-button"
                    style={{ textDecoration: 'none', color: '#e4e4e7' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    サポート・不具合報告
                </a>

                <div className="account-menu-divider" />

                {/* ログアウトボタン */}
                <button className="account-menu-button logout" onClick={handleSignOut}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    ログアウト
                </button>
            </div>
        </div>
    );
};
