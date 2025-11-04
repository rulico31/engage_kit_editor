// src/components/HomeScreen.tsx

import React from "react";
import "./HomeScreen.css";

// App.tsx から渡される関数の型
interface HomeScreenProps {
  onNewProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewProject,
  onLoadProject,
}) => {
  return (
    <div className="home-screen-container">
      <div className="home-screen-box">
        <h1 className="home-screen-title">
          Engage-Kit 🧩
        </h1>
        <p className="home-screen-subtitle">
          インタラクティブコンテンツ作成プラットフォーム
        </p>

        <div className="home-screen-buttons">
          {/* 1. 新規作成ボタン */}
          <button
            className="home-button primary"
            onClick={onNewProject}
          >
            🚀 プロジェクトを新規作成
          </button>

          {/* 2. 読み込みボタン (隠しinputと連携) */}
          <input
            type="file"
            id="import-project-input-home" // (App.tsxとIDを区別)
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={onLoadProject} // App.tsx の関数を呼ぶ
          />
          <label
            htmlFor="import-project-input-home"
            className="home-button"
          >
            📁 プロジェクトを読み込む
          </label>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;