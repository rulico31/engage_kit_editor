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
  // ↓↓↓↓↓↓↓↓↓↓ (1) 接続用の関数と型をインポート ↓↓↓↓↓↓↓↓↓↓
  addEdge,
  type Connection,
  type OnConnect,
  // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
} from "reactflow";

import Artboard from "./components/Artboard";
import ToolboxItem from "./components/ToolboxItem";
import PropertiesPanel from "./components/PropertiesPanel";
import NodeEditor from "./components/NodeEditor";
import type { PlacedItemType } from "./types";

// (型定義は変更なし)
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}
const NODE_GRAPH_TEMPLATES: Record<string, NodeGraph> = {
  "ボタン": {
    nodes: [{ id: "btn-click", type: "eventNode", data: { label: "🎬 イベント: ボタンがクリックされた時" }, position: { x: 50, y: 50 }, }, ],
    edges: [],
  },
  "テキスト": {
    nodes: [{ id: "text-load", type: "eventNode", data: { label: "🎬 イベント: テキスト表示時" }, position: { x: 50, y: 50 }, }, ],
    edges: [],
  },
  "画像": {
    nodes: [{ id: "img-load", type: "eventNode", data: { label: "🎬 イベント: 画像読み込み完了時" }, position: { x: 50, y: 50 }, }, ],
    edges: [],
  },
  "Default": {
    nodes: [{ id: "default-load", type: "eventNode", data: { label: "🎬 イベント: ページ読み込み時" }, position: { x: 50, y: 50 }, }, ],
    edges: [],
  },
};


function App() {
  // --- State (変更なし) ---
  const [placedItems, setPlacedItems] = useState<PlacedItemType[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [allItemLogics, setAllItemLogics] = useState<Record<string, NodeGraph>>(
    {}
  );

  // --- 選択中アイテムの情報を計算 (変更なし) ---
  const selectedItem =
    placedItems.find((item) => item.id === selectedItemId) || null;
  const currentGraph: NodeGraph | undefined = selectedItemId
    ? allItemLogics[selectedItemId]
    : undefined;

  // --- 更新用関数 (変更なし) ---
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
    if (!selectedItemId) return;
    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[selectedItemId];
      if (!currentGraph) return prevLogics;
      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      return {
        ...prevLogics,
        [selectedItemId]: { ...currentGraph, nodes: newNodes },
      };
    });
  }, [selectedItemId]);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    if (!selectedItemId) return;
    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[selectedItemId];
      if (!currentGraph) return prevLogics;
      const newEdges = applyEdgeChanges(changes, currentGraph.edges);
      return {
        ...prevLogics,
        [selectedItemId]: { ...currentGraph, edges: newEdges },
      };
    });
  }, [selectedItemId]);

  // ↓↓↓↓↓↓↓↓↓↓ (2) onConnect ハンドラを新設 ↓↓↓↓↓↓↓↓↓↓
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!selectedItemId) return; // 選択中でなければ何もしない

    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[selectedItemId];
      if (!currentGraph) return prevLogics;

      // addEdge ユーティリティを使って、新しい接続線を edges 配列に追加
      const newEdges = addEdge(connection, currentGraph.edges);

      return {
        ...prevLogics,
        [selectedItemId]: {
          ...currentGraph,
          edges: newEdges, // 更新された edges をセット
        },
      };
    });
  }, [selectedItemId]);
  // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

  // (削除機能・useEffect は変更なし)
  const handleDeleteItem = useCallback(() => {
    if (!selectedItemId) return; 
    setPlacedItems((prevItems) =>
      prevItems.filter((item) => item.id !== selectedItemId)
    );
    setAllItemLogics((prevLogics) => {
      const newLogics = { ...prevLogics };
      delete newLogics[selectedItemId];
      return newLogics;
    });
    setSelectedItemId(null);
  }, [selectedItemId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
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

  // (ノード追加関数は変更なし)
  const handleAddNode = useCallback((newNode: Node) => {
    if (!selectedItemId) return;

    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[selectedItemId];
      if (!currentGraph) return prevLogics;

      return {
        ...prevLogics,
        [selectedItemId]: {
          ...currentGraph,
          nodes: [...currentGraph.nodes, newNode],
        },
      };
    });
  }, [selectedItemId]);

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
              <Artboard
                placedItems={placedItems}
                setPlacedItems={setPlacedItems}
                setSelectedItemId={setSelectedItemId}
                selectedItemId={selectedItemId}
                setAllItemLogics={setAllItemLogics}
                nodeGraphTemplates={NODE_GRAPH_TEMPLATES}
              />
            </div>
          </Panel>

          {/* (B-3) 右エリア (プロパティ) */}
          <Panel defaultSize={25} minSize={15} className="panel-content">
            <div className="panel-header">プロパティ</div>
            <PropertiesPanel
              item={selectedItem}
              onUpdate={handleItemUpdate}
            />
          </Panel>
        </PanelGroup>
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      {/* (A-2) 下部エリア (ノードエディタ) */}
      <Panel defaultSize={25} minSize={15} className="panel-content">
        <div className="panel-header">ノードエディタ</div>
        
        {/* ↓↓↓↓↓↓↓↓↓↓ (3) onConnect を NodeEditor に渡す ↓↓↓↓↓↓↓↓↓↓ */}
        <NodeEditor
          nodes={currentGraph?.nodes}
          edges={currentGraph?.edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeAdd={handleAddNode}
          onConnect={onConnect} // (新しく追加)
        />
        {/* ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑ */}
      </Panel>
    </PanelGroup>
  );
}

export default App;