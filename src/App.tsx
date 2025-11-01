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
import type { PlacedItemType } from "./types";

// ↓↓↓↓↓↓↓↓↓↓ (1) 【最重要】この型定義が正しい位置に必要です ↓↓↓↓↓↓↓↓↓↓
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}
// ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

// (テンプレート定義)
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
  // --- State ---
  const [placedItems, setPlacedItems] = useState<PlacedItemType[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [allItemLogics, setAllItemLogics] = useState<Record<string, NodeGraph>>(
    {}
  );

  // --- 選択中アイテムの計算 ---
  const selectedItem =
    placedItems.find((item) => item.id === selectedItemId) || null;
  
  const currentGraph: NodeGraph | undefined = selectedItemId
    ? allItemLogics[selectedItemId]
    : undefined;

  // --- 更新用関数 ---
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

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!selectedItemId) return; 

    setAllItemLogics((prevLogics) => {
      const currentGraph = prevLogics[selectedItemId];
      if (!currentGraph) return prevLogics;
      const newEdges = addEdge(connection, currentGraph.edges);
      return {
        ...prevLogics,
        [selectedItemId]: {
          ...currentGraph,
          edges: newEdges,
        },
      };
    });
  }, [selectedItemId]);

  // (削除機能)
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

  // (キーボードリスナー)
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

  // (ノード追加)
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
  
  // (ノード内部データ変更)
  const handleNodeDataChange = useCallback(
    (nodeId: string, dataUpdate: any) => {
      if (!selectedItemId) return;

      setAllItemLogics((prevLogics) => {
        const currentGraph = prevLogics[selectedItemId];
        if (!currentGraph) return prevLogics;

        const newNodes = currentGraph.nodes.map((node) => { // (エラー Ln70 はここで発生)
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...dataUpdate, 
              },
            };
          }
          return node;
        });

        return {
          ...prevLogics,
          [selectedItemId]: {
            ...currentGraph,
            nodes: newNodes,
          },
        };
      });
    },
    [selectedItemId]
  );

  return (
    <PanelGroup direction="vertical" className="container">
      {/* ( ... 上部パネル (変更なし) ... ) */}
      <Panel defaultSize={75} minSize={30}>
        <PanelGroup direction="horizontal">
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
        
        <NodeEditor
          nodes={currentGraph?.nodes} // (エラー Ln110 はここで発生)
          edges={currentGraph?.edges} // (エラー Ln111 はここで発生)
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeAdd={handleAddNode}
          onConnect={onConnect}
          placedItems={placedItems} 
          onNodeDataChange={handleNodeDataChange}
        />
      </Panel>
    </PanelGroup>
  );
}

export default App;