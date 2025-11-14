// src/components/Header.tsx

import React, { useState, useEffect, useCallback } from "react";
import "./Header.css";

import { HomeIcon } from "./icons/HomeIcon";
import { SaveIcon } from "./icons/SaveIcon";
import { UploadIcon } from "./icons/UploadIcon";
import { PlayIcon } from "./icons/PlayIcon";
import { StopIcon } from "./icons/StopIcon";
import { MaximizeIcon } from "./icons/MaximizeIcon";
import { MinimizeIcon } from "./icons/MinimizeIcon";

// ★ この型定義のエクスポートが必要です！
export type ViewMode = "design" | "logic" | "split";

interface HeaderProps {
  projectName: string;
  isPreviewing: boolean;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePreview: () => void;
  
  // ViewMode型を使用
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  isPreviewing,
  onGoHome,
  onExportProject,
  onImportProject,
  onTogglePreview,
  viewMode,
  onViewModeChange,
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
            <button className="header-button" onClick={onExportProject}>
              <SaveIcon className="header-icon" /> 保存
            </button>
            <input
              type="file"
              id="import-project-input-header"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={onImportProject}
            />
            <label htmlFor="import-project-input-header" className="header-button">
              <UploadIcon className="header-icon" /> 読込
            </label>
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