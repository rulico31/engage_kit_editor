// src/App.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react"; // (useMemo をインポート)
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
// (types から PreviewState と PreviewItemState をインポート)
import type {
  PlacedItemType,
  PreviewState,
  PreviewItemState,
  NodeGraph, // (型をインポート)
  PageData, // (型をインポート)
  ProjectData, // (型をインポート)
  PageInfo, // (型をインポート)
} from "./types";
import HomeScreen from "./components/HomeScreen";
import ProjectNameModal from "./components/ProjectNameModal";
// (プレビュー用のコンポーネントをインポート)
import PreviewHost from "./components/PreviewHost";
// (コンテンツブラウザをインポート)
import ContentBrowser from "./components/ContentBrowser";

// (型定義は types.ts に移動)

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
  // const [placedItems, setPlacedItems] = useState<PlacedItemType[]>([]);
  // const [allItemLogics, setAllItemLogics] = useState<Record<string, NodeGraph>>({});
  
  // (新) ページデータ本体 (IDをキーにしたマップ)
  const [pages, setPages] = useState<Record<string, PageData>>({});
  // (新) ページの順序を管理する配列
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  // (新) 現在選択されているページID
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // (選択状態の State は変更なし)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);

  // --- (プレビューモード用の State を変更) ---
  const [isPreviewing, setIsPreviewing] = useState(false);
  // (プレビュー状態をページIDごとにネスト)
  const [previewItemsState, setPreviewItemsState] = useState<Record<string, PreviewState>>({});

  // --- (3) 選択中ページ/アイテム/ノードの情報を計算 (変更) ---
  
  // (新) 現在のページデータを取得
  const currentPageData: PageData | undefined = selectedPageId
    ? pages[selectedPageId]
    : undefined;

  // (新) コンテンツブラウザに渡すためのページ情報リスト
  const pageInfoList: PageInfo[] = useMemo(() => {
    return pageOrder.map((id) => ({ id: id, name: pages[id]?.name || "Error" }));
  }, [pages, pageOrder]);

  // (既存の変数を、currentPageData から派生させる)
  const currentPlacedItems = currentPageData?.placedItems;
  const currentAllItemLogics = currentPageData?.allItemLogics;
  
  const selectedItem =
    currentPlacedItems?.find((item) => item.id === selectedItemId) || null;
  const currentGraph: NodeGraph | undefined = activeLogicGraphId
    ? currentAllItemLogics?.[activeLogicGraphId]
    : undefined;
  
  // (新) プレビュー用の現在のページの状態
  const currentPreviewState: PreviewState | undefined = selectedPageId
    ? previewItemsState[selectedPageId]
    : undefined;


  // --- (4) 更新用コールバック関数 (全面的な書き換え) ---

  // (新) Artboard.tsx に渡すラッパー関数 (setPlacedItems の代わり)
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
    [selectedPageId] // 依存配列
  );
  
  // (新) Artboard.tsx に渡すラッパー関数 (setAllItemLogics の代わり)
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
    [selectedPageId] // 依存配列
  );

  // (既存のコールバックを、新しい State 構造に合わせて書き換え)
  const handleItemUpdate = (itemId: string, updatedProps: Partial<PlacedItemType>) => {
    // (ラッパー関数 handlePlacedItemsChange を使う)
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
      
      // 1. アイテムを削除
      const newPlacedItems = currentPage.placedItems.filter(
        (item) => item.id !== selectedItemId
      );
      // 2. アイテムに紐づくロジックを削除
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
    
    // (選択状態をリセット)
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
  
  // (新) ページ選択ハンドラ
  const handleSelectPage = (pageId: string) => {
    if (pageId === selectedPageId) return; // 同じページなら何もしない
    setSelectedPageId(pageId);
    
    // ページを切り替えたら、アイテムとノードの選択は解除
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };
  
  // (ここから4つの関数定義を追記)
  // (新) ページ追加ハンドラ
  const handleAddNewPage = () => {
    const newPageCount = pageOrder.length + 1;
    const newPage = createDefaultPage(`Page ${newPageCount}`);
    
    setPages((prev) => ({
      ...prev,
      [newPage.id]: newPage,
    }));
    setPageOrder((prev) => [...prev, newPage.id]);
    
    // 作成したページを自動的に選択
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
  // (ここまで追記)

  const handleGoHome = () => {
    setIsProjectLoaded(false);
    setIsPreviewing(false);
    // (State をすべてリセット)
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
    // (デフォルトの Page 1 を作成)
    const defaultPage = createDefaultPage("Page 1");
    
    setPages({ [defaultPage.id]: defaultPage });
    setPageOrder([defaultPage.id]);
    setSelectedPageId(defaultPage.id); // 最初のページを選択状態にする
    
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
    // (新しい ProjectData 構造で保存)
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
  }, [pages, pageOrder, projectName, isPreviewing]); // (pages, pageOrder に変更)

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

        // (新しい ProjectData 構造を読み込む)
        if (projectData && projectData.pages && projectData.pageOrder) {
          setPages(projectData.pages);
          setPageOrder(projectData.pageOrder);
          
          // 最初のページを選択状態にする
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
  
  // (新) プレビューの State を更新するためのラッパー関数
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
      // 編集モードに戻る
      setIsPreviewing(false);
      // プレビューの状態はリセット
      setPreviewItemsState({});
    } else {
      // プレビューモードに入る
      if (!selectedPageId || !currentPlacedItems) {
        alert("ページが選択されていません。");
        return;
      }
      
      // 1. 編集中の選択をすべて解除
      setSelectedItemId(null);
      setSelectedNodeId(null);
      setActiveLogicGraphId(null);
      
      // 2. "現在選択中のページ" の placedItems からプレビュー用の初期状態を生成
      const initialState: PreviewState = {};
      for (const item of currentPlacedItems) {
        initialState[item.id] = {
          isVisible: true, // デフォルトはすべて表示
        };
      }
      
      // (プレビュー State を、現在のページIDをキーとして保存)
      setPreviewItemsState({
        [selectedPageId]: initialState
      });
      
      // 3. プレビューモードに切り替え
      setIsPreviewing(true);
    }
  };
  
  // --- (8) メインの return (画面切り替え) ---
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
          {/* (B-1) トップツールバー */}
          <header className="editor-toolbar">
            <div className="toolbar-title">
              Engage-Kit <span>/ {projectName}</span>
            </div>
            <div className="editor-toolbar-buttons">
              <button onClick={handleGoHome} className="io-button home-button">
                ホームに戻る
              </button>
              
              {!isPreviewing && (
                <>
                  <button onClick={handleExportProject} className="io-button">
                    保存 (JSON)
                  </button>
                  <input
                    type="file"
                    id="import-project-input-editor"
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={handleImportProject}
                  />
                  <label htmlFor="import-project-input-editor" className="io-button">
                    読込 (JSON)
                  </label>
                </>
              )}
              
              <button 
                onClick={handleTogglePreview} 
                className={`io-button ${isPreviewing ? 'edit-button' : 'preview-button'}`}
              >
                {isPreviewing ? "⏹ 編集に戻る" : "▶ プレビュー"}
              </button>
            </div>
          </header>
          
          {/* (B-2) 編集モード or プレビューモード */}
          {isPreviewing ? (
            // --- プレビューモード ---
            <div className="preview-host-container">
              {/* (currentPreviewState と currentAllItemLogics を渡す) */}
              {(currentPreviewState && currentPlacedItems && currentAllItemLogics) ? (
                <PreviewHost
                  placedItems={currentPlacedItems}
                  previewState={currentPreviewState}
                  setPreviewState={setCurrentPreviewState} // (ラッパー関数を渡す)
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
                        {/* (ヘッダーの padding が変わったため、ヘッダーをパネル内に移動) */}
                        <div className="panel-header">ツールボックス</div>
                        <div className="tool-list">
                          <ToolboxItem name="テキスト" />
                          <ToolboxItem name="ボタン" />
                          <ToolboxItem name="画像" />
                        </div>
                      </Panel>
                      <PanelResizeHandle className="resize-handle" />
                      {/* (panel-content-nopad を使用) */}
                      <Panel defaultSize={60} minSize={20} className="panel-content-nopad">
                        <div className="panel-header page-browser-header">コンテンツブラウザ</div>
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
                    <div className="panel-header">
                      {/* (キャンバスヘッダーに現在のページ名を表示) */}
                      キャンバス ({currentPageData?.name || "N/A"})
                    </div>
                    <div className="canvas-viewport">
                      <Artboard
                        // (currentPlacedItems とラッパー関数を渡す)
                        placedItems={currentPlacedItems || []}
                        setPlacedItems={handlePlacedItemsChange}
                        onItemSelect={handleItemSelect}
                        onBackgroundClick={handleBackgroundClick}
                        selectedItemId={selectedItemId}
                        // (currentAllItemLogics とラッパー関数を渡す)
                        setAllItemLogics={handleAllItemLogicsChange}
                        nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
                      />
                    </div>
                  </Panel>
                  <PanelResizeHandle className="resize-handle" />
                  {/* (B-3) 右エリア (プロパティ) */}
                  <Panel defaultSize={25} minSize={15} className="panel-content">
                    <div className="panel-header">プロパティ</div>
                    <PropertiesPanel
                      selectedItemId={selectedItemId}
                      selectedNodeId={selectedNodeId}
                      activeLogicGraphId={activeLogicGraphId}
                      // (currentPlacedItems と currentAllItemLogics を渡す)
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
                <div className="panel-header">
                  {/* (ノードエディタヘッダーに選択中アイテム名を表示) */}
                  ノードエディタ {selectedItem ? `(${selectedItem.name})` : ""}
                </div>
                <NodeEditor
                  nodes={currentGraph?.nodes}
                  edges={currentGraph?.edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeAdd={handleAddNode}
                  onConnect={onConnect}
                  // (currentPlacedItems を渡す)
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

