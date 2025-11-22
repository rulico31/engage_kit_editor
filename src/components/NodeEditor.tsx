// src/components/NodeEditor.tsx

import React, { useRef, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  type Node,
  type NodeProps,
  ReactFlowProvider, 
} from "reactflow";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import NodeToolboxItem from "./NodeToolboxItem";
import "reactflow/dist/style.css";
import "./NodeEditor.css";

// ★ Zustand ストアをインポート
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";

// ノードコンポーネント
import EventNode from "./nodes/EventNode";
import ActionNode from "./nodes/ActionNode";
import IfNode from "./nodes/IfNode";
import PageNode from "./nodes/PageNode";
import SetVariableNode from "./nodes/SetVariableNode";
import AnimateNode from "./nodes/AnimateNode";
import DelayNode from "./nodes/DelayNode";
import WaitForClickNode from "./nodes/WaitForClickNode";

interface NodeToolDragItem { nodeType: string; nodeName: string; }
type NodeClickHandler = (event: React.MouseEvent, node: Node) => void;

// ★ 内部コンポーネント: ReactFlowProvider の子として動作する
const NodeEditorContent: React.FC = () => {
  const activeLogicGraphId = useSelectionStore((s) => s.activeLogicGraphId);

  const { allItemLogics } = usePageStore((s) => {
    const page = s.selectedPageId ? s.pages[s.selectedPageId] : undefined;
    return { allItemLogics: page?.allItemLogics ?? {} };
  });

  const currentGraph = activeLogicGraphId ? allItemLogics[activeLogicGraphId] : undefined;

  const { 
    applyNodesChange: onNodesChange, 
    applyEdgesChange: onEdgesChange, 
    addNodeToCurrentGraph: onAddNode, 
    applyConnect: onConnect 
  } = usePageStore.getState();
  
  const onNodeClick = useSelectionStore(state => state.handleNodeClick);
  
  const nodes = currentGraph?.nodes;
  const edges = currentGraph?.edges;
  
  const { fitView, project } = useReactFlow();
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.NODE_TOOL,
      collect: (monitor: DropTargetMonitor) => ({ isOver: !!monitor.isOver() }),
      drop: (item: NodeToolDragItem, monitor: DropTargetMonitor) => {
        const { nodeType, nodeName } = item;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !dropRef.current) return;
        
        // 座標変換
        const position = project({
          x: clientOffset.x - (dropRef.current.getBoundingClientRect().left ?? 0),
          y: clientOffset.y - (dropRef.current.getBoundingClientRect().top ?? 0),
        });

        const newNodeData: any = { label: nodeName };
        if (nodeType === 'delayNode') newNodeData.durationS = 1.0;
        if (nodeType === 'waitForClickNode') newNodeData.label = "ターゲット未設定";

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
  drop(dropRef);

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      setTimeout(() => fitView({ duration: 200 }), 100);
    }
  }, [nodes ? nodes[0]?.id : undefined, fitView]);

  const nodeTypes = useMemo(() => ({
    eventNode: (props: NodeProps) => <EventNode {...props} />,
    actionNode: (props: NodeProps) => <ActionNode {...props} />,
    ifNode: (props: NodeProps) => <IfNode {...props} />,
    pageNode: (props: NodeProps) => <PageNode {...props} />,
    setVariableNode: (props: NodeProps) => <SetVariableNode {...props} />,
    animateNode: (props: NodeProps) => <AnimateNode {...props} />,
    delayNode: (props: NodeProps) => <DelayNode {...props} />,
    waitForClickNode: (props: NodeProps) => <WaitForClickNode {...props} />,
  }), []); 

  // ★ 修正: event を _event に変更
  const handleNodeClick: NodeClickHandler = (_event, node) => {
    onNodeClick(node.id, node.data?.label);
  };

  if (!nodes || !edges) return <div className="node-editor-placeholder">アイテムを選択してください</div>;

  return (
    <div className="node-editor-wrapper">
      <aside className="node-toolbox">
        <div className="toolbox-header">ロジックノード</div>
        <NodeToolboxItem nodeType="actionNode" nodeName="⚡ アクション: 表示/非表示">⚡ 表示/非表示</NodeToolboxItem>
        <NodeToolboxItem nodeType="animateNode" nodeName="⚡ アクション: アニメーション">⚡ アニメーション</NodeToolboxItem>
        <NodeToolboxItem nodeType="pageNode" nodeName="⚡ アクション: ページ遷移">⚡ ページ遷移</NodeToolboxItem>
        <NodeToolboxItem nodeType="setVariableNode" nodeName="⚡ アクション: 変数をセット">⚡ 変数をセット</NodeToolboxItem>
        <div style={{ height: 10 }} />
        <NodeToolboxItem nodeType="delayNode" nodeName="⏱️ ロジック: 遅延">⏱️ 遅延 (Wait)</NodeToolboxItem>
        <NodeToolboxItem nodeType="ifNode" nodeName="🧠 ロジック: もし〜なら">🧠 もし〜なら</NodeToolboxItem>
        <NodeToolboxItem nodeType="waitForClickNode" nodeName="👆 ロジック: クリック待ち">👆 クリック待ち</NodeToolboxItem>
      </aside>

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

const NodeEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NodeEditorContent />
    </ReactFlowProvider>
  );
};

export default React.memo(NodeEditor);