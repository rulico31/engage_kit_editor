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
      // Ignore if input/textarea is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { undo, redo, deleteItems, groupItems, ungroupItems, updateItem } = usePageStore.getState();
      const { selectedIds } = useSelectionStore.getState();

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
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
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteItems(selectedIds);
        }
      }
      // Group: Ctrl+G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          groupItems(selectedIds);
        }
      }
      // Ungroup: Ctrl+Shift+G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          selectedIds.forEach(id => ungroupItems(id));
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