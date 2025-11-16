// src/App.tsx

import React, { useCallback } from "react";
import "./App.css";
import HomeScreen from "./components/HomeScreen";
import type { ProjectData } from "./types";
import EditorView from "./components/EditorView";
import BackgroundPositionerModal from "./components/BackgroundPositionerModal";

// ★ Zustand ストアをインポート
import { useEditorSettingsStore } from "./stores/useEditorSettingsStore";
import { usePageStore } from "./stores/usePageStore";
import { useSelectionStore } from "./stores/useSelectionStore";
import { usePreviewStore } from "./stores/usePreviewStore";

function App() {
  // ★ App.tsx は、どのストアを購読する必要もない
  // ★ ただし、ストアのアクションをトリガーするために `getState` やフック外の `set` を使う

  // ★ 編集ストアからビューとプロジェクト名を取得（これはAppレベルで必要）
  const view = useEditorSettingsStore(state => state.view);
  const projectName = useEditorSettingsStore(state => state.projectName);
  
  // (★ 背景画像モーダル用のStateは、App.tsxに残す)
  const [bgModal, setBgModal] = React.useState({
    isOpen: false,
    itemId: null as string | null,
    src: null as string | null,
  });

  // --- (5) プロジェクト管理 (ストアを操作するよう変更) ---

  const resetAllStores = () => {
    usePageStore.getState().resetPages();
    useSelectionStore.getState().resetSelection();
    useEditorSettingsStore.getState().resetEditorSettings();
    usePreviewStore.getState().stopPreview();
  };

  const handleNewProject = useCallback(() => {
    const name = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    if (!name) return;
    
    resetAllStores(); // (view: "home" 以外をリセット)
    
    useEditorSettingsStore.getState().setProjectName(name);
    
    // PageStore に初期ページを作成
    usePageStore.getState().addPage("Page 1");
    
    useEditorSettingsStore.getState().setView("editor");
  }, []);

  const handleGoHome = useCallback(() => {
    if (window.confirm("ホームに戻ると、保存していない変更は失われます。よろしいですか？")) {
      resetAllStores();
      useEditorSettingsStore.getState().setView("home");
    }
  }, []);

  const handleExportProject = useCallback(() => {
    // 各ストアから最新の状態を取得してエクスポートデータを構築
    const { pages, pageOrder } = usePageStore.getState();
    const { variables } = usePreviewStore.getState(); // 変数はPreviewStoreが持つ
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
          // すべてのストアをリセット
          resetAllStores();
          
          // 取得したデータでストアを初期化
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

  // --- 背景画像モーダルのコールバック ---
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

  const handleConfirmBackgroundModal = useCallback((newPosition: string) => {
    if (bgModal.itemId) {
      
      // ★ 修正: エラーの原因となっていた updateItem 呼び出しを削除
      // usePageStore.getState().updateItem(bgModal.itemId, {
      //   data: {
      //     isArtboardBackground: true,
      //     artboardBackgroundPosition: newPosition,
      //   }
      // });
      
      // (★) このロジック (↓) が正解。
      // (1) ストアから現在のページ状態を取得
      const { pages, selectedPageId } = usePageStore.getState();
      if (!selectedPageId) return;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return;
      
      // (2) 新しい placedItems 配列を生成
      const newPlacedItems = currentPage.placedItems.map(item => {
        if (item.id === bgModal.itemId) {
          // これを背景にする
          return {
            ...item,
            data: { ...item.data, isArtboardBackground: true, artboardBackgroundPosition: newPosition }
          };
        } else if (item.data.isArtboardBackground) {
          // 他のアイテムは背景フラグを外す
          return {
            ...item,
            data: { ...item.data, isArtboardBackground: false, artboardBackgroundPosition: undefined }
          };
        }
        return item;
      });
      
      // (3) ストアの状態を直接更新
      usePageStore.setState(state => ({
        pages: {
          ...state.pages,
          [selectedPageId!]: {
            ...currentPage,
            placedItems: newPlacedItems,
          }
        }
      }));
    }
    setBgModal({ isOpen: false, itemId: null, src: null });
  }, [bgModal.itemId]);


  // --- (★ 変更) ContextProvider を削除 ---
  if (view === "home") {
    return <HomeScreen onNewProject={handleNewProject} onImportProject={handleImportProject} />;
  }

  return (
    <>
      <EditorView
        projectName={projectName}
        onGoHome={handleGoHome}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onOpenBackgroundModal={handleOpenBackgroundModal}
      />
      
      {bgModal.isOpen && bgModal.src && (
        <BackgroundPositionerModal
          imageUrl={bgModal.src}
          onClose={handleCloseBackgroundModal}
          onConfirm={handleConfirmBackgroundModal}
        />
      )}
    </>
  );
}

export default App;