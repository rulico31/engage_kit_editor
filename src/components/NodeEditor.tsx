// src/components/NodeEditor.tsx

import React, { useRef, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeProps,
  ReactFlowProvider,
  // --- (1) OnNodeClick を import から削除 ---
} from "reactflow";

import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import NodeToolboxItem from "./NodeToolboxItem";
import type { PlacedItemType } from "../types";

import "reactflow/dist/style.css";
import "./NodeEditor.css";

import EventNode from "./nodes/EventNode";
import ActionNode from "./nodes/ActionNode";
import IfNode from "./nodes/IfNode";

// --- Props の型定義 ---
interface NodeEditorProps {
  nodes: Node[] | undefined;
  edges: Edge[] | undefined;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeAdd: (newNode: Node) => void;
  onConnect: OnConnect;
  placedItems: PlacedItemType[];
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
  onNodeClick: (nodeId: string) => void;
}

// --- ドラッグアイテムの型 ---
interface NodeToolDragItem {
  nodeType: string;
  nodeName: string;
}

// --- (2) Nodeクリックハンドラ型定義（React Flow v11以降対応）---
type NodeClickHandler = (event: React.MouseEvent, node: Node) => void;

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeAdd,
  onConnect,
  placedItems,
  onNodeDataChange,
  onNodeClick,
}) => {
  const { fitView, project } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // useDrop フック
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.NODE_TOOL,
      collect: (monitor: DropTargetMonitor) => ({
        isOver: !!monitor.isOver(),
      }),
      drop: (item: NodeToolDragItem, monitor: DropTargetMonitor) => {
        const { nodeType, nodeName } = item;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !dropRef.current) return;

        const position = project({
          x:
            clientOffset.x -
            (dropRef.current.getBoundingClientRect().left ?? 0),
          y:
            clientOffset.y -
            (dropRef.current.getBoundingClientRect().top ?? 0),
        });

        const newNode: Node = {
          id: `node-${Date.now()}`,
          type: nodeType,
          position,
          data: { label: nodeName },
        };

        onNodeAdd(newNode);
      },
    }),
    [project, onNodeAdd]
  );
  drop(dropRef); // drop コネクタを ref に接続

  // ノード変更時にビューをフィット
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      fitView({ duration: 200 });
    }
  }, [nodes ? nodes[0]?.id : undefined, fitView]);

  // (ユーザー要望) nodeTypes の useMemo (props を中継)
  const nodeTypes = useMemo(() => {
    const wrappedEventNode = (props: NodeProps) => <EventNode {...props} />;
    
    const wrappedActionNode = (props: NodeProps) => (
      <ActionNode
        {...props} 
        placedItems={placedItems}
        onDataChange={onNodeDataChange} 
      />
    );
    const wrappedIfNode = (props: NodeProps) => (
      <IfNode 
        {...props} 
        placedItems={placedItems}
        onDataChange={onNodeDataChange} 
      />
    );

    return {
      eventNode: wrappedEventNode,
      actionNode: wrappedActionNode,
      ifNode: wrappedIfNode,
    };
  }, [placedItems, onNodeDataChange]);

  // --- (3) handleNodeClick の型注釈を修正 ---
  const handleNodeClick: NodeClickHandler = (event, node) => {
    onNodeClick(node.id);
  };

  // --- ノード未定義時のプレースホルダー ---
  if (!nodes || !edges) {
    return (
      <div className="node-editor-placeholder">
        アートボード上のアイテムを選択して、ロジックの編集を開始します。
      </div>
    );
  }

  // --- メインの return ---
  return (
    <div className="node-editor-wrapper" ref={reactFlowWrapper}>
      {/* ツールボックス */}
      <aside className="node-toolbox">
        <div className="toolbox-header">ロジックノード</div>
        <NodeToolboxItem
          nodeType="actionNode"
          nodeName="⚡ アクション: 表示/非表示"
        >
          ⚡ 表示/非表示
        </NodeToolboxItem>
        <NodeToolboxItem nodeType="ifNode" nodeName="🧠 ロジック: もし〜なら">
          🧠 もし〜なら
        </NodeToolboxItem>
      </aside>

      {/* React Flow キャンバス */}
      <div ref={dropRef} className="react-flow-drop-target">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          className="react-flow-canvas"
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls className="rf-controls-dark" />
        </ReactFlow>
        {isOver && <div className="react-flow-drop-overlay" />}
      </div>
    </div>
  );
};

// --- Wrapper コンポーネント ---
const NodeEditorWrapper: React.FC<NodeEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NodeEditor {...props} />
    </ReactFlowProvider>
  );
};

export default NodeEditorWrapper;