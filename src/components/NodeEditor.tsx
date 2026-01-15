// src/components/NodeEditor.tsx

import React, { useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from 'reactflow';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { ItemTypes } from '../ItemTypes';
import 'reactflow/dist/style.css';
import './NodeEditor.css';

// ノードパレットのインポート
import NodePalette from './NodePalette';

// カスタムノードのインポート
import ActionNode from './nodes/ActionNode';
import EventNode from './nodes/EventNode';
import IfNode from './nodes/IfNode';
import PageNode from './nodes/PageNode';
import AnimateNode from './nodes/AnimateNode';
import DelayNode from './nodes/DelayNode';
import SetVariableNode from './nodes/SetVariableNode';

import ExternalApiNode from './nodes/ExternalApiNode';
import ABTestNode from './nodes/ABTestNode';
import CommentNode from './nodes/CommentNode';
import SubmitFormNode from './nodes/SubmitFormNode';
import ConfirmationNode from './nodes/ConfirmationNode';

import { usePageStore } from '../stores/usePageStore';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useEditorSettingsStore } from '../stores/useEditorSettingsStore';

// nodeTypesをコンポーネントの外で定義（再レンダリング防止）
const nodeTypes: NodeTypes = {
  actionNode: ActionNode,
  eventNode: EventNode,
  ifNode: IfNode,
  pageNode: PageNode,
  animateNode: AnimateNode,
  delayNode: DelayNode,
  setVariableNode: SetVariableNode,

  externalApiNode: ExternalApiNode,
  abTestNode: ABTestNode,
  commentNode: CommentNode,
  submitFormNode: SubmitFormNode,
  confirmationNode: ConfirmationNode,
};

// 空のグラフデータを定数として定義（参照安定化のため）
const defaultGraph = { nodes: [] as Node[], edges: [] as Edge[] };

const NodeEditorContent: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // 右クリックメニューの状態
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);

  // ストアからデータを個別に取得（再レンダリング最適化）
  const pages = usePageStore((state) => state.pages);
  const selectedPageId = usePageStore((state) => state.selectedPageId);
  const activeLogicGraphId = useSelectionStore((state) => state.activeLogicGraphId);
  const selectItem = useSelectionStore((state) => state.selectItem);



  // ストアからデータを個別に取得（再レンダリング最適化）

  // 現在編集中のグラフデータを取得
  const currentGraph = useMemo(() => {
    if (!selectedPageId || !activeLogicGraphId) return defaultGraph;
    const page = pages[selectedPageId];
    if (!page) return defaultGraph;
    return page.allItemLogics[activeLogicGraphId] || defaultGraph;
  }, [pages, selectedPageId, activeLogicGraphId]);

  // Focus Management
  const { pendingFocusNodeId, setPendingFocusNodeId } = useEditorSettingsStore(state => ({
    pendingFocusNodeId: state.pendingFocusNodeId,
    setPendingFocusNodeId: state.setPendingFocusNodeId
  }));

  // Watch for focus requests - Moved after currentGraph definition
  React.useEffect(() => {
    if (pendingFocusNodeId && currentGraph.nodes.some(n => n.id === pendingFocusNodeId)) {
      const node = currentGraph.nodes.find(n => n.id === pendingFocusNodeId);
      if (node) {
        console.log('[NodeEditor] Focusing node:', pendingFocusNodeId);
        // Center and zoom
        reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
        // Select the node
        selectItem(node.id, 'node', node.data.label || 'Node');
        // Clear pending flag
        setPendingFocusNodeId(null);
      }
    }
  }, [pendingFocusNodeId, currentGraph.nodes, reactFlowInstance, selectItem, setPendingFocusNodeId]);

  // ストア更新用ヘルパー関数
  const updateGraph = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (!selectedPageId || !activeLogicGraphId) return;

    // 現在のページ状態を取得して更新
    usePageStore.setState((state) => {
      const page = state.pages[selectedPageId];
      if (!page) return state; // 安全策

      return {
        pages: {
          ...state.pages,
          [selectedPageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeLogicGraphId]: {
                nodes: newNodes,
                edges: newEdges,
              },
            },
          },
        },
      };
    });
  }, [selectedPageId, activeLogicGraphId]);

  // ノードの変更（ドラッグ移動、選択など）を処理
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, currentGraph.nodes);
      updateGraph(nextNodes, currentGraph.edges);
    },
    [currentGraph.nodes, currentGraph.edges, updateGraph]
  );

  // エッジの変更を処理
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextEdges = applyEdgeChanges(changes, currentGraph.edges);
      updateGraph(currentGraph.nodes, nextEdges);
    },
    [currentGraph.nodes, currentGraph.edges, updateGraph]
  );

  // エッジ接続時の処理
  const onConnect = useCallback(
    (params: Connection) => {
      const nextEdges = addEdge(params, currentGraph.edges);
      updateGraph(currentGraph.nodes, nextEdges);
      usePageStore.getState().commitHistory();
    },
    [currentGraph.nodes, currentGraph.edges, updateGraph]
  );

  // useDropフックを使用してドロップ処理を実装
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.NODE_PALETTE_ITEM,
    drop: (item: any, monitor: DropTargetMonitor) => {
      console.log('[NodeEditor] useDrop triggered', item);
      const nodeType = item.type;

      if (!nodeType) {
        console.log('[NodeEditor] No nodeType found, returning');
        return;
      }

      // ドロップ位置を取得（クライアント座標）
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        console.log('[NodeEditor] No clientOffset, returning');
        return;
      }

      // React Flow の座標系に変換
      const position = reactFlowInstance.screenToFlowPosition({
        x: clientOffset.x,
        y: clientOffset.y,
      });
      console.log('[NodeEditor] position:', position);

      // 新しいノードを作成
      const nodeTypeLabels: Record<string, string> = {
        'eventNode': 'イベント',
        'actionNode': '表示切替',
        'ifNode': '条件分岐',
        'pageNode': 'ページ遷移',
        'animateNode': 'アニメーション',
        'delayNode': '遅延',
        'setVariableNode': '変数設定',

        'externalApiNode': '外部API',
        'abTestNode': 'A/Bテスト',
        'commentNode': 'コメント',
        'submitFormNode': 'フォーム送信',
        'confirmationNode': '確認画面',
      };

      // 各ノードタイプのデフォルト値を取得
      const getDefaultNodeData = (type: string) => {
        const baseData = { label: nodeTypeLabels[type] || '新しいノード' };

        switch (type) {
          case 'setVariableNode':
            return { ...baseData, variableName: 'score', operation: 'set', value: '0' };
          case 'actionNode':
            return { ...baseData, mode: 'toggle' };
          case 'eventNode':
            return { ...baseData, eventType: 'click' };
          case 'externalApiNode':
            return { ...baseData, method: 'POST' };
          case 'abTestNode':
            return { ...baseData, ratioA: 50 };
          case 'commentNode':
            return { ...baseData, content: '' };
          case 'submitFormNode':
            return {
              ...baseData,
              enableConfirmation: false,
              confirmHeaderText: '入力内容をご確認ください',
              confirmNoticeText: '内容に誤りがないかご確認の上、送信ボタンを押してください。'
            };
          // case 'confirmationNode':
          //   return {
          //     ...baseData,
          //     displayMode: 'auto',
          //     headerText: '入力内容をご確認ください',
          //     noticeText: '内容に誤りがないかご確認の上、OKボタンを押してください。'
          //   };
          default:
            return baseData;
        }
      };

      const newNode: Node = {
        id: `${nodeType}_${Date.now()}`,
        type: nodeType,
        position,
        data: getDefaultNodeData(nodeType),
      };

      // ノードを追加
      const nextNodes = [...currentGraph.nodes, newNode];
      updateGraph(nextNodes, currentGraph.edges);

      // 履歴に保存
      usePageStore.getState().commitHistory();

      // 新しく追加したノードを選択状態にする
      selectItem(newNode.id, 'node', nodeTypeLabels[nodeType] || '新しいノード');
      console.log('[NodeEditor] Node added via react-dnd');
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [currentGraph.nodes, currentGraph.edges, updateGraph, selectItem, reactFlowInstance]);

  // dropリファレンスとreactFlowWrapperリファレンスを結合
  // react-dndのdrop関数はrefを受け取り、その要素をドロップターゲットとして登録する
  // reactFlowWrapperは既にuseRefで作成されているため、コールバックrefパターンで両方を設定する
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      // @ts-ignore - reactFlowWrapper.currentはreadonlyではないが、TSが誤検知する場合がある
      reactFlowWrapper.current = node;
      drop(node);
    },
    [drop]
  );

  // デバッグ用: isOverの状態監視
  React.useEffect(() => {
    if (isOver) {
      console.log('[NodeEditor] isOver: true');
    }
  }, [isOver]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    selectItem(node.id, 'node', node.data.label || 'ノード');
    // 他のノードが選択された場合はハイライトをクリア
    useSelectionStore.getState().clearHighlightedItems();
  }, [selectItem]);

  const onPaneClick = useCallback(() => {
    // メニューを閉じる
    setContextMenu(null);
    // ハイライトもクリア
    useSelectionStore.getState().clearHighlightedItems();
  }, []);

  // 右クリックメニューハンドラー
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  // コメントノード追加ハンドラー
  const handleAddComment = useCallback(() => {
    if (!contextMenu) return;

    // クライアント座標をReactFlow座標に変換
    const position = reactFlowInstance.screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    });

    // コメントノードを作成
    const newNode: Node = {
      id: `commentNode_${Date.now()}`,
      type: 'commentNode',
      position,
      data: { label: 'コメント', content: '' },
    };

    // ノードを追加
    const nextNodes = [...currentGraph.nodes, newNode];
    updateGraph(nextNodes, currentGraph.edges);
    usePageStore.getState().commitHistory();

    // メニューを閉じる
    setContextMenu(null);

    // 新しく追加したノードを選択状態にする
    selectItem(newNode.id, 'node', 'コメント');
  }, [contextMenu, currentGraph.nodes, currentGraph.edges, updateGraph, selectItem, reactFlowInstance]);

  if (!activeLogicGraphId) {
    return (
      <div className="node-editor-placeholder">
        <p>ロジックを編集するアイテムを選択してください</p>
      </div>
    );
  }

  return (
    <div className="node-editor-container">
      {/* ノードパレット */}
      <NodePalette />

      {/* ReactFlow エディタ */}
      <div
        className="node-editor-wrapper"
        ref={setRefs}
      >
        <ReactFlow
          nodes={currentGraph.nodes} // Storeの値を直接使用
          edges={currentGraph.edges} // Storeの値を直接使用
          onNodesChange={onNodesChange} // 変更を直接Storeへ反映
          onEdgesChange={onEdgesChange} // 変更を直接Storeへ反映
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
        </ReactFlow>

        {/* 右クリックメニュー */}
        {contextMenu && (
          <>
            {/* 背景クリックで閉じるための透明なレイヤー */}
            <div
              style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998 }}
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            />
            <div
              className="node-editor-context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="node-editor-context-menu-item"
                onClick={handleAddComment}
              >
                <span>💬 コメントを追加</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Providerでラップする
const NodeEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NodeEditorContent />
    </ReactFlowProvider>
  );
};

export default NodeEditor;