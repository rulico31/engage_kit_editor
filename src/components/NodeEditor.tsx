// src/components/NodeEditor.tsx

import React, { useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "reactflow";

import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import NodeToolboxItem from "./NodeToolboxItem";

import "reactflow/dist/style.css";
import "./NodeEditor.css";

import EventNode from "./nodes/EventNode";
import ActionNode from "./nodes/ActionNode";

const nodeTypes = {
  eventNode: EventNode,
  actionNode: ActionNode,
};

// --- Props の型定義 ---
interface NodeEditorProps {
  nodes: Node[] | undefined;
  edges: Edge[] | undefined;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeAdd: (newNode: Node) => void;
  onConnect: OnConnect;
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
}) => {
  const { fitView, project } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ↓↓↓↓↓↓↓↓↓↓ (最重要) useDropフックの構文を修正 ↓↓↓↓↓↓↓↓↓↓
  const [{ isOver }, drop] = useDrop(
    // (1) 第1引数: 設定を返す関数
    () => ({
      accept: ItemTypes.NODE_TOOL,
      collect: (monitor: DropTargetMonitor) => ({ // (monitor に型を追加)
        isOver: !!monitor.isOver(),
      }),
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
    // (2) 第2引数: 依存配列
    [project, onNodeAdd]
  );
  // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

  drop(dropRef); // drop コネクタを ref に接続

  // (useEffect は変更なし)
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      fitView({ duration: 200 });
    }
  }, [nodes ? nodes[0]?.id : undefined, fitView]);

  // (placeholder の return)
  if (!nodes || !edges) {
    return (
      <div className="node-editor-placeholder">
        アートボード上のアイテムを選択して、ロジックの編集を開始します。
      </div>
    );
  }

  // (メインの return)
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
          nodeType="actionNode"
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
          {/* <MiniMap /> (削除済み) */}
        </ReactFlow>
        {isOver && <div className="react-flow-drop-overlay" />}
      </div>
    </div>
  );
};

// (Wrapper)
import { ReactFlowProvider } from "reactflow";

const NodeEditorWrapper: React.FC<NodeEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NodeEditor {...props} />
    </ReactFlowProvider>
  );
};

export default NodeEditorWrapper;