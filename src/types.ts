import type { Edge, Node } from "reactflow";

export interface ProjectData {
  id: string;
  name: string;
  pages: PageType[];
  owner_id: string;
  is_published: boolean;
  public_url?: string;
  settings?: ProjectSettings;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectSettings {
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  favicon?: string;
  googleAnalyticsId?: string;
  customCss?: string;
  theme?: {
    primaryColor: string;
    fontFamily: string;
  };
}

export interface PageType {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  placedItems: PlacedItemType[];
  backgroundColor?: string;
  backgroundImage?: BackgroundImage;
}

export interface BackgroundImage {
  url: string;
  opacity: number;
  scale: number;
  position: { x: number; y: number };
  displayMode: 'cover' | 'contain' | 'tile' | 'fixed'; // 背景画像の表示モード
}

export interface PlacedItemType {
  id: string;
  type: string;
  name: string; // Added
  x?: number; // Added (flattened)
  y?: number; // Added (flattened)
  width?: number; // Added (flattened)
  height?: number; // Added (flattened)
  // Mobile view properties
  mobileX?: number;
  mobileY?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  data: {
    text?: string; // Added
    label?: string;
    value?: string;
    src?: string;
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    placeholder?: string;
    options?: string[]; // For Choice/Dropdown
    required?: boolean; // For Input
    name?: string; // For Form Input name attribute
    targetItemId?: string; // Legacy: For specific interaction target
    targetItemIds?: string[]; // For multi-target interactions

    // B2B行動分析用スコア
    score?: number;

    // Action (Button)
    actionType?: 'none' | 'submit';
    submitRedirectUrl?: string;

    // Additional Properties for Input/Text
    variableName?: string;
    customName?: string; // カスタム名 (Dashboard等での表示用)
    inputType?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
    enableCountryCode?: boolean;
    countryCode?: string;
    showBorder?: boolean;
    isTransparent?: boolean;
    isArtboardBackground?: boolean;
    initialVisibility?: boolean;

    // Image Crop Data
    originalSrc?: string;
    crop?: any; // ReactCrop type
    zoom?: number;
  };
  style?: any; // Added to support direct style access
}

export interface VariableState {
  [key: string]: any;
}

export interface PreviewState {
  [itemId: string]: any; // Allow indexing by itemId
  currentPageId: string;
  variables: VariableState;
  history: string[]; // Page ID history
}

export interface NodeGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface PropertySelectOption {
  label: string;
  value: string | number;
}

export interface PropertyConfig {
  name: string;
  label?: string;
  type: string;
  defaultValue?: any;
  options?: PropertySelectOption[];
  visibleWhen?: Record<string, any>;
  condition?: ((data: any) => boolean) | { name: string; value: any };
  step?: number;
  min?: number;
  checkboxLabel?: string;
}