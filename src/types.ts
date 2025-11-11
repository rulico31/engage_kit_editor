// src/types.ts

import type { Node, Edge } from "reactflow";

// アートボードに配置されたアイテムが持つデータの型
export interface PlacedItemType {
  id: string;
  name: string; // (内部的な種類名: "テキスト", "画像" など)
  x: number;
  y: number;
  width: number;
  height: number;
  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) dataプロパティを必須にし、textを追加 ↓↓↓↓↓↓↓↓↓↓
  data: {
    text: string; // (ユーザーが表示・編集するテキスト)
    src: string | null; // (画像ソース)
    variableName?: string; // (入力欄の変数名)
    placeholder?: string; // (入力欄のプレースホルダー)
    [key: string]: any; // 将来的な他のデータ
  };
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
}

// ↓↓↓↓↓↓↓↓↓↓ (★ 変更) PreviewItemState を大幅に拡張 ↓↓↓↓↓↓↓↓↓↓
// プレビューモード中の各アイテムが持つ状態の型
export interface PreviewItemState {
  isVisible: boolean;
  // アニメーション可能なプロパティ
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number; // (deg)
  // アニメーションの制御
  transition: string | null; // (例: "opacity 0.5s ease 0.1s")
}
// ↑↑↑↑↑↑↑↑↑↑ (★ 変更) ↑↑↑↑↑↑↑↑↑↑

// プレビュー状態全体（アイテムIDと状態のマップ）
export type PreviewState = Record<string, PreviewItemState>;

/**
 * プロジェクト全体で共有される変数の状態
 * (例: { "score": 10, "username": "Taro" })
 */
export type VariableState = Record<string, any>;

// (ここからページ管理用の型定義)

// React Flow のノードグラフ
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
  variables: VariableState;
}

// コンテンツブラウザに渡すための簡易的なページ情報
export interface PageInfo {
  id: string;
  name: string;
}

/**
 * プロパティパネルでタブとして開く選択対象の型
 */
export interface SelectionEntry {
  id: string; // Item ID または Node ID
  type: 'item' | 'node'; // どちらの種類か
  label: string; // タブに表示する名前
}