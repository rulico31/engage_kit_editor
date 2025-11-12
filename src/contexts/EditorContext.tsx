// src/contexts/EditorContext.tsx

import React, { createContext, useContext } from "react";
import type {
  PlacedItemType,
  PageData,
  NodeGraph,
  PageInfo,
  PreviewState,
  SelectionEntry,
  VariableState,
} from "../types";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "reactflow";

// --- Context が提供するデータの型定義 ---
// (App.tsx が EditorView に渡していたPropsとほぼ同じ)
export interface EditorContextType {
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  
  isPreviewing: boolean;
  previewState: PreviewState;
  onItemEvent: (eventName: string, itemId: string) => void;
  
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;

  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  currentGraph: NodeGraph | undefined;
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;

  selection: SelectionEntry[];
  activeTabId: string | null;
  activeLogicGraphId: string | null;
  
  onItemUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (newNode: Node) => void;
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;
  onNodeClick: (nodeId: string) => void;
  
  pageInfoList: PageInfo[];

  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  
  nodeGraphTemplates: Record<string, NodeGraph>;
}

// --- Context オブジェクトの作成 ---
// (★) デフォルト値は null だが、すぐに Provider から値が提供される
export const EditorContext = createContext<EditorContextType | null>(null);

// --- カスタムフックの作成 ---
// (★) これにより、各コンポーネントは型チェックを受けつつ簡単にContextデータにアクセスできる
export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
};