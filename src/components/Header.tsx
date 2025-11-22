// src/components/Header.tsx

import React, { useState, useEffect, useCallback } from "react";
import "./Header.css";

import { HomeIcon } from "./icons/HomeIcon";
// import { SaveIcon } from "./icons/SaveIcon"; 
// import { UploadIcon } from "./icons/UploadIcon"; // ★ 削除: 未使用のため
import { PlayIcon } from "./icons/PlayIcon";
import { StopIcon } from "./icons/StopIcon";
import { MaximizeIcon } from "./icons/MaximizeIcon";
import { MinimizeIcon } from "./icons/MinimizeIcon";
import { UndoIcon } from "./icons/UndoIcon";
import { RedoIcon } from "./icons/RedoIcon";
import { CodeIcon } from "./icons/CodeIcon"; 

import type { ViewMode } from "../types"; // ★ 変更: types.tsからインポート

// ★ 追加: クラウドアイコン（保存用）
const CloudIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 16.5a6 6 0 0 1-11.36 0 7 7 0 1 1 12.63-5.23A5 5 0 0 1 19 16.5z" />
    <polyline points="12 16.5 12 23.5 12 12.5" />
    <polyline points="15 15.5 12 12.5 9 15.5" />
  </svg>
);

// ★ ストアからアクションを取得するためのインポート
import { usePageStore } from "../stores/usePageStore";
import { useProjectStore } from "../stores/useProjectStore"; 

interface HeaderProps {
  projectName: string;
  isPreviewing: boolean;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePreview: () => void;
  
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  onPublish: () => void;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  isPreviewing,
  onGoHome,
  // ★ 修正: 未使用変数のエラー回避のため _ をつける (あるいは削除する)
  onExportProject: _onExportProject, 
  onImportProject: _onImportProject,
  onTogglePreview,
  viewMode,
  onViewModeChange,
  onPublish,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleToggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  // ★ Undo/Redoの状態とアクションを取得
  const { undo, redo, canUndo, canRedo } = usePageStore(state => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  }));

  // ★ クラウド保存アクションを取得
  const { saveProject, isSaving } = useProjectStore(state => ({
    saveProject: state.saveProject,
    isSaving: state.isSaving,
  }));

  return (
    <header className="app-header">
      {/* 左側 */}
      <div className="header-left">
        <h1 className="header-title">
          Engage-Kit <span>/ {projectName}</span>
        </h1>
        <div className="header-separator"></div>
        <button
          className="header-button"
          onClick={onGoHome}
          title="ホームに戻る"
          disabled={isPreviewing} 
        >
          <HomeIcon className="header-icon" />
          ホーム
        </button>
        
        {!isPreviewing && (
          <>
            <div className="header-separator"></div>
            <div className="history-controls">
              <button 
                className="header-button icon-only" 
                onClick={undo} 
                disabled={!canUndo}
                title="元に戻す (Ctrl+Z)"
              >
                <UndoIcon className="header-icon" />
              </button>
              <button 
                className="header-button icon-only" 
                onClick={redo} 
                disabled={!canRedo}
                title="やり直す (Ctrl+Shift+Z)"
              >
                <RedoIcon className="header-icon" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 中央: ビュー切り替え */}
      {!isPreviewing && (
        <div className="header-center">
          <div className="view-mode-group">
            <button
              className={`view-mode-btn ${viewMode === "design" ? "active" : ""}`}
              onClick={() => onViewModeChange("design")}
              title="デザインモード"
            >
              🎨 デザイン
            </button>
            <button
              className={`view-mode-btn ${viewMode === "logic" ? "active" : ""}`}
              onClick={() => onViewModeChange("logic")}
              title="ロジックモード"
            >
              🧠 ロジック
            </button>
            <button
              className={`view-mode-btn ${viewMode === "split" ? "active" : ""}`}
              onClick={() => onViewModeChange("split")}
              title="分割表示"
            >
              🖥️ 分割
            </button>
          </div>
        </div>
      )}

      {/* 右側 */}
      <div className="header-right">
        {!isPreviewing && (
          <>
            {/* クラウド保存ボタン */}
            <button 
              className="header-button" 
              onClick={saveProject}
              disabled={isSaving}
            >
              <CloudIcon className="header-icon" /> 
              {isSaving ? "保存中..." : "保存"}
            </button>

            {/* 埋め込みコード発行ボタン */}
            <button 
              className="header-button" 
              onClick={onPublish}
              title="埋め込みコードを発行"
            >
              <CodeIcon className="header-icon" />
              埋め込み
            </button>
            
            <div className="header-separator"></div>
          </>
        )}

        <button
          onClick={onTogglePreview}
          className={`header-button ${isPreviewing ? "edit-button" : "preview-button"}`}
        >
          {isPreviewing ? <StopIcon className="header-icon" /> : <PlayIcon className="header-icon" />}
          {isPreviewing ? "編集に戻る" : "プレビュー"}
        </button>

        <button className="header-button" onClick={handleToggleFullScreen}>
          {isFullScreen ? <MinimizeIcon className="header-icon" /> : <MaximizeIcon className="header-icon" />}
        </button>
      </div>
    </header>
  );
};

export default Header;