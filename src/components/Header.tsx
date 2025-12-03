import React from "react";
import "./Header.css";
import type { ViewMode } from "../types";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";

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
  onEmbed: () => void;
}

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
  onEmbed,
}) => {
  return (
    <header className="editor-header">
      {/* 左側：ホームとタイトル */}
      <div className="header-left">
        <button className="home-button" onClick={onGoHome} title="ホームに戻る">
          <span style={{ fontSize: '18px' }}>⌂</span>
        </button>
        <div className="project-title">{projectName || "名称未設定プロジェクト"}</div>
      </div>

      {/* 中央：ビュー切り替えタブ */}
      <div className="header-center">
        <div className="view-mode-tabs">
          <button
            className={`view-mode-tab ${viewMode === "design" ? "active" : ""}`}
            onClick={() => onViewModeChange("design")}
          >
            デザイン
          </button>
          <button
            className={`view-mode-tab ${viewMode === "logic" ? "active" : ""}`}
            onClick={() => onViewModeChange("logic")}
          >
            ロジック
          </button>
          <button
            className={`view-mode-tab ${viewMode === "split" ? "active" : ""}`}
            onClick={() => onViewModeChange("split")}
          >
            分割
          </button>
          <button
            className={`view-mode-tab ${viewMode === "dashboard" ? "active" : ""}`}
            onClick={() => onViewModeChange("dashboard")}
          >
            集計
          </button>
        </div>
      </div>

      {/* 右側：アクション */}
      <div className="header-right">

        {/* PC/Mobile Switcher */}
        <div className="device-switcher" style={{ display: 'flex', marginRight: '16px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', width: '80px' }}>
          <button
            onClick={() => useEditorSettingsStore.getState().setIsMobileView(false)}
            style={{
              background: !useEditorSettingsStore.getState().isMobileView ? '#e0e0e0' : 'transparent',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            title="PCモード"
          >
            💻
          </button>
          <button
            onClick={() => useEditorSettingsStore.getState().setIsMobileView(true)}
            style={{
              background: useEditorSettingsStore.getState().isMobileView ? '#e0e0e0' : 'transparent',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            title="モバイルモード"
          >
            📱
          </button>
        </div>

        <button className="icon-button" onClick={onSave} title="下書き保存 (クラウド)">
          ☁️
        </button>

        <div className="separator" />

        {/* 全画面表示ボタン */}
        <button className="icon-button" onClick={onEnterFullscreen} title="全画面表示 (F11)">
          ⛶
        </button>

        <button
          className={`preview-toggle-button ${isPreviewing ? "is-previewing" : ""}`}
          onClick={onTogglePreview}
        >
          {isPreviewing ? (
            <>
              <span>■</span> 停止
            </>
          ) : (
            <>
              <span>▶</span> プレビュー
            </>
          )}
        </button>

        <button className="embed-button" onClick={onEmbed} title="埋め込みコードを取得">
          &lt;/&gt;
        </button>

        <button className="publish-button" onClick={onPublish}>
          公開する
        </button>
      </div>
    </header>
  );
};

export default Header;