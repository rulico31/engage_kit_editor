// src/components/Header.tsx

import React, { useState, useEffect } from "react"; // (★ useState, useEffect をインポート)
import "./Header.css";

// (アイコンをインポート)
import { HomeIcon } from "./icons/HomeIcon";
import { SaveIcon } from "./icons/SaveIcon";
import { UploadIcon } from "./icons/UploadIcon";
import { PlayIcon } from "./icons/PlayIcon";
import { StopIcon } from "./icons/StopIcon";
// (★ 新しいアイコンをインポート)
import { MaximizeIcon } from "./icons/MaximizeIcon";
import { MinimizeIcon } from "./icons/MinimizeIcon";

// (App.tsx から渡される Props の型定義)
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
  // (★ フルスクリーン状態を管理する State)
  const [isFullScreen, setIsFullScreen] = useState(false);

  // (★ フルスクリーンAPIの変更を監視する Effect)
  useEffect(() => {
    // フルスクリーン状態が変更されたときに呼ばれるハンドラ
    const handleFullScreenChange = () => {
      // document.fullscreenElement が存在すればtrue, nullならfalse
      setIsFullScreen(!!document.fullscreenElement);
    };

    // イベントリスナーを追加
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    // クリーンアップ関数
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []); // (マウント時に一度だけ実行)

  // (★ フルスクリーン切り替えハンドラ)
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // (★) 全画面表示を開始
      // document.documentElement は <html> タグ (ページ全体) を指す
      document.documentElement.requestFullscreen().catch((err) => {
        // (エラーハンドリング: ユーザーが拒否した場合など)
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      // (★) 全画面表示を解除
      document.exitFullscreen();
    }
  };

  return (
    <header className="editor-header">
      {/* (1) 左側: タイトル */}
      <div className="header-left">
        <div className="header-title">
          Engage-Kit <span>/ {projectName}</span>
        </div>
      </div>

      {/* (2) 中央: (将来の拡張用スペース) */}
      <div className="header-center"></div>

      {/* (3) 右側: ボタン群 (★デザイン刷新) */}
      <div className="header-right">
        {/* (ホームに戻るボタン) */}
        <button onClick={onGoHome} className="header-button">
          <HomeIcon className="header-icon" />
          ホーム
        </button>

        {/* (★ 修正: セパレーターを CSS クラスに変更) */}
        <div className="header-separator"></div>

        {/* (編集モード中のボタン) */}
        {!isPreviewing && (
          <>
            {/* (保存ボタン) */}
            <button onClick={onExportProject} className="header-button">
              <SaveIcon className="header-icon" />
              保存
            </button>

            {/* (読込ボタン) */}
            <input
              type="file"
              id="import-project-input-header" // (IDを変更)
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={onImportProject}
            />
            <label htmlFor="import-project-input-header" className="header-button">
              <UploadIcon className="header-icon" />
              読込
            </label>
          </>
        )}

        {/* (プレビュー/編集に戻る ボタン) */}
        <button
          onClick={onTogglePreview}
          // (★ バグ修正: プレビュー中は無効化しないため、disabled 属性を削除)
          className={`header-button ${
            isPreviewing ? "edit-button" : "preview-button"
          }`}
        >
          {isPreviewing ? (
            <>
              <StopIcon className="header-icon" />
              編集に戻る
            </>
          ) : (
            <>
              <PlayIcon className="header-icon" />
              プレビュー
            </>
          )}
        </button>
        
        {/* (★ 新しいセパレーターとフルスクリーンボタンを追加) */}
        <div className="header-separator"></div>

        <button
          onClick={handleToggleFullScreen}
          className="header-button"
          // (ツールチップで機能名を説明)
          title={isFullScreen ? "全画面表示を解除" : "全画面表示"}
        >
          {isFullScreen ? (
            // (全画面中は「解除」アイコンを表示)
            <MinimizeIcon className="header-icon" />
          ) : (
            // (通常時は「全画面」アイコンを表示)
            <MaximizeIcon className="header-icon" />
          )}
          {/* (テキストラベルは不要) */}
        </button>
      </div>
    </header>
  );
};

export default Header;