import React, { useState, useEffect } from "react";
import "./HomeView.css";
import { supabase } from "../lib/supabaseClient";
import ConfirmModal from "./ConfirmModal";

interface HomeViewProps {
  onCreateProject: (name: string, initialData?: any) => void;
  onOpenProject: (projectId: string) => void;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  page_count?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ onCreateProject, onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName);
    setIsCreateModalOpen(false);
    setNewProjectName("");
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreateSubmit();
    if (e.key === "Escape") setIsCreateModalOpen(false);
  };

  // 削除ボタンクリック (モーダルを開く)
  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  // 削除実行
  const executeDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete.id);

      if (error) throw error;

      // UI更新
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("プロジェクトの削除に失敗しました");
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="home-view">
      <div className="home-container">

        {/* ヘッダー */}
        <div className="home-header">
          <div className="brand-logo">EngageKit</div>
          <button className="create-project-btn" onClick={() => setIsCreateModalOpen(true)}>
            + 新規プロジェクト
          </button>
        </div>

        {/* プロジェクトリスト */}
        <div className="projects-grid">
          {isLoading ? (
            <div className="loading-state">読み込み中...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>プロジェクトがまだありません</p>
              <button onClick={() => setIsCreateModalOpen(true)}>最初のプロジェクトを作成</button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => onOpenProject(project.id)}
              >
                <div className="project-thumbnail">
                  {/* サムネイル機能は未実装のため、プレースホルダー */}
                  <div className="thumbnail-placeholder">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="project-info">
                  <div className="project-name">{project.name}</div>
                  <div className="project-meta">
                    <span>最終更新: {formatDate(project.updated_at)}</span>
                    <button
                      className="delete-project-btn"
                      onClick={(e) => handleDeleteClick(e, project)}
                      title="プロジェクトを削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 新規作成モーダル */}
        {isCreateModalOpen && (
          <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>新規プロジェクト作成</h3>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="プロジェクト名を入力"
                autoFocus
                onKeyDown={handleCreateKeyDown}
              />
              <div className="modal-actions">
                <button onClick={() => setIsCreateModalOpen(false)}>キャンセル</button>
                <button onClick={handleCreateSubmit} disabled={!newProjectName.trim()} className="primary">
                  作成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 削除確認モーダル */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="プロジェクトの削除"
          message={`「${projectToDelete?.name}」を完全に削除しますか？この操作は取り消せません。`}
          onConfirm={executeDeleteProject}
          onCancel={() => setIsDeleteModalOpen(false)}
          confirmLabel="削除する"
          isDanger={true}
        />

      </div>
    </div>
  );
};

export default HomeView;