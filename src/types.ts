// src/types.ts

import type { Node, Edge } from "reactflow";

// ★ 修正: ダッシュボードモードを追加
export type ViewMode = "design" | "logic" | "split" | "dashboard";

export interface PlacedItemType {
  id: string;
  name: string;
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
    isArtboardBackground?: boolean;
    artboardBackgroundPosition?: string;
    artboardBackgroundSize?: string;
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
}

export interface PageData {
  id: string;
  name: string;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
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

export interface PreviewBackground {
  src: string | null;
  position: string | undefined;
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