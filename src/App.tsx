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
import type { PlacedItemType, ProjectData, PageData, NodeGraph, PageInfo, PreviewState, SelectionEntry, VariableState, PreviewItemState } from "./types";
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
  // (★ 変更なし) テキスト入力欄のノード
  "テキスト入力欄": {
    nodes: [{
      id: "input-change",
      type: "eventNode",
      data: { label: "🎬 イベント: 入力値が変更された時", eventType: "onInputChanged" },
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
  
  // (★ 変更なし) 変数関連のProps
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;

  // ページデータから導出されたProps
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  currentGraph: NodeGraph | undefined;
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;

  selection: SelectionEntry[];
  activeTabId: string | null;
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
  
  pageInfoList: PageInfo[];

  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
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
  
  // (★ 変更なし) 変数関連のProps
  variables,
  onVariableChange,

  placedItems,
  allItemLogics,
  currentGraph,
  setPlacedItems,
  setAllItemLogics,
  selection,
  activeTabId,
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
  onTogglePreview,
  pageInfoList,
  onTabSelect,
  onTabClose,
}) => {

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
            selectedItemId={selection.find(s => s.id === activeTabId && s.type === 'item')?.id || null}
            setAllItemLogics={setAllItemLogics}
            nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
            // (プレビュー用)
            isPreviewing={true}
            previewState={previewState}
            onItemEvent={onItemEvent}
            
            // (★ 変更なし) 変数関連のProps
            variables={variables}
            onVariableChange={onVariableChange}
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
                      {/* (★ 変更なし) テキスト入力欄 */}
                      <ToolboxItem name="テキスト入力欄" />
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
                    selectedItemId={selection.find(s => s.id === activeTabId && s.type === 'item')?.id || null}
                    setAllItemLogics={setAllItemLogics}
                    nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
                    // (プレビュー用)
                    isPreviewing={false}
                    previewState={previewState} // (空でも渡す)
                    onItemEvent={onItemEvent}
                    
                    // (★ 変更なし) 変数関連のProps (編集モードでも渡す)
                    variables={variables}
                    onVariableChange={onVariableChange}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="resize-handle" />

              {/* (B-3) 右エリア (プロパティ) */}
              <Panel defaultSize={25} minSize={15} className="panel-content">
                {/* ↓↓↓↓↓↓↓↓↓↓ (★ 修正) `setPlacedItems` を渡さない ↓↓↓↓↓↓↓↓↓↓ */}
                <PropertiesPanel
                  selection={selection}
                  activeTabId={activeTabId}
                  activeLogicGraphId={activeLogicGraphId}
                  onTabSelect={onTabSelect}
                  onTabClose={onTabClose}
                  placedItems={placedItems}
                  allItemLogics={allItemLogics}
                  onItemUpdate={onItemUpdate}
                  onNodeDataChange={onNodeDataChange}
                  pageInfoList={pageInfoList}
                />
                {/* ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑ */}
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
              pageInfoList={pageInfoList}
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
  const [pages, setPages] = useState<Record<string, PageData>>({});
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // (★ 変更) タブ式選択 State
  const [selection, setSelection] = useState<SelectionEntry[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);
  
  // プレビュー用 State
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({});
  
  // (★ 変更なし) 変数 State
  const [variables, setVariables] = useState<VariableState>({});
  
  const previewStateRef = useRef(previewState);
  useEffect(() => {
    previewStateRef.current = previewState;
  }, [previewState]);
  
  const variablesRef = useRef(variables);
  useEffect(() => {
    variablesRef.current = variables;
  }, [variables]);


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

  const pageInfoList: PageInfo[] = useMemo(() => {
    return pageOrder.map(id => ({ id: id, name: pages[id]?.name || "無題" }));
  }, [pages, pageOrder]);


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
  // (★ 変更なし) useCallback でラップ
  const handleItemUpdate = useCallback((
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

      // (★ 変更なし) "data" の変更ではタブ名は変更しない
      if (updatedProps.name) {
        setSelection(prevSel => prevSel.map(s => 
          s.id === itemId ? { ...s, label: `🔘 ${updatedProps.name}` } : s
        ));
      }
      
      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, placedItems: newPlacedItems },
      };
    });
  }, [selectedPageId]);

  // (更新)
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    if (!selectedPageId || !activeLogicGraphId) return;
    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      const currentGraph = currentPage?.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      
      const newSelection = [...selection];
      newNodes.forEach(node => {
        const selEntry = newSelection.find(s => s.id === node.id);
        if (selEntry && selEntry.label !== node.data.label) {
          selEntry.label = node.data.label;
        }
      });
      setSelection(newSelection);

      const newAllItemLogics = {
        ...currentPage.allItemLogics,
        [activeLogicGraphId]: { ...currentGraph, nodes: newNodes },
      };

      return {
        ...prevPages,
        [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics },
      };
    });
  }, [selectedPageId, activeLogicGraphId, selection]);

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

        if (dataUpdate.label) {
          setSelection(prevSel => prevSel.map(s => 
            s.id === nodeId ? { ...s, label: dataUpdate.label } : s
          ));
        }
        
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
    const activeEntry = selection.find(s => s.id === activeTabId);
    if (!activeEntry || activeEntry.type !== 'item' || !selectedPageId) return;
    
    const itemIdToDelete = activeEntry.id;

    setPages((prevPages) => {
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      
      const newPlacedItems = currentPage.placedItems.filter((item) => item.id !== itemIdToDelete);
      const newAllItemLogics = { ...currentPage.allItemLogics };
      delete newAllItemLogics[itemIdToDelete];

      return {
        ...prevPages,
        [selectedPageId]: { 
          ...currentPage, 
          placedItems: newPlacedItems, 
          allItemLogics: newAllItemLogics 
        },
      };
    });
    
    setSelection(prevSel => prevSel.filter(s => s.id !== itemIdToDelete));
    setActiveTabId(null);
    setActiveLogicGraphId(null);
    
  }, [selectedPageId, selection, activeTabId]);

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

  // (★ 変更なし) 選択ハンドラ
  const handleItemSelect = useCallback((itemId: string) => {
    const item = placedItems.find(p => p.id === itemId);
    if (!item) return;
    
    const newEntry: SelectionEntry = { id: itemId, type: 'item', label: `🔘 ${item.name}` };

    setSelection(prev => {
      const exists = prev.find(s => s.id === itemId);
      if (exists) return prev; 
      return [...prev, newEntry];
    });
    
    setActiveTabId(itemId);
    setActiveLogicGraphId(itemId); 
  }, [placedItems]);

  const handleBackgroundClick = useCallback(() => {
    setActiveTabId(null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!currentGraph) return;
    const node = currentGraph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newEntry: SelectionEntry = { id: nodeId, type: 'node', label: node.data.label || 'ノード' };
    
    setSelection(prev => {
      const exists = prev.find(s => s.id === nodeId);
      if (exists) return prev; 
      return [...prev, newEntry];
    });
    
    setActiveTabId(nodeId);
  }, [currentGraph]);


  // --- (5) プロジェクト管理ハンドラ ---

  // (A) プロジェクトの全状態をリセット
  const resetProjectState = () => {
    setPages({});
    setPageOrder([]);
    setSelectedPageId(null);
    setSelection([]);
    setActiveTabId(null);
    setActiveLogicGraphId(null);
    
    setIsPreviewing(false);
    setPreviewState({});
    setVariables({});
  };

  // (B) 新規プロジェクト作成 (HomeScreen ->)
  const handleNewProject = useCallback(() => {
    const name = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    if (!name) return; 

    setProjectName(name);
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
  }, []);

  // (C) ホームに戻る (EditorView -> Header ->)
  const handleGoHome = useCallback(() => {
    if (window.confirm("ホームに戻ると、保存していない変更は失われます。よろしいですか？")) {
      setView("home");
      setProjectName("");
      resetProjectState();
    }
  }, []);

  // (D) プロジェクト保存 (EditorView -> Header ->)
  const handleExportProject = useCallback(() => {
    const projectData: ProjectData = {
      projectName: projectName,
      pages: pages,
      pageOrder: pageOrder,
      variables: variables,
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
  }, [projectName, pages, pageOrder, variables]);

  // (E) プロジェクト読込 (HomeScreen -> | EditorView -> Header ->)
  const handleImportProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
          setVariables(data.variables || {});
          
          setSelection([]);
          setActiveTabId(null);
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
  }, []);


  // --- (6) ページ管理ハンドラ ---
  
  const handleAddPage = useCallback(() => {
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
    
    setSelection([]);
    setActiveTabId(null);
    setActiveLogicGraphId(null);
  }, [pageOrder]);

  const handleSelectPage = useCallback((pageId: string) => {
    if (pageId === selectedPageId) return; 
    
    setSelectedPageId(pageId);
    
    setSelection([]);
    setActiveTabId(null);
    setActiveLogicGraphId(null);
  }, [selectedPageId]);


  // --- (7) タブ操作ハンドラ ---

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    
    const entry = selection.find(s => s.id === tabId);
    if (entry && entry.type === 'item') {
      setActiveLogicGraphId(tabId);
    }
  }, [selection]);

  const handleCloseTab = useCallback((idToClose: string) => {
    const closedEntry = selection.find(s => s.id === idToClose);
    if (!closedEntry) return;

    let newSelection = selection.filter(s => s.id !== idToClose);
    let newActiveTabId = activeTabId;
    
    if (activeTabId === idToClose) {
      newActiveTabId = null;
    }

    if (closedEntry.type === 'item' && activeLogicGraphId === idToClose) {
      const graph = allItemLogics[idToClose];
      if (graph) {
        const nodeIds = graph.nodes.map(n => n.id);
        newSelection = newSelection.filter(s => !nodeIds.includes(s.id));
        
        if (newActiveTabId && nodeIds.includes(newActiveTabId)) {
          newActiveTabId = null;
        }
      }
      setActiveLogicGraphId(null);
    }
    
    setSelection(newSelection);
    setActiveTabId(newActiveTabId);
  }, [selection, activeTabId, activeLogicGraphId, allItemLogics]);


  // --- (8) プレビュー＆ロジック実行ハンドラ ---
  
  /**
   * プレビュー実行時、ロジックエンジンからページ遷移が要求されたときに呼ばれる
   */
  const handlePageChangeRequest = useCallback((targetPageId: string) => {
    if (!pages[targetPageId]) {
      console.warn(`[App] 存在しないページ (ID: ${targetPageId}) への遷移リクエスト`);
      return;
    }
    
    setSelectedPageId(targetPageId);
    
    const targetPageData = pages[targetPageId];
    const initialPreviewState: PreviewState = {};
    targetPageData.placedItems.forEach(item => {
      initialPreviewState[item.id] = {
        isVisible: true,
        x: item.x,
        y: item.y,
        opacity: 1,
        scale: 1,
        rotation: 0,
        transition: null,
      };
    });
    setPreviewState(initialPreviewState);

    // (TODO: "onLoad" イベントをトリガーする)
  }, [pages]);

  /**
   * プレビューモードの切り替え
   */
  const handleTogglePreview = useCallback(() => {
    setIsPreviewing((prev) => {
      const nextIsPreviewing = !prev;
      if (nextIsPreviewing) {
        // --- プレビュー開始 ---
        const initialPreviewState: PreviewState = {};
        placedItems.forEach(item => {
          initialPreviewState[item.id] = {
            isVisible: true,
            x: item.x,
            y: item.y,
            opacity: 1,
            scale: 1,
            rotation: 0,
            transition: null,
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
  }, [placedItems]);

  // (★ 変更なし) Artboard の <input> から変数を更新するハンドラ
  const handleVariableChangeFromItem = useCallback((variableName: string, value: any) => {
    if (!variableName) return;
    
    const newVars = {
      ...variablesRef.current,
      [variableName]: value,
    };
    
    variablesRef.current = newVars;
    setVariables(newVars);
  }, []);

  /**
   * Artboard 上のアイテムからイベントが発火されたときに呼ばれる
   */
  const handleItemEvent = useCallback((eventName: string, itemId: string) => {
    if (!selectedPageId) return;
    
    const targetGraph = pages[selectedPageId]?.allItemLogics[itemId];
    if (!targetGraph) {
      console.warn(`[App] ${itemId} に紐づくロジックグラフがありません`);
      return;
    }
    
    // (★ 変更なし) "onInputChanged" イベントもここで処理される
    triggerEvent(
      eventName,
      itemId,
      targetGraph,
      // (1) PreviewState ハンドラ
      () => previewStateRef.current,
      (newState: PreviewState) => {
        previewStateRef.current = newState;
        setPreviewState(newState);
      },
      // (2) ページ遷移ハンドラ
      handlePageChangeRequest, // (★) 安定化された
      // (3) VariableState ハンドラ
      () => variablesRef.current,
      (newVars: VariableState) => {
        variablesRef.current = newVars;
        setVariables(newVars);
      }
    );
  }, [selectedPageId, pages, handlePageChangeRequest]);


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
      
      // (★ 変更なし) 変数関連のProps
      variables={variables}
      onVariableChange={handleVariableChangeFromItem}

      // (派生データ)
      placedItems={placedItems}
      allItemLogics={allItemLogics}
      currentGraph={currentGraph}
      setPlacedItems={setPlacedItemsForCurrentPage}
      setAllItemLogics={setAllItemLogicsForCurrentPage}

      // (選択状態)
      selection={selection}
      activeTabId={activeTabId}
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
      
      pageInfoList={pageInfoList}

      // (タブ操作)
      onTabSelect={handleTabSelect}
      onTabClose={handleCloseTab}
    />
  );
}

export default App;