// src/types.ts

// (★ 変更なし)
import type { Node, Edge } from "reactflow";

// (★ 変更なし)
export interface PlacedItemType {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// (★ 変更なし)
export interface PreviewItemState {
  isVisible: boolean;
}
export type PreviewState = Record<string, PreviewItemState>;
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}
export interface PageData {
  id: string;
  name: string;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
}

// プロジェクト全体のデータ構造 (保存/読込用)
export interface ProjectData {
  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) エラーを解消するため 'projectName' を追加 ↓↓↓↓↓↓↓↓↓↓
  projectName: string;
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
  pages: Record<string, PageData>; // ページIDをキーにしたマップ
  pageOrder: string[]; // ページの順序を管理するID配列
}

// (★ 変更なし)
export interface PageInfo {
  id: string;
  name: string;
}