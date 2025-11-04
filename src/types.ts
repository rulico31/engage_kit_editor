// src/types.ts

import type { Node, Edge } from "reactflow";

// アートボードに配置されたアイテムが持つデータの型
export interface PlacedItemType {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// (プレビュー用) アイテムごとの状態
export interface PreviewItemState {
  isVisible: boolean;
}
// (プレビュー用) ページ全体のプレビュー状態 (アイテムIDがキー)
export type PreviewState = Record<string, PreviewItemState>;


// (ノードグラフの型)
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}

// (単一ページが持つデータ)
export interface PageData {
  id: string;
  name: string;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
}

// (プロジェクト全体のデータ: 保存/読込用)
export interface ProjectData {
  pages: Record<string, PageData>;
  pageOrder: string[];
}

// (コンテンツブラウザに渡す用の、軽量なページ情報)
export interface PageInfo {
  id: string;
  name: string;
}

