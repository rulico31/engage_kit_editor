// src/components/Auth/AuthLinkModal.tsx

import React, { useState } from "react";
import "./AuthLinkModal.css";
import { useAuthStore } from "../../stores/useAuthStore";
import { usePageStore } from "../../stores/usePageStore";
import { useProjectStore } from "../../stores/useProjectStore";

interface AuthLinkModalProps {
    onClose: () => void;
}

const AuthLinkModal: React.FC<AuthLinkModalProps> = ({ onClose }) => {
    const { linkWithGoogle, signOut } = useAuthStore();
    const [conflictError, setConflictError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isLinking, setIsLinking] = useState(false);

    // Google連携ハンドラ
    const handleGoogleLink = async () => {
        setIsLinking(true);
        setErrorMessage(null);
        try {
            await linkWithGoogle();
            // 成功時はリダイレクトされるため、ここは基本通過しない
            console.log("✅ Google連携リクエスト送信完了（リダイレクト待ち）");
        } catch (error: any) {
            setIsLinking(false);
            console.error("❌ Link error:", error);

            // エラーの詳細をログ出力
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                status: error.status,
                fullError: error
            });

            // Manual Linking無効エラーを検出
            if (error.message?.includes("Manual linking is disabled") ||
                error.message?.includes("manual_linking_disabled")) {
                setConflictError(true);
                setErrorMessage(
                    "⚠️ アカウント連携機能が無効になっています。\n\n" +
                    "【解決方法】\n" +
                    "1. Supabaseダッシュボードを開く\n" +
                    "2. Authentication → Settings に移動\n" +
                    "3. 'Manual Linking Enabled' をONにする\n" +
                    "4. 画面をリロードして再度お試しください"
                );
                return;
            }

            // アカウント衝突エラーを検出
            if (error.message?.includes("linked") || error.message?.includes("already") || error.message?.includes("Identity is already linked")) {
                setConflictError(true);
                setErrorMessage("⚠️ このGoogleアカウントは既に他のユーザーに紐付いています。");
                return;
            }

            // その他のエラー
            setErrorMessage(
                `❌ 連携に失敗しました\n\n` +
                `エラー: ${error.message || "不明なエラー"}\n\n` +
                `【対処方法】\n` +
                `1. Supabaseの設定を確認してください\n` +
                `2. ブラウザのコンソール（F12）でエラー詳細を確認してください`
            );
        }
    };
    // JSONコピー（救済策）
    const handleCopyJson = () => {
        try {
            // 必要なストアの状態を収集してJSON化
            // ※ MVPでは PageStore (ページ、配置アイテム、ロジック) をメインに保存
            // ProjectStoreの情報 (メタデータ) も含める
            const pageState = usePageStore.getState();
            const projectMeta = useProjectStore.getState().projectMeta;

            const rescueData = {
                meta: projectMeta,
                pages: pageState.pages,
                pageOrder: pageState.pageOrder,
                savedAt: new Date().toISOString(),
                version: "rescue-v1"
            };

            const jsonString = JSON.stringify(rescueData, null, 2);
            navigator.clipboard.writeText(jsonString);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
        } catch (e) {
            console.error("Copy failed", e);
            alert("コピーに失敗しました。");
        }
    };

    // ログアウトして再ログイン
    const handleLogoutAndRestart = async () => {
        if (!window.confirm("現在のデータは失われますが、ログアウトしてよろしいですか？\n（必要な場合は先に『データをコピー』してください）")) {
            return;
        }
        await signOut();
        window.location.reload();
    };

    return (
        <div className="auth-link-modal-overlay" onClick={onClose}>
            <div className="auth-link-modal-content" onClick={e => e.stopPropagation()}>
                <button className="auth-link-close-btn" onClick={onClose}>×</button>

                {!conflictError ? (
                    /* --- 通常ビュー: 連携のお誘い --- */
                    <>
                        <h2 className="auth-link-title">アカウント登録をお願いします</h2>
                        <p className="auth-link-description">
                            作成したプロジェクトをクラウドに保存・公開するには、アカウント情報の紐付けが必要です。<br />
                            現在のデータを維持したまま、安全に登録できます。
                        </p>

                        <button className="google-btn" onClick={handleGoogleLink} disabled={isLinking}>
                            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            {isLinking ? "連携中..." : "Googleアカウントで連携"}
                        </button>

                        {errorMessage && <div style={{ color: '#ff4c4c', marginTop: 10, fontSize: '13px' }}>{errorMessage}</div>}
                    </>
                ) : (
                    /* --- 衝突エラービュー: 救済策 --- */
                    <>
                        <div className="conflict-alert">
                            <div className="conflict-title">⚠️ アカウント重複エラー</div>
                            このGoogleアカウントは既に登録済みです。<br />
                            セキュリティ上、現在の匿名データを自動的に結合することはできません。
                        </div>

                        <div className="conflict-actions">
                            <button className="action-btn" onClick={handleCopyJson}>
                                {copySuccess ? "✅ コピーしました！" : "📋 現在のデータをコピー (救済策)"}
                            </button>
                            <div style={{ fontSize: '11px', color: '#888', textAlign: 'left', marginBottom: 15 }}>
                                ※ データをJSON形式でクリップボードにコピーします。ログイン後、新規プロジェクトとしてインポートしてください。
                            </div>

                            <button className="action-btn danger" onClick={handleLogoutAndRestart}>
                                👋 ログアウトして再ログイン
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthLinkModal;
