// src/App.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

import HomeScreen from "./components/HomeScreen";
import type { PlacedItemType, ProjectData, PageData, NodeGraph, PageInfo, PreviewState, SelectionEntry, VariableState, PreviewItemState } from "./types";
import { triggerEvent } from "./logicEngine";
import EditorView from "./components/EditorView";

import { EditorContext, type EditorContextType } from "./contexts/EditorContext";

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

function App() {
  // --- (1) ビュー管理 State ---
  const [view, setView] = useState<"home" | "editor">("home");
  const [projectName, setProjectName] = useState<string>("");

  // --- (2) 複数ページ対応の State ---
  const [pages, setPages] = useState<Record<string, PageData>>({});
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // タブ/選択状態
  const [selection, setSelection] = useState<SelectionEntry[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);

  // プレビュー用
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({});

  // 変数
  const [variables, setVariables] = useState<VariableState>({});

  const previewStateRef = useRef(previewState);
  useEffect(() => { previewStateRef.current = previewState; }, [previewState]);

  const variablesRef = useRef(variables);
  useEffect(() => { variablesRef.current = variables; }, [variables]);

  // --- Derived values (計算はここで行い、useMemoの依存を分かりやすくする) ---
  const derived = useMemo(() => {
    if (!selectedPageId) return { placedItems: [] as PlacedItemType[], allItemLogics: {} as Record<string, NodeGraph>, currentGraph: undefined as NodeGraph | undefined };
    const currentPage = pages[selectedPageId];
    if (!currentPage) return { placedItems: [] as PlacedItemType[], allItemLogics: {} as Record<string, NodeGraph>, currentGraph: undefined as NodeGraph | undefined };

    const currentLogicGraph = activeLogicGraphId ? currentPage.allItemLogics[activeLogicGraphId] : undefined;

    return {
      placedItems: currentPage.placedItems,
      allItemLogics: currentPage.allItemLogics,
      currentGraph: currentLogicGraph,
    };
  }, [pages, selectedPageId, activeLogicGraphId]);

  const pageInfoList: PageInfo[] = useMemo(() => pageOrder.map(id => ({ id, name: pages[id]?.name || "無題" })), [pageOrder, pages]);

  // --- (4) コールバック (selectedPageIdを直接参照する場面は functional update を使い閉じない) ---

  const setPlacedItemsForCurrentPage = useCallback((action: React.SetStateAction<PlacedItemType[]>) => {
    setPages(prevPages => {
      if (!selectedPageId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const newPlacedItems = typeof action === 'function' ? (action as Function)(currentPage.placedItems) : action;
      return { ...prevPages, [selectedPageId]: { ...currentPage, placedItems: newPlacedItems } };
    });
  }, [selectedPageId]);

  const setAllItemLogicsForCurrentPage = useCallback((action: React.SetStateAction<Record<string, NodeGraph>>) => {
    setPages(prevPages => {
      if (!selectedPageId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const newAll = typeof action === 'function' ? (action as Function)(currentPage.allItemLogics) : action;
      return { ...prevPages, [selectedPageId]: { ...currentPage, allItemLogics: newAll } };
    });
  }, [selectedPageId]);

  const handleItemUpdate = useCallback((itemId: string, updatedProps: Partial<PlacedItemType>) => {
    setPages(prevPages => {
      if (!selectedPageId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;

      const newPlacedItems = currentPage.placedItems.map(item => item.id === itemId ? { ...item, ...updatedProps } : item);

      // 選択ラベル更新は functional setSelection を使う
      if (updatedProps.name) {
        setSelection(prev => prev.map(s => s.id === itemId ? { ...s, label: `🔘 ${updatedProps.name}` } : s));
      }
      if (updatedProps.data && (updatedProps.data as any).text) {
        const newLabel = (updatedProps.data as any).text;
        setSelection(prev => prev.map(s => s.id === itemId ? { ...s, label: `🔘 ${newLabel}` } : s));
      }

      return { ...prevPages, [selectedPageId]: { ...currentPage, placedItems: newPlacedItems } };
    });
  }, [selectedPageId]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setPages(prevPages => {
      if (!selectedPageId || !activeLogicGraphId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newNodes = applyNodeChanges(changes, currentGraph.nodes);

      // selection を functional update で整合
      setSelection(prevSel => {
        const newSel = [...prevSel];
        newNodes.forEach(node => {
          const selEntry = newSel.find(s => s.id === node.id);
          if (selEntry && selEntry.label !== node.data.label) {
            selEntry.label = node.data.label;
          }
        });
        return newSel;
      });

      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      return { ...prevPages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } };
    });
  }, [selectedPageId, activeLogicGraphId]);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setPages(prevPages => {
      if (!selectedPageId || !activeLogicGraphId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newEdges = applyEdgeChanges(changes, currentGraph.edges);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
      return { ...prevPages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } };
    });
  }, [selectedPageId, activeLogicGraphId]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    setPages(prevPages => {
      if (!selectedPageId || !activeLogicGraphId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newEdges = addEdge(connection, currentGraph.edges);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
      return { ...prevPages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } };
    });
  }, [selectedPageId, activeLogicGraphId]);

  const handleAddNode = useCallback((newNode: Node) => {
    setPages(prevPages => {
      if (!selectedPageId || !activeLogicGraphId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: [...currentGraph.nodes, newNode] } };
      return { ...prevPages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } };
    });
  }, [selectedPageId, activeLogicGraphId]);

  const handleNodeDataChange = useCallback((nodeId: string, dataUpdate: any) => {
    setPages(prevPages => {
      if (!selectedPageId || !activeLogicGraphId) return prevPages;
      const currentPage = prevPages[selectedPageId];
      if (!currentPage) return prevPages;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return prevPages;

      const newNodes = currentGraph.nodes.map(node => node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node);

      if (dataUpdate.label) {
        setSelection(prev => prev.map(s => s.id === nodeId ? { ...s, label: dataUpdate.label } : s));
      }

      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      return { ...prevPages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } };
    });
  }, [selectedPageId, activeLogicGraphId]);

  const handleDeleteItem = useCallback(() => {
    setSelection(prevSel => {
      const activeEntry = prevSel.find(s => s.id === activeTabId);
      if (!activeEntry || activeEntry.type !== 'item' || !selectedPageId) return prevSel;
      const itemIdToDelete = activeEntry.id;

      setPages(prevPages => {
        const currentPage = prevPages[selectedPageId];
        if (!currentPage) return prevPages;
        const newPlacedItems = currentPage.placedItems.filter(item => item.id !== itemIdToDelete);
        const newAllItemLogics = { ...currentPage.allItemLogics };
        delete newAllItemLogics[itemIdToDelete];
        return { ...prevPages, [selectedPageId]: { ...currentPage, placedItems: newPlacedItems, allItemLogics: newAllItemLogics } };
      });

      setActiveTabId(null);
      setActiveLogicGraphId(null);

      return prevSel.filter(s => s.id !== itemIdToDelete);
    });
  }, [selectedPageId, activeTabId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) { return; }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteItem();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteItem]);

  const handleItemSelect = useCallback((itemId: string) => {
    setSelection(prev => {
      const exists = prev.find(s => s.id === itemId);
      if (exists) return prev;
      const item = derived.placedItems.find(p => p.id === itemId);
      if (!item) return prev;
      const label = item.data?.text || item.name;
      return [...prev, { id: itemId, type: 'item', label: `🔘 ${label}` }];
    });

    setActiveTabId(itemId);
    setActiveLogicGraphId(itemId);
  }, [derived]);

  const handleBackgroundClick = useCallback(() => setActiveTabId(null), []);

  const handleNodeClick = useCallback((nodeId: string) => {
    const node = derived.currentGraph?.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setSelection(prev => {
      const exists = prev.find(s => s.id === nodeId);
      if (exists) return prev;
      return [...prev, { id: nodeId, type: 'node', label: node.data.label || 'ノード' }];
    });
    setActiveTabId(nodeId);
  }, [derived]);

  // --- (5) プロジェクト管理 ---
  const resetProjectState = useCallback(() => {
    setPages({});
    setPageOrder([]);
    setSelectedPageId(null);
    setSelection([]);
    setActiveTabId(null);
    setActiveLogicGraphId(null);
    setIsPreviewing(false);
    setPreviewState({});
    setVariables({});
  }, []);

  const handleNewProject = useCallback(() => {
    const name = prompt("新しいプロジェクト名を入力してください:", "新規プロジェクト");
    if (!name) return;
    setProjectName(name);
    resetProjectState();
    const initialPageId = `page-${Date.now()}`;
    const initialPage: PageData = { id: initialPageId, name: "Page 1", placedItems: [], allItemLogics: {} };
    setPages({ [initialPageId]: initialPage });
    setPageOrder([initialPageId]);
    setSelectedPageId(initialPageId);
    setView("editor");
  }, [resetProjectState]);

  const handleGoHome = useCallback(() => {
    if (window.confirm("ホームに戻ると、保存していない変更は失われます。よろしいですか？")) {
      setView("home");
      setProjectName("");
      resetProjectState();
    }
  }, [resetProjectState]);

  const handleExportProject = useCallback(() => {
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
  }, [projectName, pages, pageOrder, variables]);

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

  const handleAddPage = useCallback(() => {
    const newPageName = prompt("新しいページ名を入力してください:", `Page ${pageOrder.length + 1}`);
    if (!newPageName) return;
    const newPageId = `page-${Date.now()}`;
    const newPage: PageData = { id: newPageId, name: newPageName, placedItems: [], allItemLogics: {} };
    setPages(prev => ({ ...prev, [newPageId]: newPage }));
    setPageOrder(prev => [...prev, newPageId]);
    setSelectedPageId(newPageId);
    setSelection([]);
    setActiveTabId(null);
    setActiveLogicGraphId(null);
  }, [pageOrder.length]);

  const handleSelectPage = useCallback((pageId: string) => {
    if (pageId === selectedPageId) return;
    setSelectedPageId(pageId);
    setSelection([]);
    setActiveTabId(null);
    setActiveLogicGraphId(null);
  }, [selectedPageId]);

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setSelection(prev => prev);
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
    if (activeTabId === idToClose) newActiveTabId = null;

    if (closedEntry.type === 'item' && activeLogicGraphId === idToClose) {
      const graph = derived.allItemLogics[idToClose];
      if (graph) {
        const nodeIds = graph.nodes.map(n => n.id);
        newSelection = newSelection.filter(s => !nodeIds.includes(s.id));
        if (newActiveTabId && nodeIds.includes(newActiveTabId)) newActiveTabId = null;
      }
      setActiveLogicGraphId(null);
    }

    setSelection(newSelection);
    setActiveTabId(newActiveTabId);
  }, [selection, activeTabId, activeLogicGraphId, derived]);

  const handlePageChangeRequest = useCallback((targetPageId: string) => {
    setPages(prev => {
      if (!prev[targetPageId]) {
        console.warn(`[App] 存在しないページ (ID: ${targetPageId}) への遷移リクエスト`);
        return prev;
      }
      return prev;
    });

    if (!pages[targetPageId]) {
      console.warn(`[App] 存在しないページ (ID: ${targetPageId}) への遷移リクエスト`);
      return;
    }

    setSelectedPageId(targetPageId);

    const targetPageData = pages[targetPageId];
    const initialPreviewState: PreviewState = {};
    targetPageData.placedItems.forEach(item => {
      initialPreviewState[item.id] = { isVisible: true, x: item.x, y: item.y, opacity: 1, scale: 1, rotation: 0, transition: null };
    });
    setPreviewState(initialPreviewState);
  }, [pages]);

  const handleTogglePreview = useCallback(() => {
    setIsPreviewing(prev => {
      const next = !prev;
      if (next) {
        setPreviewState(ps => {
          const initial: PreviewState = {};
          derived.placedItems.forEach(item => {
            initial[item.id] = { isVisible: true, x: item.x, y: item.y, opacity: 1, scale: 1, rotation: 0, transition: null };
          });
          return initial;
        });
      } else {
        setPreviewState({});
      }
      return next;
    });
  }, [derived]);

  const handleVariableChangeFromItem = useCallback((variableName: string, value: any) => {
    if (!variableName) return;
    setVariables(prev => {
      const newVars = { ...prev, [variableName]: value };
      variablesRef.current = newVars;
      return newVars;
    });
  }, []);

  const handleItemEvent = useCallback((eventName: string, itemId: string) => {
    if (!selectedPageId) return;
    const targetGraph = pages[selectedPageId]?.allItemLogics[itemId];
    if (!targetGraph) {
      console.warn(`[App] ${itemId} に紐づくロジックグラフがありません`);
      return;
    }

    triggerEvent(
      eventName,
      itemId,
      targetGraph,
      () => previewStateRef.current,
      (newState: PreviewState) => { previewStateRef.current = newState; setPreviewState(newState); },
      handlePageChangeRequest,
      () => variablesRef.current,
      (newVars: VariableState) => { variablesRef.current = newVars; setVariables(newVars); }
    );
  }, [selectedPageId, pages, handlePageChangeRequest]);

  // --- useMemo: context value を安定化 ---
  const contextValue: EditorContextType = useMemo(() => ({
    pages,
    pageOrder,
    selectedPageId,
    isPreviewing,
    previewState,
    variables,
    placedItems: derived.placedItems,
    allItemLogics: derived.allItemLogics,
    currentGraph: derived.currentGraph,
    selection,
    activeTabId,
    activeLogicGraphId,
    pageInfoList,
    nodeGraphTemplates: NODE_GRAPH_TEMPLATES,

    onSelectPage: handleSelectPage,
    onAddPage: handleAddPage,
    onItemEvent: handleItemEvent,
    onVariableChange: handleVariableChangeFromItem,
    setPlacedItems: setPlacedItemsForCurrentPage,
    setAllItemLogics: setAllItemLogicsForCurrentPage,
    onItemUpdate: handleItemUpdate,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onAddNode: handleAddNode,
    onNodeDataChange: handleNodeDataChange,
    onItemSelect: handleItemSelect,
    onBackgroundClick: handleBackgroundClick,
    onNodeClick: handleNodeClick,
    onTabSelect: handleTabSelect,
    onTabClose: handleCloseTab,
  }), [
    pages, pageOrder, selectedPageId, isPreviewing, previewState, variables,
    selection, activeTabId, activeLogicGraphId,
    handleSelectPage, handleAddPage, handleItemEvent, handleVariableChangeFromItem,
    setPlacedItemsForCurrentPage, setAllItemLogicsForCurrentPage, handleItemUpdate,
    onNodesChange, onEdgesChange, onConnect, handleAddNode, handleNodeDataChange,
    handleItemSelect, handleBackgroundClick, handleNodeClick, handleTabSelect, handleCloseTab,
    derived, pageInfoList
  ]);

  if (view === "home") {
    return <HomeScreen onNewProject={handleNewProject} onImportProject={handleImportProject} />;
  }

  return (
    <EditorContext.Provider value={contextValue}>
      <EditorView
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={handleGoHome}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onTogglePreview={handleTogglePreview}
      />
    </EditorContext.Provider>
  );
}

export default App;
