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

export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}

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
  // --- (1) (タスク1) State の拡張 ---
  const [placedItems, setPlacedItems] = useState<PlacedItemType[]>([]);
  const [allItemLogics, setAllItemLogics] = useState<Record<string, NodeGraph>>({});
  
  // (新) 選択状態
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // アートボード上の選択
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null); // ノードエディタ上の選択
  const [activeLogicGraphId, setActiveLogicGraphId] = useState<string | null>(null); // 現在開いているグラフのID

  // --- (2) 選択中アイテム/ノードの情報を計算 ---
  const selectedItem =
    placedItems.find((item) => item.id === selectedItemId) || null;
  
  const currentGraph: NodeGraph | undefined = activeLogicGraphId
    ? allItemLogics[activeLogicGraphId]
    : undefined;

  // --- (3) 更新用コールバック関数 ---
  const handleItemUpdate = (
    itemId: string,
    updatedProps: Partial<PlacedItemType>
  ) => {
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
  
  // (タスク1) ノード内部データ変更用コールバック
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

  // --- (4) (タスク2) 相互排他ロジック ---
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

  // (onNodeClick)
  const handleNodeClick = (nodeId: string) => {
    setSelectedItemId(null); // アイテム選択を解除
    setSelectedNodeId(nodeId);
    // (activeLogicGraphId は変更しない)
  };
  
  return (
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
              {/* (5) Artboard に新しいハンドラを渡す */}
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
            {/* (6) (タスク3) PropertiesPanel にすべてを渡す */}
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

      <PanelResizeHandle className="resize-handle" />

      {/* (A-2) 下部エリア (ノードエディタ) */}
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
          onNodeClick={handleNodeClick} // (onNodeClick を渡す)
        />
      </Panel>
    </PanelGroup>
  );
}

export default App;