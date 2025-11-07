// src/components/Header.tsx

import React, { useState, useEffect, useCallback } from "react";
import "./Header.css";

// (★ ご指摘どおり名前付きインポートを使用)
import { HomeIcon } from "./icons/HomeIcon";
import { SaveIcon } from "./icons/SaveIcon";
import { UploadIcon } from "./icons/UploadIcon";
import { PlayIcon } from "./icons/PlayIcon";
import { StopIcon } from "./icons/StopIcon";
import { MaximizeIcon } from "./icons/MaximizeIcon";
import { MinimizeIcon } from "./icons/MinimizeIcon";

interface HeaderProps {
  projectName: string;
  isPreviewing: boolean;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePreview: () => void;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  isPreviewing,
  onGoHome,
  onExportProject,
  onImportProject,
  onTogglePreview,
}) => {
  // (★ フルスクリーン状態の管理)
  const [isFullScreen, setIsFullScreen] = useState(false);

  // (★ フルスクリーンAPIのトグル)
  const handleToggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // (★ フルスクリーン状態の変更を監視)
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
      {/* (左側: タイトルとホームボタン) */}
      <div className="header-left">
        <h1 className="header-title">
          Engage-Kit <span>/ {projectName}</span>
        </h1>
        {/* ↓↓↓↓↓↓↓↓↓↓ (★ 修正) ホームボタンを .header-left に配置 ↓↓↓↓↓↓↓↓↓↓ */}
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
        {/* ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑ */}
      </div>

      {/* (右側: その他のアクションボタン) */}
      <div className="header-right">
        {/* (★ 修正) ホームボタンと区切り線を .header-left に移動したため、ここからは削除 */}

        {!isPreviewing && (
          <>
            <button
              className="header-button"
              onClick={onExportProject}
              title="プロジェクトを保存"
            >
              <SaveIcon className="header-icon" />
              保存
            </button>
            <input
              type="file"
              id="import-project-input-header"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={onImportProject}
            />
            <label
              htmlFor="import-project-input-header"
              className="header-button"
              title="プロジェクトを読み込む"
            >
              <UploadIcon className="header-icon" />
              読込
            </label>
            <div className="header-separator"></div>
          </>
        )}

        {/* (プレビューボタン) */}
        <button
          onClick={onTogglePreview}
          className={`header-button ${
            isPreviewing ? "edit-button" : "preview-button"
          }`}
        >
          {isPreviewing ? (
            <StopIcon className="header-icon" />
          ) : (
            <PlayIcon className="header-icon" />
          )}
          {isPreviewing ? "編集に戻る" : "プレビュー"}
        </button>

        {/* (フルスクリーンボタン) */}
        <button
          className="header-button"
          onClick={handleToggleFullScreen}
          title={isFullScreen ? "全画面解除" : "全画面表示"}
        >
          {isFullScreen ? (
            <MinimizeIcon className="header-icon" />
          ) : (
            <MaximizeIcon className="header-icon" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;