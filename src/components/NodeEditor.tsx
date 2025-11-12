// src/components/NodeEditor.tsx

// (★ 変更なし)
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
} from "reactflow";

import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import NodeToolboxItem from "./NodeToolboxItem";
// (★ 変更なし) Context をインポート
import { useEditorContext } from "../contexts/EditorContext";

import "reactflow/dist/style.css";
import "./NodeEditor.css";

import EventNode from "./nodes/EventNode";
import ActionNode from "./nodes/ActionNode";
import IfNode from "./nodes/IfNode";
import PageNode from "./nodes/PageNode.tsx";
import SetVariableNode from "./nodes/SetVariableNode.tsx";
import AnimateNode from "./nodes/AnimateNode.tsx";
import DelayNode from "./nodes/DelayNode.tsx";

// --- Props の型定義 ---
// (★ 変更なし) Props の定義を削除
interface NodeEditorProps {}

// --- ドラッグアイテムの型 ---
interface NodeToolDragItem {
  nodeType: string;
  nodeName: string;
}

// (★ 変更なし) Nodeクリックハンドラ型定義
type NodeClickHandler = (event: React.MouseEvent, node: Node) => void;

// (★ 変更なし) Props を受け取らない
const NodeEditor: React.FC<NodeEditorProps> = () => {

  // (★ 変更なし) Context から必要なデータ/関数を取得
  const {
    currentGraph,
    onNodesChange,
    onEdgesChange,
    onAddNode,
    onConnect,
    onNodeClick,
  } = useEditorContext();
  
  const nodes = currentGraph?.nodes;
  const edges = currentGraph?.edges;


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

        const newNodeData: any = { label: nodeName };
        if (nodeType === 'delayNode') {
          newNodeData.durationS = 1.0; 
        }

        const newNode: Node = {
          id: `node-${Date.now()}`,
          type: nodeType,
          position,
          data: newNodeData,
        };

        onAddNode(newNode);
      },
    }),
    [project, onAddNode]
  );
  drop(dropRef); // drop コネクタを ref に接続

  // ノード変更時にビューをフィット
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      fitView({ duration: 200 });
    }
  }, [nodes ? nodes[0]?.id : undefined, fitView]);

  // (★ 変更なし) nodeTypes の useMemo
  const nodeTypes = useMemo(() => {
    const wrappedEventNode = (props: NodeProps) => <EventNode {...props} />;
    const wrappedActionNode = (props: NodeProps) => ( <ActionNode {...props} /> );
    const wrappedIfNode = (props: NodeProps) => ( <IfNode {...props} /> );
    const wrappedPageNode = (props: NodeProps) => ( <PageNode {...props} /> );
    const wrappedSetVariableNode = (props: NodeProps) => ( <SetVariableNode {...props} /> );
    const wrappedAnimateNode = (props: NodeProps) => (
      <AnimateNode {...props} />
    );
    const wrappedDelayNode = (props: NodeProps) => (
      <DelayNode {...props} />
    );

    return {
      eventNode: wrappedEventNode,
      actionNode: wrappedActionNode,
      ifNode: wrappedIfNode,
      pageNode: wrappedPageNode,
      setVariableNode: wrappedSetVariableNode,
      animateNode: wrappedAnimateNode,
      delayNode: wrappedDelayNode,
    };
  }, []); 

  // (★ 変更なし) handleNodeClick
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
        <NodeToolboxItem
          nodeType="animateNode"
          nodeName="⚡ アクション: アニメーション"
        >
          ⚡ アニメーション
        </NodeToolboxItem>
        <NodeToolboxItem
          nodeType="pageNode"
          nodeName="⚡ アクション: ページ遷移"
        >
          ⚡ ページ遷移
        </NodeToolboxItem>
        <NodeToolboxItem
          nodeType="setVariableNode"
          nodeName="⚡ アクション: 変数をセット"
        >
          ⚡ 変数をセット
        </NodeToolboxItem>
        <NodeToolboxItem nodeType="delayNode" nodeName="⏱️ ロジック: 遅延">
          ⏱️ 遅延 (Wait)
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
// (★ 変更なし) Props を受け取らない
const NodeEditorWrapper: React.FC = (props) => {
  return (
    <ReactFlowProvider>
      {/* (★) props を渡さない */}
      <NodeEditor />
    </ReactFlowProvider>
  );
};

// (★ 変更なし) NodeEditorWrapper コンポーネント自体をメモ化
export default React.memo(NodeEditorWrapper);