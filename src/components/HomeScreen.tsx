// src/components/HomeScreen.tsx
import React, { useRef } from "react";
import "./HomeScreen.css";
import { UploadIcon } from "./icons/UploadIcon";

interface HomeScreenProps {
  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) (projectName: string) => void から () => void へ変更 ↓↓↓↓↓↓↓↓↓↓
  onNewProject: () => void;
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewProject,
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewClick = () => {
    // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) promptロジックを削除し、コールバックを引数なしで呼び出す ↓↓↓↓↓↓↓↓↓↓
    // const projectName = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    // if (projectName) {
    //   onNewProject(projectName);
    // }
    onNewProject();
    // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="home-screen-wrapper">
      <header className="home-header">
        <h1>Engage-Kit</h1>
        <p>インタラクティブコンテンツ・プラットフォーム</p>
      </header>
      <main className="home-main-content">
        <h2>プロジェクト管理</h2>
        <div className="project-actions">
          <button className="action-card new-project" onClick={handleNewClick}>
            <h3>+ 新規プロジェクト作成</h3>
            <p>新しいプロジェクトを開始します。</p>
          </button>

          <button className="action-card load-project" onClick={handleLoadClick}>
            <UploadIcon className="header-icon" />
            <h3>プロジェクトを読込</h3>
            <p>ローカルの .json ファイルから作業を再開します。</p>
          </button>
        </div>
      </main>

      {/* 読込ボタン用の非表示ファイル入力 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json,application/json"
        onChange={onImportProject}
      />
    </div>
  );
};

export default HomeScreen;