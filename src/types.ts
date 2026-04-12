import type { Edge, Node } from "reactflow";

export interface ProjectData {
  id?: string; // Optional during creation
  projectName: string;
  pages: Record<string, PageData>;
  pageOrder: string[];
  owner_id?: string;
  is_published?: boolean;
  public_url?: string;
  settings?: ProjectSettings;
  variables?: Record<string, any>;
  theme?: ThemeConfig;
  cloud_id?: string;
  version?: number;
  dataRetentionPeriod?: number;
  deviceType?: 'desktop' | 'mobile';
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
  fontFamily?: string;
}

export interface PageData extends PageType {
  allItemLogics: Record<string, NodeGraph>;
  comments: CommentType[];
}

export interface BackgroundImage {
  src?: string; // Compatibility
  url?: string;
  opacity?: number;
  scale?: number;
  position?: any; // String choice or {x, y}
  displayMode?: 'cover' | 'contain' | 'tile' | 'fixed' | 'stretch' | 'custom';
  originalSrc?: string;
  cropState?: {
    crop: any;
    zoom: number;
  };
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
  mobileFontSize?: number;
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
    textColor?: string; // Typography text color override
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
    variableValue?: string; // [NEW] 保存する変数の値 (Hidden Variable Setting)
    customName?: string; // カスタム名 (Dashboard等での表示用)
    inputType?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
    enableCountryCode?: boolean;
    countryCode?: string;
    showBorder?: boolean;
    isTransparent?: boolean;
    isArtboardBackground?: boolean;
    initialVisibility?: boolean;
    linkUrl?: string; // [NEW] 遷移先URL (External Link Navigation)

    // Image Crop Data
    originalSrc?: string;
    crop?: any; // ReactCrop type
    zoom?: number;

    // Appearance (Glassmorphism)
    backgroundOpacity?: number;
    backdropBlur?: number;

    // Animation
    animationType?: 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in';
    animationDuration?: number;

    // Custom HTML
    html?: string;

    // Layout / UX
    isPlaceholder?: boolean;
  };
  style?: any; // Added to support direct style access
  customCss?: string; // [NEW] Custom CSS per item
  groupId?: string; // Grouping support
  displayName?: string; // Display name override
}

export interface CommentType {
  id: string;
  content: string;
  x: number;
  y: number;
  createdAt: number;
  updatedAt?: number;
  isMinimized?: boolean;
}

export interface SavedProject {
  id: string;
  name: string;
  data: ProjectData;
  user_id: string;
  is_published: boolean;
  published_url?: string;
  published_data: any;
  cloud_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor?: string;
  fontFamily: string;
  borderRadius?: number;
  backgroundColor?: string;
}

export type ViewMode = 'design' | 'logic' | 'split' | 'dashboard';

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
  comments?: CommentType[];
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