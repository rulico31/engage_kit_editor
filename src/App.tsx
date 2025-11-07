// src/App.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import Header from "./components/Header";
import HomeScreen from "./components/HomeScreen";
import ContentBrowser from "./components/ContentBrowser";
import type { PlacedItemType, ProjectData, PageData, NodeGraph, PageInfo, PreviewState } from "./types";
import { triggerEvent } from "./logicEngine.ts";

export type { NodeGraph } from "./types";


const NODE_GRAPH_TEMPLATES: Record<string, NodeGraph> = {
  "ボタン": {
    nodes: [{
      id: "btn-click",
      type: "eventNode",
      data: { label: "🎬 イベント: ボタンがクリックされた時", eventType: "click" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "テキスト": {
    nodes: [{
      id: "text-load",
      type: "eventNode",
      data: { label: "🎬 イベント: テキスト表示時", eventType: "onLoad" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "画像": {
    nodes: [{
      id: "img-load",
      type: "eventNode",
      data: { label: "🎬 イベント: 画像読み込み完了時", eventType: "onLoad" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "Default": {
    nodes: [{
      id: "default-load",
      type: "eventNode",
      data: { label: "🎬 イベント: ページ読み込み時", eventType: "onLoad" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
};


interface EditorViewProps {
  projectName: string;
  
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  
  // プレビュー用Props
  isPreviewing: boolean;
  previewState: PreviewState;
  onItemEvent: (eventName: string, itemId: string) => void;

  // ページデータから導出されたProps
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  currentGraph: NodeGraph | undefined;
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;

  selectedItemId: string | null;
  selectedNodeId: string | null;
  activeLogicGraphId: string | null;
  
  // コールバック
  onItemUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (newNode: Node) => void;
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;
  onNodeClick: (nodeId: string) => void;

  // ヘッダー用
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePreview: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  pages,
  pageOrder,
  selectedPageId,
  onSelectPage,
  onAddPage,
  
  isPreviewing,
  previewState,
  onItemEvent,

  placedItems,
  allItemLogics,
  currentGraph,
  setPlacedItems,
  setAllItemLogics,
  selectedItemId,
  selectedNodeId,
  activeLogicGraphId,
  onItemUpdate,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onNodeDataChange,
  onItemSelect,
  onBackgroundClick,
  onNodeClick,
  onGoHome,
  onExportProject,
  onImportProject,
  onTogglePreview
}) => {

  // ページ情報を ContentBrowser 用に整形
  const pageInfoList: PageInfo[] = useMemo(() => {
    return pageOrder.map(id => ({ id, name: pages[id]?.name || "無題" }));
  }, [pages, pageOrder]);

  return (
    <div className="container">
      <Header
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={onGoHome}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onTogglePreview={onTogglePreview}
      />
      {isPreviewing ? (
        // --- プレビューモード ---
        <div className="preview-viewport">
          <Artboard
            placedItems={placedItems}
            setPlacedItems={setPlacedItems}
            onItemSelect={onItemSelect}
            onBackgroundClick={onBackgroundClick}
            selectedItemId={selectedItemId}
            setAllItemLogics={setAllItemLogics}
            nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
            // (プレビュー用)
            isPreviewing={true}
            previewState={previewState}
            onItemEvent={onItemEvent}
          />
        </div>
      ) : (
        // --- 編集モード ---
        <PanelGroup direction="vertical" style={{ height: "calc(100vh - 45px)" }}>
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
                  <Panel defaultSize={60} minSize={20} className="panel-content">
                    <ContentBrowser
                      pages={pageInfoList}
                      selectedPageId={selectedPageId}
                      onSelectPage={onSelectPage}
                      onAddPage={onAddPage}
                    />
                  </Panel>
                </PanelGroup>
              </Panel>
              <PanelResizeHandle className="resize-handle" />

              {/* (B-2) 中央エリア (キャンバス) */}
              <Panel defaultSize={55} minSize={30} className="panel-content">
                <div className="canvas-viewport">
                  <Artboard
                    placedItems={placedItems}
                    setPlacedItems={setPlacedItems}
                    onItemSelect={onItemSelect}
                    onBackgroundClick={onBackgroundClick}
                    selectedItemId={selectedItemId}
                    setAllItemLogics={setAllItemLogics}
                    nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
                    // (プレビュー用)
                    isPreviewing={false}
                    previewState={previewState} // (空でも渡す)
                    onItemEvent={onItemEvent}
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
                  placedItems={placedItems}
                  allItemLogics={allItemLogics}
                  onItemUpdate={onItemUpdate}
                  onNodeDataChange={onNodeDataChange}
                />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* (A-2) 下部エリア (ノードエディタ) */}
          <Panel defaultSize={25} minSize={15} className="panel-content">
            <NodeEditor
              nodes={currentGraph?.nodes}
              edges={currentGraph?.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeAdd={onAddNode}
              onConnect={onConnect}
              placedItems={placedItems}
              onNodeDataChange={onNodeDataChange}
              onNodeClick={onNodeClick}
            />
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
};
// エディタUIコンポーネントここまで


function App() {
  // --- (1) ビュー管理 State ---
  const [view, setView] = useState<"home" | "editor">("home");
  const [projectName, setProjectName] = useState<string>("");

  // --- (2) 複数ページ対応の State ---
  const [pages, setPages] = useState<Record<string, PageData>>({}); // 全ページデータ
  const [pageOrder, setPageOrder] = useState<string[]>([]); // ページの順序
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null); // 選択中のページID

  // (変更) 選択中のアイテム (これはページ間で共通)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);
  
  // プレビュー用 State
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({});
  
  // プレビュー状態(setPreviewState)が非同期更新だとロジックエンジンが
  // 古い状態を参照してしまうため、ref で最新の状態を同期的に取得する
  const previewStateRef = useRef(previewState);
  useEffect(() => {
    previewStateRef.current = previewState;
  }, [previewState]);


  // --- (3) "派生" State (選択中のページのデータを計算) ---
  const { 
    placedItems, 
    allItemLogics, 
    currentGraph 
  } = useMemo(() => {
    if (!selectedPageId) {
      return { placedItems: [], allItemLogics: {}, currentGraph: undefined };
    }
    const currentPageData = pages[selectedPageId];
    if (!currentPageData) {
      return { placedItems: [], allItemLogics: {}, currentGraph: undefined };
    }

    const currentLogicGraph = activeLogicGraphId
      ? currentPageData.allItemLogics[activeLogicGraphId]
      : undefined;

    return {
      placedItems: currentPageData.placedItems,
      allItemLogics: currentPageData.allItemLogics,
      currentGraph: currentLogicGraph,
    };
  }, [pages, selectedPageId, activeLogicGraphId]);


  // --- (4) コールバック (すべて選択中のページID "selectedPageId" を経由) ---

  // (ラッパー) setPlacedItems
  const setPlacedItemsForCurrentPage = useCallback((
    action: React.SetStateAction<PlacedItemType[]>
  ) => {
    if (!selectedPageId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      
      const newPlacedItems = typeof action === 'function' 
        ? action(currentPage.placedItems) 
        : action;
        
      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, placedItems: newPlacedItems },
      };
    });
  }, [selectedPageId]);

  // (ラッパー) setAllItemLogics
  const setAllItemLogicsForCurrentPage = useCallback((
    action: React.SetStateAction<Record<string, NodeGraph>>
  ) => {
    if (!selectedPageId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;

      const newAllItemLogics = typeof action === 'function'
        ? action(currentPage.allItemLogics)
        : action;

      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
      };
    });
  }, [selectedPageId]);

  // (更新)
  const handleItemUpdate = (
    itemId: string,
    updatedProps: Partial<PlacedItemType>
  ) => {
    if (!selectedPageId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;

      const newPlacedItems = currentPage.placedItems.map((item) =>
        item.id === itemId ? { ...item, ...updatedProps } : item
      );

      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, placedItems: newPlacedItems },
      };
    });
  };

  // (更新)
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    if (!selectedPageId || !activeLogicGraphId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      const newAllItemLogics = {
        ...currentPage.allItemLogics,
        [activeLogicGraphId]: { ...currentGraph, nodes: newNodes },
      };

      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
      };
    });
  }, [selectedPageId, activeLogicGraphId]);

  // (更新)
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    if (!selectedPageId || !activeLogicGraphId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newEdges = applyEdgeChanges(changes, currentGraph.edges);
      const newAllItemLogics = {
        ...currentPage.allItemLogics,
        [activeLogicGraphId]: { ...currentGraph, edges: newEdges },
      };

      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
      };
    });
  }, [selectedPageId, activeLogicGraphId]);

  // (更新)
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!selectedPageId || !activeLogicGraphId) return; 
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newEdges = addEdge(connection, currentGraph.edges);
      const newAllItemLogics = {
        ...currentPage.allItemLogics,
        [activeLogicGraphId]: { ...currentGraph, edges: newEdges },
      };
      
      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
      };
    });
  }, [selectedPageId, activeLogicGraphId]);

  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) 漏れていた handleAddNode を復元 ↓↓↓↓↓↓↓↓↓↓
  // (更新)
  const handleAddNode = useCallback((newNode: Node) => {
    if (!selectedPageId || !activeLogicGraphId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;
      
      const newAllItemLogics = {
        ...currentPage.allItemLogics,
        [activeLogicGraphId]: { ...currentGraph, nodes: [...currentGraph.nodes, newNode] },
      };

      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
      };
    });
  }, [selectedPageId, activeLogicGraphId]);
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
  
  // (更新)
  const handleNodeDataChange = useCallback((nodeId: string, dataUpdate: any) => {
      if (!selectedPageId || !activeLogicGraphId) return;
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

        const newAllItemLogics = {
          ...currentPage.allItemLogics,
          [activeLogicGraphId]: { ...currentGraph, nodes: newNodes },
        };

        return {
          ...prevPages,
          [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
        };
      });
    }, [selectedPageId, activeLogicGraphId]);

  // (更新)
  const handleDeleteItem = useCallback(() => {
    if (!selectedItemId || !selectedPageId) return;
    
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      
      const newPlacedItems = currentPage.placedItems.filter((item) => item.id !== selectedItemId);
      const newAllItemLogics = { ...currentPage.allItemLogics };
      delete newAllItemLogics[selectedItemId];

      return {
        ...prevPages,
        [selectedPageId]: { 
          ...currentPage, 
          placedItems: newPlacedItems, 
          allItemLogics: newAllItemLogics 
        },
      };
    });
    
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  }, [selectedItemId, selectedPageId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [handleDeleteItem]);

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

  // --- (5) プロジェクト管理ハンドラ ---

  // (A) プロジェクトの全状態をリセット
  const resetProjectState = () => {
    setPages({});
    setPageOrder([]);
    setSelectedPageId(null);
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
    
    // プレビュー状態もリセット
    setIsPreviewing(false);
    setPreviewState({});
  };

  // (B) 新規プロジェクト作成 (HomeScreen ->)
  const handleNewProject = () => {
    const name = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    if (!name) return; // ユーザーがキャンセルしたら何もしない

    setProjectName(name);
    resetProjectState();

    // デフォルトの1ページ目を作成
    const initialPageId = `page-${Date.now()}`;
    const initialPage: PageData = {
      id: initialPageId,
      name: "Page 1",
      placedItems: [],
      allItemLogics: {},
    };

    setPages({ [initialPageId]: initialPage });
    setPageOrder([initialPageId]);
    setSelectedPageId(initialPageId); // 作成したページを選択状態にする

    setView("editor");
  };

  // (C) ホームに戻る (EditorView -> Header ->)
  const handleGoHome = () => {
    if (window.confirm("ホームに戻ると、保存していない変更は失われます。よろしいですか？")) {
      setView("home");
      setProjectName("");
      resetProjectState();
    }
  };

  // (D) プロジェクト保存 (EditorView -> Header ->)
  const handleExportProject = () => {
    // ProjectData に全ページデータを格納
    const projectData: ProjectData = {
      projectName: projectName,
      pages: pages,
      pageOrder: pageOrder,
    };

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
  };

  // (E) プロジェクト読込 (HomeScreen -> | EditorView -> Header ->)
  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;

        // プロジェクト全体を読み込む
        const firstPageId = data.pageOrder[0];

        if (data.pages && data.pageOrder && firstPageId) {
          setProjectName(data.projectName || "無題のプロジェクト");
          setPages(data.pages);
          setPageOrder(data.pageOrder);
          setSelectedPageId(firstPageId); // 最初のページを選択状態にする
          
          // 選択状態をリセット
          setSelectedItemId(null);
          setSelectedNodeId(null);
          setActiveLogicGraphId(null);

          // エディタビューに遷移
          setView("editor");
        } else {
          alert("有効なページデータが見つかりませんでした。");
        }
      } catch (err) {
        console.error("プロジェクトの読み込みに失敗しました:", err);
        alert("プロジェクトファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);

    // 同じファイルを選択できるようにinputの値をリセット
    event.target.value = "";
  };

  // --- (6) ページ管理ハンドラ ---
  
  const handleAddPage = () => {
    const newPageName = prompt("新しいページ名を入力してください:", `Page ${pageOrder.length + 1}`);
    if (!newPageName) return;
    
    const newPageId = `page-${Date.now()}`;
    const newPage: PageData = {
      id: newPageId,
      name: newPageName,
      placedItems: [],
      allItemLogics: {},
    };
    
    setPages((prev) => ({ ...prev, [newPageId]: newPage }));
    setPageOrder((prev) => [...prev, newPageId]);
    setSelectedPageId(newPageId); // 新しいページに切り替え
    
    // 選択状態をリセット
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === selectedPageId) return; // 既に選択中なら何もしない
    
    setSelectedPageId(pageId);
    
    // 選択状態をリセット
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };


  // --- (8) プレビュー＆ロジック実行ハンドラ ---
  
  /**
   * プレビューモードの切り替え
   */
  const handleTogglePreview = () => {
    setIsPreviewing((prev) => {
      const nextIsPreviewing = !prev;
      if (nextIsPreviewing) {
        // --- プレビュー開始 ---
        // placedItems から初期状態 (PreviewState) を生成
        const initialPreviewState: PreviewState = {};
        placedItems.forEach(item => {
          initialPreviewState[item.id] = {
            isVisible: true, // (デフォルトはすべて表示)
          };
        });
        setPreviewState(initialPreviewState);
        
        // (TODO: "onLoad" イベントをここでトリガーする)
        
      } else {
        // --- プレビュー終了 ---
        setPreviewState({}); // 状態をリセット
      }
      return nextIsPreviewing;
    });
  };

  /**
   * Artboard 上のアイテムからイベントが発火されたときに呼ばれる
   */
  const handleItemEvent = (eventName: string, itemId: string) => {
    if (!selectedPageId) return;
    
    // イベント発生元のアイテムのロジックグラフを取得
    const targetGraph = pages[selectedPageId]?.allItemLogics[itemId];
    if (!targetGraph) {
      console.warn(`[App] ${itemId} に紐づくロジックグラフがありません`);
      return;
    }

    // ロジックエンジンに実行を依頼
    triggerEvent(
      eventName,
      itemId,
      targetGraph,
      // 同期的に最新の state を取得/更新するラッパーを渡す
      () => previewStateRef.current,
      (newState: PreviewState) => {
        previewStateRef.current = newState;
        setPreviewState(newState);
      }
    );
  };


  // --- (9) ビューの切り替え ---
  
  if (view === "home") {
    return (
      <HomeScreen 
        onNewProject={handleNewProject}
        onImportProject={handleImportProject}
      />
    );
  }

  return (
    <EditorView
      projectName={projectName}
      
      // (ページ関連)
      pages={pages}
      pageOrder={pageOrder}
      selectedPageId={selectedPageId}
      onSelectPage={handleSelectPage}
      onAddPage={handleAddPage}
      
      // (プレビュー)
      isPreviewing={isPreviewing}
      previewState={previewState}
      onItemEvent={handleItemEvent}

      // (派生データ)
      placedItems={placedItems}
      allItemLogics={allItemLogics}
      currentGraph={currentGraph}
      setPlacedItems={setPlacedItemsForCurrentPage}
      setAllItemLogics={setAllItemLogicsForCurrentPage}

      // (アイテム/ノード選択)
      selectedItemId={selectedItemId}
      selectedNodeId={selectedNodeId}
      activeLogicGraphId={activeLogicGraphId}
      
      // (コールバック)
      onItemUpdate={handleItemUpdate}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onAddNode={handleAddNode}
      onNodeDataChange={handleNodeDataChange}
      onItemSelect={handleItemSelect}
      onBackgroundClick={handleBackgroundClick}
      onNodeClick={handleNodeClick}
      
      // (ヘッダー用)
      onGoHome={handleGoHome}
      onExportProject={handleExportProject}
      onImportProject={handleImportProject}
      
      onTogglePreview={handleTogglePreview}
    />
  );
}

export default App;