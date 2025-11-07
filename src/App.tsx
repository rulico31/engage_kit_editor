// src/App.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
// ... (import文は変更なし)
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
import type { PlacedItemType, ProjectData, PageData, NodeGraph, PageInfo } from "./types";

// ... (NODE_GRAPH_TEMPLATES, EditorViewProps, EditorView は変更なし) ...
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

interface EditorViewProps {
  projectName: string;
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  currentGraph: NodeGraph | undefined;
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;
  selectedItemId: string | null;
  selectedNodeId: string | null;
  activeLogicGraphId: string | null;
  onItemUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (newNode: Node) => void;
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;
  onNodeClick: (nodeId: string) => void;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  pages,
  pageOrder,
  selectedPageId,
  onSelectPage,
  onAddPage,
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
  onImportProject
}) => {

  const pageInfoList: PageInfo[] = useMemo(() => {
    return pageOrder.map(id => ({ id, name: pages[id]?.name || "無題" }));
  }, [pages, pageOrder]);

  return (
    <div className="container">
      <Header
        projectName={projectName}
        isPreviewing={false}
        onGoHome={onGoHome}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onTogglePreview={() => alert("プレビュー機能は未実装です")}
      />
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
                  setPlacedItems={setPlacedItems} // (★ App.tsx 側でラップされたセッター)
                  onItemSelect={onItemSelect}
                  onBackgroundClick={onBackgroundClick}
                  selectedItemId={selectedItemId}
                  setAllItemLogics={setAllItemLogics} // (★ App.tsx 側でラップされたセッター)
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
                placedItems={placedItems} // (★ 現在のページのアイテム)
                allItemLogics={allItemLogics} // (★ 現在のページのロジック)
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
            nodes={currentGraph?.nodes} // (★ 現在のページのグラフ)
            edges={currentGraph?.edges} // (★ 現在のページのグラフ)
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeAdd={onAddNode}
            onConnect={onConnect}
            placedItems={placedItems} // (★ 現在のページのアイテム)
            onNodeDataChange={onNodeDataChange}
            onNodeClick={onNodeClick}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};


function App() {
  // ... (State定義は変更なし) ...
  const [view, setView] = useState<"home" | "editor">("home");
  const [projectName, setProjectName] = useState<string>("");
  const [pages, setPages] = useState<Record<string, PageData>>({});
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);
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


  // ... (コールバック関数は変更なし) ...
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

  // (A) (変更なし)
  const resetProjectState = () => {
    setPages({});
    setPageOrder([]);
    setSelectedPageId(null);
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };

  // (B) (★ 修正) handleNewProject
  const handleNewProject = () => {
    // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) 引数 'name' を削除し、promptロジックをここに追加 ↓↓↓↓↓↓↓↓↓↓
    const name = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    if (!name) return; // ユーザーがキャンセルしたら何もしない

    setProjectName(name);
    // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
    resetProjectState();

    const initialPageId = `page-${Date.now()}`;
    const initialPage: PageData = {
      id: initialPageId,
      name: "Page 1",
      placedItems: [],
      allItemLogics: {},
    };

    setPages({ [initialPageId]: initialPage });
    setPageOrder([initialPageId]);
    setSelectedPageId(initialPageId);

    setView("editor");
  };

  // (C) (変更なし)
  const handleGoHome = () => {
    if (window.confirm("ホームに戻ると、保存していない変更は失われます。よろしいですか？")) {
      setView("home");
      setProjectName("");
      resetProjectState();
    }
  };

  // (D) (変更なし)
  const handleExportProject = () => {
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

  // (E) (変更なし)
  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;

        const firstPageId = data.pageOrder[0];

        if (data.pages && data.pageOrder && firstPageId) {
          setProjectName(data.projectName || "無題のプロジェクト");
          setPages(data.pages);
          setPageOrder(data.pageOrder);
          setSelectedPageId(firstPageId);
          
          setSelectedItemId(null);
          setSelectedNodeId(null);
          setActiveLogicGraphId(null);

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
    event.target.value = "";
  };

  // --- (6) (変更なし) ページ管理ハンドラ ---
  
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
    setSelectedPageId(newPageId);
    
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === selectedPageId) return;
    
    setSelectedPageId(pageId);
    
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };


  // --- (7) (変更なし) ビューの切り替え ---
  
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
      pages={pages}
      pageOrder={pageOrder}
      selectedPageId={selectedPageId}
      onSelectPage={handleSelectPage}
      onAddPage={handleAddPage}
      placedItems={placedItems}
      allItemLogics={allItemLogics}
      currentGraph={currentGraph}
      setPlacedItems={setPlacedItemsForCurrentPage}
      setAllItemLogics={setAllItemLogicsForCurrentPage}
      selectedItemId={selectedItemId}
      selectedNodeId={selectedNodeId}
      activeLogicGraphId={activeLogicGraphId}
      onItemUpdate={handleItemUpdate}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onAddNode={handleAddNode}
      onNodeDataChange={handleNodeDataChange}
      onItemSelect={handleItemSelect}
      onBackgroundClick={handleBackgroundClick}
      onNodeClick={handleNodeClick}
      onGoHome={handleGoHome}
      onExportProject={handleExportProject}
      onImportProject={handleImportProject}
    />
  );
}

export default App;