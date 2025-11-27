import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SavedProject } from "../types";
import "./HomeView.css";

interface HomeViewProps {
  onCreateProject: (name: string) => void;
  onOpenProject: (id: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onCreateProject, onOpenProject }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // プロジェクト一覧の取得
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      // Supabaseから直接取得
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setProjects(data as SavedProject[]);
      } else {
        console.error("Failed to fetch projects", error);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName);
    setIsModalOpen(false);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("このプロジェクトを削除してもよろしいですか？")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="app-logo">EngageKit</h1>
      </div>

      <div className="home-content">
        <div className="projects-header">
          <h2>マイプロジェクト</h2>
          <button className="create-button" onClick={() => setIsModalOpen(true)}>
            + 新規作成
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">読み込み中...</div>
        ) : (
          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="empty-state">
                <p>プロジェクトがありません。新しく作成しましょう。</p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => onOpenProject(project.id)}
                >
                  <div className="project-card-preview">
                    <div className="placeholder-icon">📄</div>
                  </div>
                  <div className="project-card-footer">
                    <div className="project-name">{project.name}</div>
                    <div className="project-date">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                    <button 
                      className="delete-button"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>新規プロジェクト作成</h3>
            <form onSubmit={handleCreateSubmit}>
              <input
                type="text"
                className="modal-input"
                placeholder="プロジェクト名"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-button">
                  キャンセル
                </button>
                <button type="submit" className="submit-button" disabled={!newProjectName.trim()}>
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;