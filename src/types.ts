// src/types.ts

import type { Node, Edge } from "reactflow";

// ★ 修正: ダッシュボードモードを追加
export type ViewMode = "design" | "logic" | "split" | "dashboard";

export interface PlacedItemType {
  id: string;
  type: string; // added
  name: string; // 要素のタイプ（例: "ボタン", "画像", "テキスト"など）- 固定
  displayName?: string; // ユーザーが設定するカスタム名（オプション）
  x: number;
  y: number;
  width: number;
  height: number;
  groupId?: string;

  // Mobile Layout
  mobileX?: number;
  mobileY?: number;
  mobileWidth?: number;
  mobileHeight?: number;

  style?: {
    shadow?: { enabled: boolean; color: string; x: number; y: number; blur: number };
    glow?: { enabled: boolean; color: string; blur: number; spread: number };
    textShadow?: { enabled: boolean; color: string; x: number; y: number; blur: number };
    textGlow?: { enabled: boolean; color: string; blur: number };
    backgroundColor?: string;
  };

  data: {
    text?: string;
    src?: string | null;
    variableName?: string;
    placeholder?: string;
    keepAspectRatio?: boolean;
    originalAspectRatio?: number;
    showBorder?: boolean;
    isTransparent?: boolean;
    initialVisibility?: boolean;

    color?: string;
    fontSize?: number;
    [key: string]: any;
  };
}

export interface PreviewItemState {
  isVisible: boolean;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
  transition: string | null;
}

export type PreviewState = Record<string, PreviewItemState>;
export type VariableState = Record<string, any>;

export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
  comments?: CommentType[]; // ノードエディタ用コメント
}

// コメント/メモの型定義
export interface CommentType {
  id: string;
  content: string;
  x: number;
  y: number;
  isMinimized: boolean;
  color?: string; // "#FFE082" (黄色), "#B2DFDB" (青緑) など
  createdAt: string;
  updatedAt: string;
  attachedToItemId?: string; // 要素に紐付ける場合（オプション）
}



export interface PageData {
  id: string;
  name: string;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  comments?: CommentType[]; // コメント配列を追加
  backgroundColor?: string; // 背景色

}

export interface ProjectData {
  projectName: string;
  pages: Record<string, PageData>;
  pageOrder: string[];
  variables: VariableState;
}

export interface PageInfo {
  id: string;
  name: string;
}

export interface SelectionEntry {
  id: string;
  type: 'item' | 'node';
  label: string;
}



export type PropertyControlType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'color';

export interface PropertySelectOption {
  label: string;
  value: string | number;
}

export interface PropertyConfig {
  name: string;
  label: string;
  type: PropertyControlType;
  defaultValue?: any;
  step?: number;
  min?: number;
  options?: PropertySelectOption[];
  condition?: {
    name: string;
    value: any;
  };
}

export interface NodePropertyConfig {
  title: string;
  properties: PropertyConfig[];
}

export interface SavedProject {
  id: string;
  user_id: string;
  name: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
}