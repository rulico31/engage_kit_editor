import type { Node, Edge } from "reactflow";

// アートボードに配置されたアイテムが持つデータの型
export interface PlacedItemType {
  id: string;
  name: string; // (内部的な種類名: "テキスト", "画像" など)
  x: number;
  y: number;
  width: number;
  height: number;
  data: {
    text: string; // (ユーザーが表示・編集するテキスト)
    src: string | null; // (画像ソース)
    variableName?: string; // (入力欄の変数名)
    placeholder?: string; // (入力欄のプレースホルダー)
    
    // 画像の縦横比関連
    keepAspectRatio?: boolean;
    originalAspectRatio?: number;
    
    // 外観
    showBorder?: boolean;
    isTransparent?: boolean;
    isArtboardBackground?: boolean;
    artboardBackgroundPosition?: string;
    
    // ★ 追加: 文字色
    color?: string;

    [key: string]: any; // 将来的な他のデータ
  };
}

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

// プレビュー用の背景情報
export interface PreviewBackground {
  src: string | null;
  position: string | undefined;
}

// ★ --- ここからタスク1で追加 --- ★

// UIコントロールの種類
export type PropertyControlType = 
  | 'text' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'color'; // (PropertiesPanel.tsx ですでにカラーピッカーを実装済みの前提)

// select 用の選択肢の型
export interface PropertySelectOption {
  label: string;
  value: string | number;
}

// 1つのUIコントロール（プロパティ）を定義する型
export interface PropertyConfig {
  name: string; // (data オブジェクトのキーと一致。例: "durationS")
  label: string; // (UI上の表示ラベル。例: "遅延 (秒)")
  type: PropertyControlType;
  defaultValue?: any;
  step?: number;
  min?: number;
  
  // select の場合にのみ使用
  options?: PropertySelectOption[];
  
  // 特定の条件でUIを表示/非表示にするための設定 (オプション)
  // 例: { name: "animationMode", value: "relative" }
  // (これが設定されていると、data.animationMode が "relative" の時だけこのUIを表示する)
  condition?: {
    name: string;
    value: any;
  };
}

// 各ノードが export するトップレベルの設定オブジェクトの型
export interface NodePropertyConfig {
  title: string; // (アコーディオンのタイトル。例: "遅延ノードの設定")
  properties: PropertyConfig[];
}