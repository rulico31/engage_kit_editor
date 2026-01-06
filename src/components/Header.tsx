import React from "react";
import "./Header.css";
import type { ViewMode } from "../types";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePageStore } from "../stores/usePageStore";
import { usePreviewStore } from "../stores/usePreviewStore";
import { useAuthStore } from "../stores/useAuthStore";

interface HeaderProps {
  projectName: string;
  isPreviewing: boolean;
  onGoHome: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
  onEnterFullscreen: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPublish: () => void;
  onOpenSettings: () => void;
}

const IconUndo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
  </svg>
);

const IconRedo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 14 5-5-5-5" /><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
  </svg>
);

const IconDesktop = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const IconMobile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
  </svg>
);

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconCloud = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" /><path d="M20 19c0-3.314-2.686-6-6-6s-6 2.686-6 6" /><path d="M20 19v-2a7 7 0 0 0-14 0v2" /><path d="M12 13V4" /><path d="m8 8 4-4 4 4" />
  </svg>
);

const IconMaximize = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconStop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m5.2-13.8-4.2 4.2m-5.6 5.6-4.2 4.2M23 12h-6m-6 0H5m13.8-5.2-4.2 4.2m-5.6 5.6-4.2 4.2" />
  </svg>
);

const Header: React.FC<HeaderProps> = ({
  projectName,
  isPreviewing,
  onGoHome,
  onSave,
  onTogglePreview,
  onEnterFullscreen,
  viewMode,
  onViewModeChange,
  onPublish,
  onOpenSettings,
}) => {
  const { undo, redo, canUndo, canRedo } = usePageStore(state => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo
  }));

  const { user, signOut } = useAuthStore();

  const isMobileView = useEditorSettingsStore((state) => state.isMobileView);
  const setIsMobileView = useEditorSettingsStore((state) => state.setIsMobileView);

  // デバッグ: userの状態を確認
  console.log('Header - user:', user);

  // ログアウト処理
  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      onGoHome(); // ホームに戻る
    }
  };

  return (
    <header className="editor-header">
      {/* 左側：ホームとタイトル */}
      <div className="header-left">
        <button className="icon-button-ghost" onClick={onGoHome} title="ホームに戻る">
          <IconHome />
        </button>
        <div className="project-title-group">
          <div className="project-title">{projectName || "名称未設定プロジェクト"}</div>
        </div>

        <div className="history-controls-group">
          <button
            className="icon-button-ghost"
            onClick={undo}
            disabled={!canUndo}
            title="元に戻す (Ctrl+Z)"
          >
            <IconUndo />
          </button>
          <button
            className="icon-button-ghost"
            onClick={redo}
            disabled={!canRedo}
            title="やり直し (Ctrl+Y)"
          >
            <IconRedo />
          </button>
        </div>
      </div>

      {/* 中央：ビュー切り替えタブ */}
      <div className="header-center">
        <div className="view-mode-tabs">
          {([{ key: 'design', label: 'デザイン' }, { key: 'logic', label: 'ロジック' }, { key: 'split', label: '分割' }, { key: 'dashboard', label: '集計' }] as const).map(mode => (
            <button
              key={mode.key}
              className={`view-mode-tab ${viewMode === mode.key ? "active" : ""}`}
              onClick={() => onViewModeChange(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 右側：アクション */}
      <div className="header-right">
        {/* Device Switcher */}
        <div className="device-switcher-group">
          <button
            className={`device-switch-btn ${!isMobileView ? 'active' : ''}`}
            onClick={() => {
              // PCモードへ切り替え
              if (!isMobileView) return; // 既にPCなら何もしない
              setIsMobileView(false);

              if (isPreviewing) {
                usePreviewStore.getState().updateLayoutForViewMode(false);
              }
            }}
            title="PCモード"
          >
            <IconDesktop />
          </button>
          <button
            className={`device-switch-btn ${isMobileView ? 'active' : ''}`}
            onClick={() => {
              // モバイルモードへ切り替え
              if (isMobileView) return; // 既にモバイルなら何もしない

              // 1. レイアウト自動計算（未設定アイテムのみ）
              usePageStore.getState().syncMobileLayouts();

              // 2. ビュー切り替え
              setIsMobileView(true);

              // 3. プレビュー中はレイアウト更新
              if (isPreviewing) {
                usePreviewStore.getState().updateLayoutForViewMode(true);
              }
            }}
            title="モバイルモード"
          >
            <IconMobile />
          </button>
        </div>

        <button className="icon-button-ghost" onClick={onSave} title="下書き保存">
          <IconCloud />
        </button>

        <button className="icon-button-ghost" onClick={onOpenSettings} title="プロジェクト設定">
          <IconSettings />
        </button>

        <div className="separator" />

        <button className="icon-button-ghost" onClick={onEnterFullscreen} title="全画面表示 (F11)">
          <IconMaximize />
        </button>

        <button
          className={`preview-toggle-button ${isPreviewing ? "is-previewing" : ""}`}
          onClick={onTogglePreview}
        >
          {isPreviewing ? <><IconStop /> <span>停止</span></> : <><IconPlay /> <span>プレビュー</span></>}
        </button>

        <button className="publish-button" onClick={onPublish}>
          公開
        </button>

        {/* ユーザー情報とログアウト */}
        {user && (
          <>
            <div className="separator" />
            <div className="user-info">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User avatar"
                  className="user-avatar"
                />
              )}
              <span className="user-name">
                {user.user_metadata?.name || user.email || 'ユーザー'}
              </span>
            </div>
            <button
              className="icon-button-ghost logout-button"
              onClick={handleLogout}
              title="ログアウト"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header >
  );
};

export default Header;