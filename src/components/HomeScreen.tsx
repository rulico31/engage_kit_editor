// src/components/HomeScreen.tsx

import React, { useRef, useEffect } from "react";
import "./HomeScreen.css";
import { UploadIcon } from "./icons/UploadIcon";
import { useAuthStore } from "../stores/useAuthStore";
import { useProjectStore } from "../stores/useProjectStore";

interface HomeScreenProps {
  onNewProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewProject: _onNewProject, // ★ 修正: 未使用のため _ を付与
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuthStore();
  
  const { 
    savedProjects, 
    fetchProjects, 
    createProject, 
    loadProject, 
    deleteProject,
    isLoading 
  } = useProjectStore();

  // マウント時にプロジェクト一覧を取得
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  // 新規作成
  const handleNewClick = () => {
    const name = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    if (name) {
      createProject(name);
    }
  };

  // プロジェクトを開く
  const handleProjectClick = (id: string) => {
    loadProject(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProject(id);
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="home-screen-wrapper">
      {/* ダッシュボードヘッダー */}
      <header className="dashboard-header">
        <div className="dashboard-brand">Engage-Kit</div>
        <div className="dashboard-user-menu">
          <span className="user-email">{user?.email}</span>
          <button className="logout-button" onClick={signOut}>
            ログアウト
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="dashboard-main">
        <h2 className="dashboard-section-title">マイプロジェクト</h2>
        
        {isLoading && <div style={{color: '#888', padding: '20px'}}>読み込み中...</div>}

        <div className="project-grid">
          {/* 新規作成カード */}
          <div className="dashboard-card new-card" onClick={handleNewClick}>
            <div className="card-title" style={{ fontSize: '2em', color: '#007acc' }}>+</div>
            <div className="card-title">新規作成</div>
            <div className="card-desc">新しいプロジェクトを開始</div>
          </div>

          {/* 保存済みプロジェクト一覧 */}
          {savedProjects.map((project) => (
            <div 
              key={project.id} 
              className="dashboard-card project-card" 
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="card-icon-wrapper">
                📁
              </div>
              <div className="card-title">{project.name}</div>
              <div className="card-desc">最終更新: {formatDate(project.updated_at)}</div>
              
              <button 
                className="card-delete-button"
                onClick={(e) => handleDeleteClick(e, project.id)}
                title="削除"
              >
                ×
              </button>
            </div>
          ))}

          {/* インポートカード (末尾に配置) */}
          <div className="dashboard-card import-card" onClick={handleLoadClick}>
            <UploadIcon className="card-icon" />
            <div className="card-title">インポート</div>
            <div className="card-desc">ローカルファイル読込</div>
          </div>
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