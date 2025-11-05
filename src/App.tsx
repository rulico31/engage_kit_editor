// src/App.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import "./App.css";

import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  type OnConnect,
} from "reactflow";

import Artboard from "./components/Artboard";
import ToolboxItem from "./components/ToolboxItem";
import PropertiesPanel from "./components/PropertiesPanel";
import NodeEditor from "./components/NodeEditor";
import type {
  PlacedItemType,
  PreviewState,
  PreviewItemState,
  NodeGraph,
  PageData,
  ProjectData,
  PageInfo,
} from "./types";
import HomeScreen from "./components/HomeScreen";
import ProjectNameModal from "./components/ProjectNameModal";
import PreviewHost from "./components/PreviewHost";
import ContentBrowser from "./components/ContentBrowser";
// (★ 新規: Header コンポーネントをインポート)
import Header from "./components/Header";

// (テンプレート定義は変更なし)
const NODE_GRAPH_TEMPLATES: Record<string, NodeGraph> = {
  "ボタン": {
    nodes: [{
      id: "btn-click",
      type: "eventNode",
      data: { label: "🎬 イベント: ボタンがクリックされた時" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "テキスト": {
    nodes: [{
      id: "text-load",
      type: "eventNode",
      data: { label: "🎬 イベント: テキスト表示時" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "画像": {
    nodes: [{
      id: "img-load",
      type: "eventNode",
      data: { label: "🎬 イベント: 画像読み込み完了時" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "Default": {
    nodes: [{
      id: "default-load",
      type: "eventNode",
      data: { label: "🎬 イベント: ページ読み込み時" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
};

// (新規) デフォルトのページを作成するヘルパー関数
const createDefaultPage = (name: string): PageData => {
  const pageId = `page-${Date.now()}`;
  return {
    id: pageId,
    name: name,
    placedItems: [],
    allItemLogics: {},
  };
};

function App() {
  // --- (2) State (モーダルとプロジェクト名を追加) ---
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [projectName, setProjectName] = useState<string>("Untitled Project");

  // --- (State構造を全面的に変更) ---
  const [pages, setPages] = useState<Record<string, PageData>>({});
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // (選択状態の State は変更なし)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);

  // --- (プレビューモード用の State を変更) ---
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewItemsState, setPreviewItemsState] = useState<Record<string, PreviewState>>({});

  // --- (3) 選択中ページ/アイテム/ノードの情報を計算 (変更) ---
  const currentPageData: PageData | undefined = selectedPageId
    ? pages[selectedPageId]
    : undefined;

  const pageInfoList: PageInfo[] = useMemo(() => {
    return pageOrder.map((id) => ({ id: id, name: pages[id]?.name || "Error" }));
  }, [pages, pageOrder]);

  const currentPlacedItems = currentPageData?.placedItems;
  const currentAllItemLogics = currentPageData?.allItemLogics;
  
  const selectedItem =
    currentPlacedItems?.find((item) => item.id === selectedItemId) || null;
  const currentGraph: NodeGraph | undefined = activeLogicGraphId
    ? currentAllItemLogics?.[activeLogicGraphId]
    : undefined;
  
  const currentPreviewState: PreviewState | undefined = selectedPageId
    ? previewItemsState[selectedPageId]
    : undefined;


  // --- (4) 更新用コールバック関数 (全面的な書き換え) ---

  const handlePlacedItemsChange = useCallback(
    (newItems: PlacedItemType[] | ((prev: PlacedItemType[]) => PlacedItemType[])) => {
      if (!selectedPageId) return;

      setPages((prevPages) => {
        const currentPage = prevPages[selectedPageId];
        if (!currentPage) return prevPages;
        
        const oldItems = currentPage.placedItems;
        const updatedItems = typeof newItems === "function" ? newItems(oldItems) : newItems;

        return {
          ...prevPages,
          [selectedPageId]: {
            ...currentPage,
            placedItems: updatedItems,
          },
        };
      });
    },
    [selectedPageId]
  );
  
  const handleAllItemLogicsChange = useCallback(
    (newLogics: Record<string, NodeGraph> | ((prev: Record<string, NodeGraph>) => Record<string, NodeGraph>)) => {
      if (!selectedPageId) return;

      setPages((prevPages) => {
        const currentPage = prevPages[selectedPageId];
        if (!currentPage) return prevPages;
        
        const oldLogics = currentPage.allItemLogics;
        const updatedLogics = typeof newLogics === "function" ? newLogics(oldLogics) : newLogics;

        return {
          ...prevPages,
          [selectedPageId]: {
            ...currentPage,
            allItemLogics: updatedLogics,
          },
        };
      });
    },
    [selectedPageId]
  );

  const handleItemUpdate = (itemId: string, updatedProps: Partial<PlacedItemType>) => {
    handlePlacedItemsChange((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, ...updatedProps }
          : item
      )
    );
  };
  
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    if (!activeLogicGraphId || !selectedPageId) return;
    
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;
      
      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      
      return {
        ...prevPages,
        [selectedPageId]: {
          ...currentPage,
          allItemLogics: {
            ...currentPage.allItemLogics,
            [activeLogicGraphId]: {
              ...currentGraph,
              nodes: newNodes,
            },
          },
        },
      };
    });
  }, [activeLogicGraphId, selectedPageId]);
  
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    if (!activeLogicGraphId || !selectedPageId) return;

    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;
      
      const newEdges = applyEdgeChanges(changes, currentGraph.edges);

      return {
        ...prevPages,
        [selectedPageId]: {
          ...currentPage,
          allItemLogics: {
            ...currentPage.allItemLogics,
            [activeLogicGraphId]: {
              ...currentGraph,
              edges: newEdges,
            },
          },
        },
      };
    });
  }, [activeLogicGraphId, selectedPageId]);
  
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!activeLogicGraphId || !selectedPageId) return; 
    
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;
      
      const newEdges = addEdge(connection, currentGraph.edges);

      return {
        ...prevPages,
        [selectedPageId]: {
          ...currentPage,
          allItemLogics: {
            ...currentPage.allItemLogics,
            [activeLogicGraphId]: {
              ...currentGraph,
              edges: newEdges,
            },
          },
        },
      };
    });
  }, [activeLogicGraphId, selectedPageId]);
  
  const handleAddNode = useCallback((newNode: Node) => {
    if (!activeLogicGraphId || !selectedPageId) return;

    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;
      
      return {
        ...prevPages,
        [selectedPageId]: {
          ...currentPage,
          allItemLogics: {
            ...currentPage.allItemLogics,
            [activeLogicGraphId]: {
              ...currentGraph,
              nodes: [...currentGraph.nodes, newNode],
            },
          },
        },
      };
    });
  }, [activeLogicGraphId, selectedPageId]);
  
  const handleNodeDataChange = useCallback((nodeId: string, dataUpdate: any) => {
      if (!activeLogicGraphId || !selectedPageId) return;

      setPages((prevPages) => {
        const currentPage = prevPages[selectedPageId];
        const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
        if (!currentGraph) return prevPages;

        const newNodes = currentGraph.nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...dataUpdate } };
          }
          return node;
        });

        return {
          ...prevPages,
          [selectedPageId]: {
            ...currentPage,
            allItemLogics: {
              ...currentPage.allItemLogics,
              [activeLogicGraphId]: {
                ...currentGraph,
                nodes: newNodes,
              },
            },
          },
        };
      });
    }, [activeLogicGraphId, selectedPageId]);
    
  const handleDeleteItem = useCallback(() => {
    if (!selectedItemId || !selectedPageId) return;

    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      
      const newPlacedItems = currentPage.placedItems.filter(
        (item) => item.id !== selectedItemId
      );
      const newLogics = { ...currentPage.allItemLogics };
      delete newLogics[selectedItemId];

      return {
        ...prevPages,
        [selectedPageId]: {
          ...currentPage,
          placedItems: newPlacedItems,
          allItemLogics: newLogics,
        },
      };
    });
    
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  }, [selectedItemId, selectedPageId]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreviewing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) { return; }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault(); 
        handleDeleteItem();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDeleteItem, isPreviewing]);

  // --- (5) 選択/ナビゲーション関数 (変更) ---
  
  const handleSelectPage = (pageId: string) => {
    if (pageId === selectedPageId) return;
    setSelectedPageId(pageId);
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };
  
  const handleAddNewPage = () => {
    const newPageCount = pageOrder.length + 1;
    const newPage = createDefaultPage(`Page ${newPageCount}`);
    
    setPages((prev) => ({
      ...prev,
      [newPage.id]: newPage,
    }));
    setPageOrder((prev) => [...prev, newPage.id]);
    
    handleSelectPage(newPage.id);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedNodeId(null);
    setActiveLogicGraphId(itemId);
  };
  const handleBackgroundClick = () => {
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };
  const handleNodeClick = (nodeId: string) => {
    setSelectedItemId(null);
    setSelectedNodeId(nodeId);
  };

  const handleGoHome = () => {
    setIsProjectLoaded(false);
    setIsPreviewing(false);
    setPages({});
    setPageOrder([]);
    setSelectedPageId(null);
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
    setPreviewItemsState({});
  };
  
  // --- (6) 新規プロジェクトのロジック (変更) ---
  
  const handleNewProjectClick = () => {
    setIsNameModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNameModalOpen(false);
  };
  
  const handleConfirmNewProject = (name: string) => {
    const defaultPage = createDefaultPage("Page 1");
    setPages({ [defaultPage.id]: defaultPage });
    setPageOrder([defaultPage.id]);
    setSelectedPageId(defaultPage.id);
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
    setProjectName(name); 
    setIsNameModalOpen(false);
    setIsProjectLoaded(true);
    setIsPreviewing(false);
    setPreviewItemsState({});
  };


  // --- (7) 保存・読み込み関数 (変更) ---
  const handleExportProject = useCallback(() => {
    if (isPreviewing) {
      alert("編集モードに戻ってから保存してください。");
      return;
    }
    const projectData: ProjectData = {
      pages: pages,
      pageOrder: pageOrder,
    };
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "engage-kit-project"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pages, pageOrder, projectName, isPreviewing]);

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const projectData: ProjectData = JSON.parse(text);

        if (projectData && projectData.pages && projectData.pageOrder) {
          setPages(projectData.pages);
          setPageOrder(projectData.pageOrder);
          setSelectedPageId(projectData.pageOrder[0] || null); 
          setSelectedItemId(null);
          setSelectedNodeId(null);
          setActiveLogicGraphId(null);
          setProjectName(file.name.replace(/\.json$/, ""));
          setIsProjectLoaded(true); 
          setIsPreviewing(false);
          setPreviewItemsState({});
        } else {
          alert("無効なプロジェクトファイルです。");
        }
      } catch (error) {
        alert("プロジェクトファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // --- (プレビューモード切替ロジック) (変更) ---
  
  const setCurrentPreviewState = useCallback(
    (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => {
      if (!selectedPageId) return;
      
      setPreviewItemsState((prevAllStates) => {
        const oldState = prevAllStates[selectedPageId] || {};
        const updatedState = typeof newState === 'function' ? newState(oldState) : newState;
        return {
          ...prevAllStates,
          [selectedPageId]: updatedState,
        };
      });
    }, 
    [selectedPageId]
  );
  
  const handleTogglePreview = () => {
    if (isPreviewing) {
      setIsPreviewing(false);
      setPreviewItemsState({});
    } else {
      if (!selectedPageId || !currentPlacedItems) {
        alert("ページが選択されていません。");
        return;
      }
      
      setSelectedItemId(null);
      setSelectedNodeId(null);
      setActiveLogicGraphId(null);
      
      const initialState: PreviewState = {};
      for (const item of currentPlacedItems) {
        initialState[item.id] = {
          isVisible: true,
        };
      }
      
      setPreviewItemsState({
        [selectedPageId]: initialState
      });
      
      setIsPreviewing(true);
    }
  };
  
  // --- (8) メインの return (★ ヘッダーをコンポーネントに置き換え) ---
  return (
    <div className="app-container">
      {/* (A) ホーム画面 or エディタ画面 */}
      {!isProjectLoaded ? (
        <HomeScreen 
          onNewProject={handleNewProjectClick}
          onLoadProject={handleImportProject}
        />
      ) : (
        // (B) エディタ画面
        <div className="editor-container">
          
          {/* (★ 修正: <header>...</header> を <Header ... /> に置き換え) */}
          <Header
            projectName={projectName}
            isPreviewing={isPreviewing}
            onGoHome={handleGoHome}
            onExportProject={handleExportProject}
            onImportProject={handleImportProject}
            onTogglePreview={handleTogglePreview}
          />
          
          {/* (B-2) 編集モード or プレビューモード */}
          {isPreviewing ? (
            // --- プレビューモード ---
            <div className="preview-host-container">
              {(currentPreviewState && currentPlacedItems && currentAllItemLogics) ? (
                <PreviewHost
                  placedItems={currentPlacedItems}
                  previewState={currentPreviewState}
                  setPreviewState={setCurrentPreviewState}
                  allItemLogics={currentAllItemLogics}
                />
              ) : (
                <div>プレビューの読み込みに失敗しました。</div>
              )}
            </div>
          ) : (
            // --- 編集モード (5パネルエディタ) ---
            <PanelGroup direction="vertical" className="container">
              {/* (A-1) 上部メインエリア */}
              <Panel defaultSize={75} minSize={30}>
                <PanelGroup direction="horizontal">
                  {/* (B-1) 左エリア */}
                  <Panel defaultSize={20} minSize={15} className="panel-column">
                    <PanelGroup direction="vertical">
                      <Panel defaultSize={40} minSize={20} className="panel-content">
                        <div className="tool-list">
                          <ToolboxItem name="テキスト" />
                          <ToolboxItem name="ボタン" />
                          <ToolboxItem name="画像" />
                        </div>
                      </Panel>
                      <PanelResizeHandle className="resize-handle" />
                      <Panel defaultSize={60} minSize={20} className="panel-content-nopad">
                        <ContentBrowser
                          pages={pageInfoList}
                          selectedPageId={selectedPageId}
                          onSelectPage={handleSelectPage}
                          onAddPage={handleAddNewPage}
                        />
                      </Panel>
                    </PanelGroup>
                  </Panel>
                  <PanelResizeHandle className="resize-handle" />
                  {/* (B-2) 中央エリア (キャンバス) */}
                  <Panel defaultSize={55} minSize={30} className="panel-content">
                    <div className="canvas-viewport">
                      <Artboard
                        placedItems={currentPlacedItems || []}
                        setPlacedItems={handlePlacedItemsChange}
                        onItemSelect={handleItemSelect}
                        onBackgroundClick={handleBackgroundClick}
                        selectedItemId={selectedItemId}
                        setAllItemLogics={handleAllItemLogicsChange}
                        nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
                      />
                    </div>
                  </Panel>
                  <PanelResizeHandle className="resize-handle" />
                  {/* (B-3) 右エリア (プロパティ) */}
                  <Panel defaultSize={25} minSize={15} className="panel-content">
                    <PropertiesPanel
                      selectedItemId={selectedItemId}
                      selectedNodeId={selectedNodeId}
                      activeLogicGraphId={activeLogicGraphId}
                      placedItems={currentPlacedItems || []}
                      allItemLogics={currentAllItemLogics || {}}
                      onItemUpdate={handleItemUpdate}
                      onNodeDataChange={handleNodeDataChange}
                    />
                  </Panel>
                </PanelGroup>
              </Panel>
              {/* (A-2) 下部エリア (ノードエディタ) */}
              <PanelResizeHandle className="resize-handle" />
              <Panel defaultSize={25} minSize={15} className="panel-content">
                <NodeEditor
                  nodes={currentGraph?.nodes}
                  edges={currentGraph?.edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeAdd={handleAddNode}
                  onConnect={onConnect}
                  placedItems={currentPlacedItems || []} 
                  onNodeDataChange={handleNodeDataChange}
                  onNodeClick={handleNodeClick}
                />
              </Panel>
            </PanelGroup>
          )}
        </div>
      )}

      {/* (C) モーダル (isNameModalOpen が true の時だけ表示) */}
      {isNameModalOpen && (
        <ProjectNameModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmNewProject}
        />
      )}
    </div>
  );
}

export default App;