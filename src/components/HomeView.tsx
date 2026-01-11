import React, { useState, useEffect } from "react";
import "./HomeView.css";
import { supabase } from "../lib/supabaseClient";
import ConfirmModal from "./ConfirmModal";
import { TemplateSelectionModal } from "./TemplateSelectionModal";
import { useAuthStore } from "../stores/useAuthStore";
import { AccountMenu } from "./Auth/AccountMenu";

interface HomeViewProps {
  onCreateProject: (name: string, initialData?: any) => void;
  onOpenProject: (projectId: string) => void;
  // onLoadFromJSON removed
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
  const [isProjectLoading, setIsProjectLoading] = useState(false); // プロジェクト読み込み中の状態
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Rename State
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // ユーザー情報を取得
  const user = useAuthStore(state => state.user);

  // アカウントメニューの状態
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq('user_id', user.id) // ★ 自分のが所有するプロジェクトのみ取得
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    setIsTemplateModalOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!newProjectName.trim()) return;

    let templateData = null;
    if (selectedTemplateId) {
      try {
        const module = await import(`../templates/${selectedTemplateId}.json`);
        templateData = module.default;
      } catch (e) {
        console.error('Failed to load template:', e);
      }
    }

    onCreateProject(newProjectName, templateData);
    setIsCreateModalOpen(false);
    setNewProjectName("");
    setSelectedTemplateId(null);
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

  // プロジェクトクリック時のハンドラ
  const handleProjectClick = (projectId: string) => {
    // ログインチェック
    if (!user) {
      alert('プロジェクトを開くには、GoogleまたはMicrosoftアカウントでログインしてください。');
      return;
    }

    setIsProjectLoading(true); // ローディング開始
    // 少し遅延させて視覚的なフィードバックを確実にする（UX向上）
    // 実際の読み込みはonOpenProject内で行われる
    requestAnimationFrame(() => {
      onOpenProject(projectId);
    });
  };

  // 削除実行
  const executeDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const projectId = projectToDelete.id;

      // 1. analytics_logsテーブルから関連データを削除
      const { error: analyticsError } = await supabase
        .from("analytics_logs")
        .delete()
        .eq("project_id", projectId);

      if (analyticsError) {
        console.error("Analytics logs deletion error:", analyticsError);
        // エラーでも続行（データがない場合もあるため）
      }

      // 2. leadsテーブルから関連データを削除
      const { error: leadsError } = await supabase
        .from("leads")
        .delete()
        .eq("project_id", projectId);

      if (leadsError) {
        console.error("Leads deletion error:", leadsError);
        // エラーでも続行
      }

      // 3. Storageからファイルを削除
      // プロジェクトフォルダ配下のすべてのファイルを削除
      try {
        // フォルダ内のファイル一覧を取得
        const { data: fileList, error: listError } = await supabase
          .storage
          .from("project-assets")
          .list(projectId);

        if (listError) {
          console.error("Storage file list error:", listError);
          // エラーでも続行（ファイルがない場合もあるため）
        } else if (fileList && fileList.length > 0) {
          // ファイルパスの配列を作成
          const filePaths = fileList.map(file => `${projectId}/${file.name}`);

          // 一括削除
          const { error: removeError } = await supabase
            .storage
            .from("project-assets")
            .remove(filePaths);

          if (removeError) {
            console.error("Storage files deletion error:", removeError);
            // エラーでも続行
          } else {
            console.log(`✅ Storageファイル削除成功: ${filePaths.length}件`);
          }
        }
      } catch (storageErr) {
        console.error("Storage deletion error:", storageErr);
        // エラーでも続行
      }

      // 4. プロジェクト本体を削除
      const { data, error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .select();

      if (error) throw error;

      // 実際に削除されたかを確認（dataが空またはnullの場合は削除失敗）
      if (!data || data.length === 0) {
        console.error("Delete failed: No rows affected");
        alert("プロジェクトの削除に失敗しました。権限がない可能性があります。");
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
        return;
      }

      // UI更新
      setProjects(projects.filter((p) => p.id !== projectId));
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);

      // 成功メッセージ
      console.log("✅ プロジェクトと関連データを完全に削除しました");
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("プロジェクトの削除に失敗しました");
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };



  // リネーム開始
  const handleRenameStart = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setRenamingProjectId(project.id);
    setRenameValue(project.name);
  };

  // リネーム実行
  const executeRename = async (projectId: string) => {
    if (!renameValue.trim() || renameValue === projects.find(p => p.id === projectId)?.name) {
      setRenamingProjectId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .update({ name: renameValue, updated_at: new Date().toISOString() })
        .eq("id", projectId);

      if (error) throw error;

      // UI更新
      setProjects(projects.map(p =>
        p.id === projectId ? { ...p, name: renameValue } : p
      ));
      setRenamingProjectId(null);
    } catch (err) {
      console.error("Error renaming project:", err);
      alert("プロジェクト名の変更に失敗しました");
    }
  };

  // リネーム入力のキーハンドラ
  const handleRenameKeyDown = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === "Enter") {
      executeRename(projectId);
    } else if (e.key === "Escape") {
      setRenamingProjectId(null);
    }
  };

  // スクロール検知用のstate
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 50);
  };

  return (
    <div className="home-view" onScroll={handleScroll}>
      <div className="home-container">

        {/* ヘッダー */}
        <div className={`home-header ${isScrolled ? 'scrolled' : ''}`}>
          <div className="brand-logo">EngageKit</div>

          {/* 右側のボタングループ */}
          <div className="header-actions">


            {/* 新規プロジェクトボタン */}
            <button
              className="create-project-btn"
              onClick={() => {
                if (!user) {
                  alert('プロジェクトを作成するには、GoogleまたはMicrosoftアカウントでログインしてください。');
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              title={!user ? 'ログインが必要です' : '新規プロジェクトを作成'}
            >
              + 新規プロジェクト
            </button>

            {/* 認証ボタン（Google/Microsoftログイン or ログアウト） */}
            {!user ? (
              <>
                <button
                  className="google-login-btn"
                  onClick={() => {
                    useAuthStore.getState().signInWithGoogle();
                  }}
                >
                  <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  Googleでログイン
                </button>

                <button
                  className="microsoft-login-btn"
                  onClick={() => {
                    useAuthStore.getState().signInWithMicrosoft();
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <rect width="9" height="9" fill="white" />
                    <rect x="11" width="9" height="9" fill="white" />
                    <rect y="11" width="9" height="9" fill="white" />
                    <rect x="11" y="11" width="9" height="9" fill="white" />
                  </svg>
                  Microsoftでログイン
                </button>
                <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#333', lineHeight: '1.5' }}>
                  ログインすることで、<a href="https://orange-ballcap-0b2.notion.site/2e486797b80a80d7838cd6b15a9fc9fd?source=copy_link" target="_blank" rel="noopener noreferrer" style={{ color: '#4A90E2', textDecoration: 'none' }}>利用規約</a> および <a href="https://orange-ballcap-0b2.notion.site/2de86797b80a8078b022eb07ec521ee8?source=copy_link" target="_blank" rel="noopener noreferrer" style={{ color: '#4A90E2', textDecoration: 'none' }}>プライバシーポリシー</a> に<br />同意したものとみなされます。
                </div>
              </>
            ) : (
              <>
                {/* ユーザー情報表示 */}
                <div
                  className="user-info-display clickable"
                  onClick={() => setIsAccountMenuOpen(true)}
                  title="アカウントを切り替える"
                >
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User avatar"
                      className="user-avatar-home"
                    />
                  )}
                  <span className="user-name-home">
                    {user.user_metadata?.name || user.email || 'ユーザー'}
                  </span>
                  {/* ドロップダウンアイコン */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {/* ログアウトボタン */}
                <button
                  className="logout-btn"
                  onClick={async () => {
                    if (confirm('ログアウトしますか？')) {
                      await useAuthStore.getState().signOut();
                      window.location.reload();
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  ログアウト
                </button>
              </>
            )}
          </div>
        </div>

        {/* プロジェクトリスト */}
        <div className="projects-grid">
          {isLoading ? (
            <div className="loading-state">読み込み中...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>プロジェクトがまだありません</p>
              <button onClick={() => {
                if (!user) {
                  alert('プロジェクトを作成するには、GoogleまたはMicrosoftアカウントでログインしてください。');
                  return;
                }
                setIsCreateModalOpen(true);
              }}>
                最初のプロジェクトを作成
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="project-thumbnail">
                  {/* サムネイル機能は未実装のため、プレースホルダー */}
                  <div className="thumbnail-placeholder">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="project-info">
                  {renamingProjectId === project.id ? (
                    <input
                      type="text"
                      className="project-name-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => executeRename(project.id)}
                      onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <div className="project-name">
                      {project.name}
                    </div>
                  )}
                  <div className="project-meta">
                    <span>最終更新: {formatDate(project.updated_at)}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="rename-project-btn"
                        onClick={(e) => handleRenameStart(e, project)}
                        title="プロジェクト名を変更"
                      >
                        ✏️
                      </button>
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

        {/* 全画面ローディングオーバーレイ */}
        {isProjectLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-logo">EngageKit</div>
              <div className="loading-spinner"></div>
              <div className="loading-text">Editorを起動中...</div>
            </div>
          </div>
        )}

        {/* テンプレート選択モーダル */}
        {isTemplateModalOpen && (
          <TemplateSelectionModal
            onClose={() => setIsTemplateModalOpen(false)}
            onSelectTemplate={handleTemplateSelect}
          />
        )}

        {/* アカウント切り替えメニュー */}
        {isAccountMenuOpen && user && (
          <AccountMenu
            user={user}
            onClose={() => setIsAccountMenuOpen(false)}
          />
        )}

      </div>
    </div>
  );
};

export default HomeView;