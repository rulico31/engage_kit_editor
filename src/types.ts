// src/types.ts

// (★ 修正: reactflow から Node と Edge の型をインポート)
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

// プレビューモード中の各アイテムが持つ状態の型
export interface PreviewItemState {
  isVisible: boolean;
  // (将来的に text: string など他の状態も追加可能)
}

// プレビュー状態全体（アイテムIDと状態のマップ）
export type PreviewState = Record<string, PreviewItemState>;

// (ここからページ管理用の型定義)

// React Flow のノードグラフ
// (★ 修正: ここの Node と Edge が reactflow の型を参照するようになります)
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}

// 単一ページのデータ構造
export interface PageData {
  id: string;
  name: string;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
}

// プロジェクト全体のデータ構造 (保存/読込用)
export interface ProjectData {
  projectName: string;
  pages: Record<string, PageData>; // ページIDをキーにしたマップ
  pageOrder: string[]; // ページの順序を管理するID配列
}

// コンテンツブラウザに渡すための簡易的なページ情報
export interface PageInfo {
  id: string;
  name: string;
}