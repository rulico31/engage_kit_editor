// src/components/NodeEditor.tsx

import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
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
import { ContextMenu } from "./artboard/ContextMenu";
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
import ABTestNode from "./nodes/ABTestNode";
import SubmitFormNode from "./nodes/SubmitFormNode";
import ExternalApiNode from "./nodes/ExternalApiNode";
import CommentNode from "./nodes/CommentNode";


interface NodeToolDragItem { nodeType: string; nodeName: string; }
type NodeClickHandler = (event: React.MouseEvent, node: Node) => void;

// ★ 内部コンポーネント: ReactFlowProvider の子として動作する
const NodeEditorContent: React.FC = () => {
  const activeLogicGraphId = useSelectionStore((s) => s.activeLogicGraphId);

  const { allItemLogics, placedItems, setLogicGraph } = usePageStore((s) => {
    const page = s.selectedPageId ? s.pages[s.selectedPageId] : undefined;
    return {
      allItemLogics: page?.allItemLogics ?? {},
      placedItems: page?.placedItems ?? [],
      setLogicGraph: s.setLogicGraph,
    };
  });

  // ロジックデータが存在しない場合は初期化待ち、または空
  const currentGraph = activeLogicGraphId ? allItemLogics[activeLogicGraphId] : undefined;

  // ★ 追加: ロジックがまだ存在しない場合、デフォルトのノード（イベント）を自動生成する
  useEffect(() => {
    if (activeLogicGraphId && !currentGraph) {
      const item = placedItems.find(p => p.id === activeLogicGraphId);
      if (item) {
        const initialNodes: Node[] = [];
        const timestamp = Date.now();

        // アイテムタイプに応じて最適な初期イベントを1つだけ設定
        if (item.name.startsWith("テキスト入力欄")) {
          // 入力欄の場合: 入力完了時のみ
          initialNodes.push({
            id: `evt-input-${timestamp}`,
            type: 'eventNode',
            position: { x: 50, y: 50 },
            data: { label: '✅ 入力完了時', eventType: 'onInputComplete' }
          });
        }
        else if (item.name.startsWith("画像")) {
          // 画像の場合: 画像読み込み時のみ
          initialNodes.push({
            id: `evt-load-${timestamp}`,
            type: 'eventNode',
            position: { x: 50, y: 50 },
            data: { label: '🖼️ 画像読み込み時', eventType: 'onImageLoad' }
          });
        }
        else if (!item.id.startsWith('group')) {
          // その他（ボタン、テキスト等）の場合: クリック時のみ
          initialNodes.push({
            id: `evt-click-${timestamp}`,
            type: 'eventNode',
            position: { x: 50, y: 50 },
            data: { label: '👆 クリック時', eventType: 'click' }
          });
        }

        // グラフを初期化保存
        setLogicGraph(activeLogicGraphId, { nodes: initialNodes, edges: [] });
      }
    }
  }, [activeLogicGraphId, currentGraph, placedItems, setLogicGraph]);

  const {
    applyNodesChange: onNodesChange,
    applyEdgesChange: onEdgesChange,
    addNodeToCurrentGraph: onAddNode,
    applyConnect: onConnect
  } = usePageStore.getState();

  const onNodeClick = useSelectionStore(state => state.handleNodeClick);

  const nodes = currentGraph?.nodes || [];
  const edges = currentGraph?.edges || [];

  const { fitView, project } = useReactFlow();
  const dropRef = useRef<HTMLDivElement>(null);

  // コンテキストメニュー
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  // 右クリックメニューハンドラ
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

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
    if (nodes.length > 0) {
      setTimeout(() => fitView({ duration: 200 }), 100);
    }
  }, [nodes.length > 0 ? nodes[0].id : null, fitView]);

  const nodeTypes = useMemo(() => ({
    eventNode: (props: NodeProps) => <EventNode {...props} />,
    actionNode: (props: NodeProps) => <ActionNode {...props} />,
    ifNode: (props: NodeProps) => <IfNode {...props} />,
    pageNode: (props: NodeProps) => <PageNode {...props} />,
    setVariableNode: (props: NodeProps) => <SetVariableNode {...props} />,
    animateNode: (props: NodeProps) => <AnimateNode {...props} />,
    delayNode: (props: NodeProps) => <DelayNode {...props} />,
    waitForClickNode: (props: NodeProps) => <WaitForClickNode {...props} />,
    abTestNode: (props: NodeProps) => <ABTestNode {...props} />,
    submitFormNode: (props: NodeProps) => <SubmitFormNode {...props} />,
    externalApiNode: (props: NodeProps) => <ExternalApiNode {...props} />,
    commentNode: (props: NodeProps) => <CommentNode {...props} />,
  }), []);

  const handleNodeClick: NodeClickHandler = (_event, node) => {
    onNodeClick(node.id, node.data?.label);
  };

  if (!activeLogicGraphId) return <div className="node-editor-placeholder">アイテムを選択してください</div>;

  return (
    <div className="node-editor-wrapper">
      <aside className="node-toolbox">
        {/* イベントノードの手動追加機能は削除 */}

        <div className="toolbox-header">アクション</div>
        <NodeToolboxItem nodeType="actionNode" nodeName="⚡ 表示/非表示">⚡ 表示/非表示</NodeToolboxItem>
        <NodeToolboxItem nodeType="animateNode" nodeName="⚡ アニメーション">⚡ アニメーション</NodeToolboxItem>
        <NodeToolboxItem nodeType="pageNode" nodeName="⚡ ページ遷移">⚡ ページ遷移</NodeToolboxItem>
        <NodeToolboxItem nodeType="setVariableNode" nodeName="⚡ 変数をセット">⚡ 変数をセット</NodeToolboxItem>
        <NodeToolboxItem nodeType="submitFormNode" nodeName="📤 フォーム送信">📤 フォーム送信</NodeToolboxItem>
        <NodeToolboxItem nodeType="externalApiNode" nodeName="🌍 外部API">🌍 外部API</NodeToolboxItem>
        <div style={{ height: 10 }} />

        <div className="toolbox-header">ロジック</div>
        <NodeToolboxItem nodeType="delayNode" nodeName="⏱️ 遅延 (Wait)">⏱️ 遅延</NodeToolboxItem>
        <NodeToolboxItem nodeType="ifNode" nodeName="🧠 もし〜なら">🧠 もし〜なら</NodeToolboxItem>
        <NodeToolboxItem nodeType="abTestNode" nodeName="⚖️ A/B Test">⚖️ A/B Test</NodeToolboxItem>
        <NodeToolboxItem nodeType="waitForClickNode" nodeName="👆 クリック待ち">👆 クリック待ち</NodeToolboxItem>
      </aside>

      <div ref={dropRef} className="react-flow-drop-target" onContextMenu={handleContextMenu}>
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

      {/* 右クリックメニュー */}
      {contextMenu?.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedCount={0}
          onGroup={() => { }}
          onUngroup={() => { }}
          onDelete={() => { }}
          onAddComment={() => {
            if (!dropRef.current) {
              setContextMenu(null);
              return;
            }

            // ReactFlowの座標系に変換
            const rect = dropRef.current.getBoundingClientRect();
            const position = project({
              x: contextMenu.x - rect.left,
              y: contextMenu.y - rect.top,
            });

            // コメントノードを追加
            const newNode: Node = {
              id: `comment-${Date.now()}`,
              type: 'commentNode',
              position,
              data: { label: 'コメント', content: '', isMinimized: false },
            };
            onAddNode(newNode);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
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