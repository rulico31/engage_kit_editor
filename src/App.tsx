// src/App.tsx

import React, { useState, useEffect } from "react";
// ★ 修正: 正しいコンポーネントをインポート
import HomeView from "./components/HomeView";
import EditorView from "./components/EditorView";
import ViewerHost from "./components/ViewerHost";
import { ProtectedRoute } from "./components/ProtectedRoute";

import PublishModal from "./components/PublishModal";
import { PublishWarningModal } from "./components/PublishWarningModal";
import { useProjectStore } from "./stores/useProjectStore";
import { useSelectionStore } from "./stores/useSelectionStore";
import { usePageStore } from "./stores/usePageStore";
import { useAuthStore } from "./stores/useAuthStore";
import { ToastContainer } from "./components/UI/Toast";
import { ValidationService } from "./lib/ValidationService";
import type { ValidationResult } from "./lib/ValidationService";
import "./App.css";

type AppRoute = "home" | "editor" | "viewer";

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("home");
  const [viewerProjectId, setViewerProjectId] = useState<string | null>(null);



  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidationWarningOpen, setIsValidationWarningOpen] = useState(false);

  const { currentProjectId, projectMeta, createProject, loadProject, saveProject } = useProjectStore((state) => ({
    currentProjectId: state.currentProjectId,
    projectMeta: state.projectMeta,
    createProject: state.createProject,
    loadProject: state.loadProject,
    saveProject: state.saveProject,
  }));

  // プロジェクトIDをグローバルに公開（OAuth認証前の状態保存用）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__PROJECT_STORE__ = { currentProjectId };
    }
  }, [currentProjectId]);

  // Auth check and Auto-Login
  useEffect(() => {
    const initAuth = async () => {
      const authStore = useAuthStore.getState();
      authStore.initialize();

      // 認証されていなければ匿名ログイン
      // ★ 一時的に無効化：Googleアカウントでログインするため
      /* 
      if (!useAuthStore.getState().user) {
        console.log("No user found, signing in anonymously...");
        try {
          await authStore.signInAnonymously();
          // 成功したか再確認
          const finalUser = useAuthStore.getState().user;
          if (finalUser) {
            console.log("✅ 匿名ログイン成功:", finalUser.id, "IsAnonymous:", useAuthStore.getState().isAnonymous);
          }
        } catch (error: any) {
          console.error("❌ 匿名ログインに失敗しました");
          console.error("エラー詳細:", error?.message || error);
          console.error("");
          console.error("📋 解決方法:");
          console.error("1. Supabaseダッシュボードを開く");
          console.error("2. Authentication → Providers に移動");
          console.error("3. 'Anonymous' プロバイダーをONにする");
          console.error("");
          console.error("💡 現在はローカル編集のみ可能です。公開・保存機能を使うには認証が必要です。");
        }
      } else {
      */
      if (useAuthStore.getState().user) {
        console.log("✅ User found:", useAuthStore.getState().user?.id);

        // OAuth認証から戻ってきた場合、保存されたプロジェクトIDを復元
        const savedProjectId = sessionStorage.getItem('auth_return_project_id');
        if (savedProjectId) {
          sessionStorage.removeItem('auth_return_project_id');
          console.log("📍 OAuth認証完了。プロジェクトを復元:", savedProjectId);

          // ローカルプロジェクト（local-で始まる）の場合は、Supabaseから読み込まない
          if (savedProjectId.startsWith('local-')) {
            console.log("ℹ️ ローカルプロジェクトのため、エディタ画面のみ復元します");
            setCurrentRoute('editor');
          } else {
            // クラウドプロジェクトの場合はSupabaseから読み込む
            setTimeout(async () => {
              await loadProject(savedProjectId);
              setCurrentRoute('editor');
            }, 100);
          }
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("project_id");
    const mode = params.get("mode");

    if (pid && mode === "view") {
      // プロジェクトIDから不要なクエリパラメータ部分を除去
      // 例: "abc-123?utm_source=google" → "abc-123"
      const cleanProjectId = pid.split('?')[0].trim();
      setViewerProjectId(cleanProjectId);
      setCurrentRoute("viewer");
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input/Textarea handling for Undo/Redo
      const activeElement = document.activeElement as HTMLElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (isInput) {
          // Force blur to save current state
          activeElement.blur();
          e.preventDefault();
          // Wait for blur to commit history, then undo
          setTimeout(() => {
            usePageStore.getState().undo();
          }, 50);
          return;
        }

        // Normal undo if not input
        e.preventDefault();
        usePageStore.getState().undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z (also works when input is focused)
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        if (isInput) {
          activeElement.blur();
        }
        e.preventDefault();
        usePageStore.getState().redo();
        return;
      }

      // Ignore other keys if input is focused (standard behavior)
      if (isInput) {
        return;
      }

      const { deleteItems, updateItem } = usePageStore.getState();
      const { selectedIds } = useSelectionStore.getState();
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentRoute === 'editor') {
          saveProject().catch(e => {
            console.error(e);
            alert("保存に失敗しました");
          });
        }
      }
      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // ノードエディタでノードが選択されている場合はスキップ
        const { tabs, activeTabId } = useSelectionStore.getState();
        const activeEntry = tabs.find(t => t.id === activeTabId);
        if (activeEntry && activeEntry.type === 'node') return;

        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteItems(selectedIds);
        }
      }


      // Arrow keys movement
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const shift = e.shiftKey ? 10 : 1;
          const updates = selectedIds.map(id => {
            const item = usePageStore.getState().pages[usePageStore.getState().selectedPageId!]?.placedItems.find(p => p.id === id);
            if (!item) return null;
            let { x, y } = item;
            if (e.key === 'ArrowUp') y -= shift;
            if (e.key === 'ArrowDown') y += shift;
            if (e.key === 'ArrowLeft') x -= shift;
            if (e.key === 'ArrowRight') x += shift;
            return { id, x, y };
          }).filter(Boolean);

          if (updates.length > 0) {
            // Batch update logic would be better but simple loop for now
            updates.forEach(u => u && updateItem(u.id, { x: u.x, y: u.y }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRoute, saveProject]);

  const handleCreateProject = async (name: string) => {
    await createProject(name);
    setCurrentRoute("editor");
  };

  const handleOpenProject = async (id: string) => {
    await loadProject(id);
    setCurrentRoute("editor");
  };



  const handleGoHome = () => {
    setCurrentRoute("home");
  };



  const handlePublish = async () => {
    // 1. プロジェクトデータの構築 (バリデーション用)
    const { pages, pageOrder } = usePageStore.getState();
    const { projectMeta } = useProjectStore.getState();

    const projectData = {
      projectName: projectMeta?.name || "無題",
      pages,
      pageOrder,
      variables: {}, // バリデーションに影響しないため空でOK
      cloud_id: projectMeta?.cloud_id
    } as any; // ValidationServiceは主にpagesを見るため、厳密な型合わせは省略

    // 2. ValidationServiceによる包括的チェック
    console.log('🧪 [handlePublish] Calling ValidationService.validate()...');
    const result = ValidationService.validate(projectData);
    console.log('📋 [handlePublish] Validation Result:', result);

    // 警告がある場合は警告モーダルを表示
    if (result.warnings.length > 0) {
      console.warn("⚠️ Validation warnings detected:", result.warnings);
      setValidationResult(result);
      setIsValidationWarningOpen(true);
      return;
    }

    // 警告がない場合は直接公開処理へ
    console.log('✅ [handlePublish] No validation warnings!');
    proceedToPublish();
  };

  const proceedToPublish = async () => {
    try {
      await saveProject();
      setIsValidationWarningOpen(false);
      setIsPublishModalOpen(true);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました");
    }
  };

  const handleProceedWithWarnings = () => {
    console.log('⚠️ User chose to proceed despite warnings');
    proceedToPublish();
  };

  const handleCloseValidationWarning = () => {
    setIsValidationWarningOpen(false);
    setValidationResult(null);
  };

  return (
    <div className="App">
      {currentRoute === "home" && (
        <HomeView
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
        />
      )}

      {currentRoute === "editor" && (
        <ProtectedRoute onRedirect={handleGoHome}>
          <>
            <EditorView
              projectName={projectMeta?.name || ""}
              onGoHome={handleGoHome}
              onPublish={handlePublish}

            />



            {isValidationWarningOpen && validationResult && (
              <PublishWarningModal
                validationResult={validationResult}
                projectData={{ pages: usePageStore.getState().pages }}
                onClose={handleCloseValidationWarning}
                onProceed={handleProceedWithWarnings}
              />
            )}

            {isPublishModalOpen && (
              <PublishModal
                projectId={currentProjectId}
                onClose={() => setIsPublishModalOpen(false)}
              />
            )}
          </>
        </ProtectedRoute>
      )}

      {currentRoute === "viewer" && viewerProjectId && (
        <ViewerHost projectId={viewerProjectId} />
      )}

      {/* トースト通知コンテナ */}
      <ToastContainer />

      {/* 404 Fallback - ルートにマッチしない場合 */}
      {!["home", "editor", "viewer"].includes(currentRoute) && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h1>404 Not Found</h1>
          <p>お探しのページは見つかりませんでした。</p>
          <button onClick={handleGoHome}>ホームに戻る</button>
        </div>
      )}
    </div>
  );
};

export default App;