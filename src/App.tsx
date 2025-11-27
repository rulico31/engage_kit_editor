// src/App.tsx

import React, { useState, useEffect } from "react";
// ★ 修正: 正しいコンポーネントをインポート
import HomeView from "./components/HomeView"; 
import EditorView from "./components/EditorView";
import ViewerHost from "./components/ViewerHost"; 
import BackgroundModal from "./components/BackgroundModal";
import { useProjectStore } from "./stores/useProjectStore";
import "./App.css";

type AppRoute = "home" | "editor" | "viewer";

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("home");
  const [viewerProjectId, setViewerProjectId] = useState<string | null>(null);

  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [backgroundTargetItemId, setBackgroundTargetItemId] = useState<string | null>(null);
  const [backgroundTargetSrc, setBackgroundTargetSrc] = useState<string | null>(null);

  const { currentProjectId, projectMeta, createProject, loadProject } = useProjectStore((state) => ({
    currentProjectId: state.currentProjectId,
    projectMeta: state.projectMeta,
    createProject: state.createProject,
    loadProject: state.loadProject,
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

  const handleOpenBackgroundModal = (itemId: string, src: string) => {
    setBackgroundTargetItemId(itemId);
    setBackgroundTargetSrc(src);
    setIsBackgroundModalOpen(true);
  };

  const handleCloseBackgroundModal = () => {
    setIsBackgroundModalOpen(false);
    setBackgroundTargetItemId(null);
    setBackgroundTargetSrc(null);
  };

  const handlePublish = async () => {
    if (!currentProjectId) return;
    const url = `${window.location.origin}?mode=view&project_id=${currentProjectId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(`公開用URLをクリップボードにコピーしました:\n${url}`);
    } catch (err) {
      console.error(err);
      alert(`公開用URL:\n${url}`);
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
            onOpenBackgroundModal={handleOpenBackgroundModal}
          />
          
          {isBackgroundModalOpen && backgroundTargetItemId && backgroundTargetSrc && (
            <BackgroundModal
              itemId={backgroundTargetItemId}
              imageSrc={backgroundTargetSrc}
              onClose={handleCloseBackgroundModal}
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