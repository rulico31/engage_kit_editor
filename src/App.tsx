// src/App.tsx

import React, { useState, useEffect } from "react";
// ★ 修正: 正しいコンポーネントをインポート
import HomeView from "./components/HomeView";
import EditorView from "./components/EditorView";
import ViewerHost from "./components/ViewerHost";

import PublishModal from "./components/PublishModal";
import { useProjectStore } from "./stores/useProjectStore";
import { useSelectionStore } from "./stores/useSelectionStore";
import { usePageStore } from "./stores/usePageStore";
import "./App.css";

type AppRoute = "home" | "editor" | "viewer";

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("home");
  const [viewerProjectId, setViewerProjectId] = useState<string | null>(null);



  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const { currentProjectId, projectMeta, createProject, loadProject, saveProject } = useProjectStore((state) => ({
    currentProjectId: state.currentProjectId,
    projectMeta: state.projectMeta,
    createProject: state.createProject,
    loadProject: state.loadProject,
    saveProject: state.saveProject,
  }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("project_id");
    const mode = params.get("mode");

    if (pid && mode === "view") {
      setViewerProjectId(pid);
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

  const handleLoadFromJSON = async () => {
    await loadProject(); // 引数なしで呼び出すとローカルファイル選択ダイアログが開く
    setCurrentRoute("editor");
  };

  const handleGoHome = () => {
    setCurrentRoute("home");
  };



  const handlePublish = async () => {
    // 保存してからモーダルを開く (ID確定のため)
    try {
      await saveProject();
      setIsPublishModalOpen(true);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="App">
      {currentRoute === "home" && (
        <HomeView
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onLoadFromJSON={handleLoadFromJSON}
        />
      )}

      {currentRoute === "editor" && (
        <>
          <EditorView
            projectName={projectMeta?.name || ""}
            onGoHome={handleGoHome}
            onPublish={handlePublish}

          />



          {isPublishModalOpen && (
            <PublishModal
              projectId={currentProjectId}
              onClose={() => setIsPublishModalOpen(false)}
            />
          )}
        </>
      )}

      {currentRoute === "viewer" && viewerProjectId && (
        <ViewerHost projectId={viewerProjectId} />
      )}
    </div>
  );
};

export default App;