// src/App.tsx

import React, { useState, useCallback, useEffect } from "react";
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
import type { PlacedItemType } from "./types";
import HomeScreen from "./components/HomeScreen";
import ProjectNameModal from "./components/ProjectNameModal";

// (型定義)
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}
export interface ProjectData {
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
}

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


function App() {
  // --- (2) State (モーダルとプロジェクト名を追加) ---
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  // ↓↓↓↓↓↓↓↓↓↓ (修正) setlsNameModalOpen -> setIsNameModalOpen ↓↓↓↓↓↓↓↓↓↓
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [projectName, setProjectName] = useState<string>("Untitled Project");
  // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
  
  const [placedItems, setPlacedItems] = useState<PlacedItemType[]>([]);
  const [allItemLogics, setAllItemLogics] = useState<Record<string, NodeGraph>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null);

  // --- (3) 選択中アイテム/ノードの情報を計算 (変更なし) ---
  const selectedItem =
    placedItems.find((item) => item.id === selectedItemId) || null;
  const currentGraph: NodeGraph | undefined = activeLogicGraphId
    ? allItemLogics[activeLogicGraphId]
    : undefined;

  // --- (4) 更新用コールバック関数 (変更なし) ---
  const handleItemUpdate = (itemId: string, updatedProps: Partial<PlacedItemType>) => {
    setPlacedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, ...updatedProps }
          : item
      )
    );
  };
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    if (!activeLogicGraphId) return;
    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[activeLogicGraphId];
      if (!currentGraph) return prevLogics;
      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      return { ...prevLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
    });
  }, [activeLogicGraphId]);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    if (!activeLogicGraphId) return;
    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[activeLogicGraphId];
      if (!currentGraph) return prevLogics;
      const newEdges = applyEdgeChanges(changes, currentGraph.edges);
      return { ...prevLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
    });
  }, [activeLogicGraphId]);
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!activeLogicGraphId) return; 
    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[activeLogicGraphId];
      if (!currentGraph) return prevLogics;
      const newEdges = addEdge(connection, currentGraph.edges);
      return { ...prevLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
    });
  }, [activeLogicGraphId]);
  const handleAddNode = useCallback((newNode: Node) => {
    if (!activeLogicGraphId) return;
    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[activeLogicGraphId];
      if (!currentGraph) return prevLogics;
      return { ...prevLogics, [activeLogicGraphId]: { ...currentGraph, nodes: [...currentGraph.nodes, newNode] } };
    });
  }, [activeLogicGraphId]);
  const handleNodeDataChange = useCallback((nodeId: string, dataUpdate: any) => {
      if (!activeLogicGraphId) return;
      setAllItemLogics((prevLogics) => {
        const currentGraph = prevLogics[activeLogicGraphId];
        if (!currentGraph) return prevLogics;
        const newNodes = currentGraph.nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...dataUpdate } };
          }
          return node;
        });
        return { ...prevLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      });
    }, [activeLogicGraphId]);
  const handleDeleteItem = useCallback(() => {
    if (!selectedItemId) return;
    setPlacedItems((prevItems) => prevItems.filter((item) => item.id !== selectedItemId));
    setAllItemLogics((prevLogics) => {
      const newLogics = { ...prevLogics };
      delete newLogics[selectedItemId];
      return newLogics;
    });
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  }, [selectedItemId]);
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

  // --- (5) 選択/ナビゲーション関数 (変更なし) ---
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
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
  };
  
  // --- (6) 新規プロジェクトのロジック ---
  
  // (A) ホーム画面の「新規作成」ボタンが押された時
  const handleNewProjectClick = () => {
    // ↓↓↓↓↓↓↓↓↓↓ (修正) setlsNameModalOpen -> setIsNameModalOpen ↓↓↓↓↓↓↓↓↓↓
    setIsNameModalOpen(true);
  };

  // (B) モーダルが閉じられた時
  const handleCloseModal = () => {
    setIsNameModalOpen(false);
    // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
  };
  
  // (C) モーダルの「作成」ボタンが押された時
  const handleConfirmNewProject = (name: string) => {
    setPlacedItems([]);
    setAllItemLogics({});
    setSelectedItemId(null);
    setSelectedNodeId(null);
    setActiveLogicGraphId(null);
    // ↓↓↓↓↓↓↓↓↓↓ (修正) setProjectName を使用 ↓↓↓↓↓↓↓↓↓↓
    setProjectName(name); 
    setIsNameModalOpen(false);
    setIsProjectLoaded(true);
    // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
  };


  // --- (7) 保存・読み込み関数 (変更なし) ---
  const handleExportProject = useCallback(() => {
    const projectData: ProjectData = {
      placedItems: placedItems,
      allItemLogics: allItemLogics,
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
  }, [placedItems, allItemLogics, projectName]);

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

        if (projectData && projectData.placedItems && projectData.allItemLogics) {
          setPlacedItems(projectData.placedItems);
          setAllItemLogics(projectData.allItemLogics);
          setSelectedItemId(null);
          setSelectedNodeId(null);
          setActiveLogicGraphId(null);
          setProjectName(file.name.replace(/\.json$/, ""));
          // ↓↓↓↓↓↓↓↓↓↓ (修正) setProjectLoaded -> setIsProjectLoaded ↓↓↓↓↓↓↓↓↓↓
          setIsProjectLoaded(true); 
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
  
  // --- (8) メインの return (画面切り替え) ---
  return (
    <div className="app-container">
      {/* (A) ホーム画面 or エディタ画面 */}
      {/* ↓↓↓↓↓↓↓↓↓↓ (修正) isProjectLoaded を使用 ↓↓↓↓↓↓↓↓↓↓ */}
      {!isProjectLoaded ? (
        <HomeScreen 
          onNewProject={handleNewProjectClick} // (handleNewProject -> handleNewProjectClick)
          onLoadProject={handleImportProject}
        />
      ) : (
      // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
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
            </div>
          </header>
          
          {/* (B-2) 5パネルエディタ本体 */}
          <PanelGroup direction="vertical" className="container">
            {/* (A-1) 上部メインエリア */}
            <Panel defaultSize={75} minSize={30}>
              <PanelGroup direction="horizontal">
                {/* (B-1) 左エリア */}
                <Panel defaultSize={20} minSize={15} className="panel-column">
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={40} minSize={20} className="panel-content">
                      <div className="panel-header">ツールボックス</div>
                      <div className="tool-list">
                        <ToolboxItem name="テキスト" />
                        <ToolboxItem name="ボタン" />
                        <ToolboxItem name="画像" />
                      </div>
                    </Panel>
                    <PanelResizeHandle className="resize-handle" />
                    <Panel defaultSize={60} minSize={20} className="panel-content">
                      <div className="panel-header">コンテンツブラウザ</div>
                    </Panel>
                  </PanelGroup>
                </Panel>
                <PanelResizeHandle className="resize-handle" />
                {/* (B-2) 中央エリア (キャンバス) */}
                <Panel defaultSize={55} minSize={30} className="panel-content">
                  <div className="panel-header">キャンバス</div>
                  <div className="canvas-viewport">
                    <Artboard
                      placedItems={placedItems}
                      setPlacedItems={setPlacedItems}
                      onItemSelect={handleItemSelect}
                      onBackgroundClick={handleBackgroundClick}
                      selectedItemId={selectedItemId}
                      setAllItemLogics={setAllItemLogics}
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
                    placedItems={placedItems}
                    allItemLogics={allItemLogics}
                    onItemUpdate={handleItemUpdate}
                    onNodeDataChange={handleNodeDataChange}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            {/* (A-2) 下部エリア (ノードエディタ) */}
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={25} minSize={15} className="panel-content">
              <div className="panel-header">ノードエディタ</div>
              <NodeEditor
                nodes={currentGraph?.nodes}
                edges={currentGraph?.edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeAdd={handleAddNode}
                onConnect={onConnect}
                placedItems={placedItems} 
                onNodeDataChange={handleNodeDataChange}
                onNodeClick={handleNodeClick}
              />
            </Panel>
          </PanelGroup>
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