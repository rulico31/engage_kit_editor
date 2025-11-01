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
  type NodeProps, // (NodeProps をインポート)
} from "reactflow";

import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import NodeToolboxItem from "./NodeToolboxItem";
import type { PlacedItemType } from "../types";

import "reactflow/dist/style.css";
import "./NodeEditor.css";

import EventNode from "./nodes/EventNode";
import ActionNode from "./nodes/ActionNode";
import IfNode from "./nodes/IfNode"; // (IfNode をインポート)

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
}

// (ドラッグアイテムの型)
interface NodeToolDragItem {
  nodeType: string;
  nodeName: string;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeAdd,
  onConnect,
  placedItems,
  onNodeDataChange,
}) => {
  // (フック定義は変更なし)
  const { fitView, project } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.NODE_TOOL,
      collect: (monitor: DropTargetMonitor) => ({ isOver: !!monitor.isOver() }),
      drop: (item: NodeToolDragItem, monitor: DropTargetMonitor) => {
        const { nodeType, nodeName } = item;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !dropRef.current) return;
        const position = project({
          x: clientOffset.x - (dropRef.current.getBoundingClientRect().left ?? 0),
          y: clientOffset.y - (dropRef.current.getBoundingClientRect().top ?? 0),
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
  drop(dropRef);
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      fitView({ duration: 200 });
    }
  }, [nodes ? nodes[0]?.id : undefined, fitView]);

  // (nodeTypes の useMemo)
  const nodeTypes = useMemo(() => {
    const wrappedEventNode = (props: NodeProps) => (
      <EventNode {...props} />
    );
    const wrappedActionNode = (props: NodeProps) => (
      <ActionNode
        {...props} 
        placedItems={placedItems}
        onDataChange={onNodeDataChange} 
      />
    );
    // ↓↓↓↓↓↓↓↓↓↓ (修正) IfNode にも props を渡す ↓↓↓↓↓↓↓↓↓↓
    const wrappedIfNode = (props: NodeProps) => (
      <IfNode 
        {...props} 
        placedItems={placedItems}
        onDataChange={onNodeDataChange} 
      />
    );
    // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

    return {
      eventNode: wrappedEventNode,
      actionNode: wrappedActionNode,
      ifNode: wrappedIfNode, // (IfNode を登録)
    };
  }, [placedItems, onNodeDataChange]);

  // (placeholder の return は変更なし)
  if (!nodes || !edges) {
    return (
      <div className="node-editor-placeholder">
        アートボード上のアイテムを選択して、ロジックの編集を開始します。
      </div>
    );
  }

  // (メインの return は変更なし)
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
        <NodeToolboxItem
          nodeType="ifNode"
          nodeName="🧠 ロジック: もし〜なら"
        >
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

// (Wrapper は変更なし)
import { ReactFlowProvider } from "reactflow";
const NodeEditorWrapper: React.FC<NodeEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NodeEditor {...props} />
    </ReactFlowProvider>
  );
};

export default NodeEditorWrapper;