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
    inputType?: string; // "text" | "email" | "number" | "tel" ...
    required?: boolean;
    initialVisibility?: boolean; // 初期表示

    // 画像トリミング用
    originalSrc?: string;
    cropState?: { crop: any; zoom: number };
    isTransparent?: boolean; // 背景透過
    isArtboardBackground?: boolean; // アートボード背景かどうか
    color?: string; // 文字色など
    fontSize?: number;
  };
}

export interface VariableState {
  [key: string]: any;
}

export interface PageData {
  id: string;
  name: string;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  comments?: CommentType[]; // コメント配列を追加
  backgroundColor?: string; // 背景色
  backgroundImage?: {
    src: string;
    cropState?: { crop: any; zoom: number };
    originalSrc?: string;
    displayMode?: 'cover' | 'contain' | 'stretch' | 'tile' | 'custom';
    position?: string; // 表示位置（デフォルト: 'center center'）
    scale?: number; // サイズ倍率（デフォルト: 1.0 = 100%）
  }; // 背景画像

}

export interface ThemeConfig {
  fontFamily?: string;
  accentColor?: string;
  backgroundColor?: string;
  borderRadius?: number; // px
}

export interface ProjectData {
  projectName: string;
  pages: Record<string, PageData>;
  pageOrder: string[];
  variables: VariableState;
  cloud_id?: string; // ★追加: クラウド同期用のID (UUID)
  theme?: ThemeConfig; // ★追加: テーマ設定
  dataRetentionPeriod?: 'forever' | '1year' | '3months';
}

export interface PageInfo {
  id: string;
  name: string;
}

export interface SelectionEntry {
  id: string;
  type: 'item' | 'node';
  label: string;
  pageId?: string; // 所属するページID
}



export type PropertyControlType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
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
  options?: PropertySelectOption[]; // for select
  min?: number; // for number
  max?: number; // for number
  step?: number; // for number
  // 条件付き表示: 関数形式またはオブジェクト形式 { name: string, value: any }
  condition?: ((data: any) => boolean) | { name: string; value: any };
}

// React Flow Types
export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
  comments?: CommentType[]; // コメント配列を追加
}

// Preview State
export interface PreviewState {
  currentPageId: string;
  isFinished: boolean;
  [key: string]: any; // 動的なアイテム状態を許可
}

export interface SavedProject {
  id: string;
  user_id: string;
  name: string;
  data: ProjectData;
  is_published: boolean;
  published_url?: string;
  created_at: string;
  updated_at: string;
  cloud_id?: string; // ★追加: ストア内でも管理するためのクラウドID
}


export interface CommentType {
  id: string;
  content: string;
  x: number;
  y: number;
  color?: string;
  isMinimized?: boolean;
  authorId?: string; // 将来的にユーザー識別用
  createdAt: number;
}