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
    // (1) コンテナ名を変更し、中央寄せスタイルをCSS側で解除
    <div className="home-dashboard-container">
      {/* (2) ヘッダーを追加 */}
      <header className="home-header">
        <h1 className="home-header-title">
          Engage-Kit 🧩
        </h1>
        {/* (将来的にユーザーアイコンなどを配置) */}
      </header>

      {/* (3) メインコンテンツエリア */}
      <main className="home-main-content">
        
        {/* (A) ウェルカム/アクションエリア */}
        <section className="home-action-section">
          <h2>ようこそ、Engage-Kitへ</h2>
          <p>
            さっそく新しいプロジェクトを作成するか、
            <br />
            既存のプロジェクトを読み込んで編集を始めましょう。
          </p>
          
          {/* (既存のボタンをこちらに移動) */}
          <div className="home-action-buttons">
            <button
              className="home-button primary"
              onClick={onNewProject}
            >
              🚀 プロジェクトを新規作成
            </button>

            <input
              type="file"
              id="import-project-input-home"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={onLoadProject}
            />
            <label
              htmlFor="import-project-input-home"
              className="home-button"
            >
              📁 プロジェクトを読み込む
            </label>
          </div>
        </section>

        {/* (B) 将来のプロジェクト一覧エリア (プレースホルダー) */}
        <section className="home-projects-section">
          <div className="home-projects-header">
            <h3>最近のプロジェクト</h3>
            {/* (将来的に検索バーなどを配置) */}
          </div>
          <div className="home-projects-list-placeholder">
            <p>（ここには将来的に、保存されたプロジェクトの一覧がカード形式で表示されます）</p>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomeScreen;