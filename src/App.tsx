// src/App.tsx

import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import HomeScreen from "./components/HomeScreen";
import Login from "./components/Auth/Login";
import type { ProjectData } from "./types";
import EditorView from "./components/EditorView";
import BackgroundPositionerModal from "./components/BackgroundPositionerModal";
import PublishModal from "./components/PublishModal";
import ViewerHost from "./components/ViewerHost"; // ★ 追加

// ★ Zustand ストアをインポート
import { useEditorSettingsStore } from "./stores/useEditorSettingsStore";
import { usePageStore } from "./stores/usePageStore";
import { useSelectionStore } from "./stores/useSelectionStore";
import { usePreviewStore } from "./stores/usePreviewStore";
import { useAuthStore } from "./stores/useAuthStore";
import { useProjectStore } from "./stores/useProjectStore"; 

function App() {
  const { user, isLoading, initializeAuth } = useAuthStore();
  const view = useEditorSettingsStore(state => state.view);
  const projectName = useEditorSettingsStore(state => state.projectName);
  const currentProjectId = useProjectStore(state => state.currentProjectId);

  // 背景画像モーダル
  const [bgModal, setBgModal] = React.useState({
    isOpen: false,
    itemId: null as string | null,
    src: null as string | null,
  });

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // ★ 追加: ビューワーモード判定用のステート
  const [viewerProjectId, setViewerProjectId] = useState<string | null>(null);

  useEffect(() => {
    // ★ URLルーティングの簡易実装
    // パスが "/view/プロジェクトID" の形式かチェック
    const path = window.location.pathname;
    const viewMatch = path.match(/^\/view\/(.+)$/);

    if (viewMatch && viewMatch[1]) {
      setViewerProjectId(viewMatch[1]);
    } else {
      // 通常の認証フローを開始
      initializeAuth();
    }
  }, [initializeAuth]);

  // --- 画面遷移・プロジェクト管理 ---

  const handleGoHome = useCallback(() => {
    if (window.confirm("ホームに戻ると、保存していない変更は失われます。よろしいですか？")) {
      usePageStore.getState().resetPages();
      useSelectionStore.getState().resetSelection();
      useEditorSettingsStore.getState().resetEditorSettings();
      usePreviewStore.getState().stopPreview();
      useProjectStore.getState().setCurrentProjectId(null);
      useEditorSettingsStore.getState().setView("home");
    }
  }, []);

  const handleExportProject = useCallback(() => {
    const { pages, pageOrder } = usePageStore.getState();
    const { variables } = usePreviewStore.getState();
    const projectName = useEditorSettingsStore.getState().projectName;
    const projectData: ProjectData = { projectName, pages, pageOrder, variables };
    
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "project"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;
        const firstPageId = data.pageOrder?.[0];
        
        if (data.pages && data.pageOrder && firstPageId) {
          usePageStore.getState().resetPages();
          useSelectionStore.getState().resetSelection();
          useEditorSettingsStore.getState().resetEditorSettings();
          usePreviewStore.getState().stopPreview();
          useProjectStore.getState().setCurrentProjectId(null);

          useEditorSettingsStore.getState().setProjectName(data.projectName || "無題のプロジェクト");
          usePageStore.getState().loadProjectData(data);
          usePreviewStore.getState().setVariables(data.variables || {});
          useEditorSettingsStore.getState().setView("editor");
        } else {
          alert("有効なページデータが見つかりませんでした。");
        }
      } catch (err) {
        console.error("プロジェクトの読み込みに失敗しました:", err);
        alert("プロジェクトファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, []);

  const handleOpenBackgroundModal = useCallback((itemId: string, src: string) => {
    if (!src) {
      alert("先に画像をアップロードしてください。");
      return;
    }
    setBgModal({ isOpen: true, itemId: itemId, src: src });
  }, []);
  
  const handleCloseBackgroundModal = useCallback(() => {
    setBgModal({ isOpen: false, itemId: null, src: null });
  }, []);

  const handleConfirmBackgroundModal = useCallback((newPosition: string, newSize: string) => {
    if (bgModal.itemId) {
      const { pages, selectedPageId } = usePageStore.getState();
      if (!selectedPageId) return;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return;
      
      const newPlacedItems = currentPage.placedItems.map(item => {
        if (item.id === bgModal.itemId) {
          return {
            ...item,
            data: { 
              ...item.data, 
              isArtboardBackground: true, 
              artboardBackgroundPosition: newPosition,
              artboardBackgroundSize: newSize
            }
          };
        } else if (item.data.isArtboardBackground) {
          return {
            ...item,
            data: { 
              ...item.data, 
              isArtboardBackground: false, 
              artboardBackgroundPosition: undefined,
              artboardBackgroundSize: undefined 
            }
          };
        }
        return item;
      });
      
      usePageStore.setState(state => ({
        pages: {
          ...state.pages,
          [selectedPageId!]: { ...currentPage, placedItems: newPlacedItems }
        }
      }));
    }
    setBgModal({ isOpen: false, itemId: null, src: null });
  }, [bgModal.itemId]);


  // --- レンダリング分岐 ---

  // ★ 1. ビューワーモードの場合 (認証不要で表示)
  if (viewerProjectId) {
    return <ViewerHost projectId={viewerProjectId} />;
  }

  // 2. ローディング中
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        height: '100vh', backgroundColor: '#1e1e1e', color: '#888' 
      }}>
        Loading...
      </div>
    );
  }

  // 3. 未ログイン時
  if (!user) {
    return <Login />;
  }

  // 4. ホーム画面
  if (view === "home") {
    return (
      <HomeScreen 
        onNewProject={() => {}} 
        onImportProject={handleImportProject} 
      />
    );
  }

  // 5. エディタ画面
  return (
    <>
      <EditorView
        projectName={projectName}
        onGoHome={handleGoHome}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onOpenBackgroundModal={handleOpenBackgroundModal}
        onPublish={() => setIsPublishModalOpen(true)}
      />
      
      {bgModal.isOpen && bgModal.src && (
        <BackgroundPositionerModal
          imageUrl={bgModal.src}
          onClose={handleCloseBackgroundModal}
          onConfirm={handleConfirmBackgroundModal} 
        />
      )}

      {isPublishModalOpen && (
        <PublishModal
          onClose={() => setIsPublishModalOpen(false)}
          projectId={currentProjectId}
        />
      )}
    </>
  );
}

export default App;