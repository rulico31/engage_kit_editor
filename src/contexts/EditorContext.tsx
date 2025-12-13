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
  // ★ 修正: Edge を削除
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "reactflow";

// --- Context が提供するデータの型定義 ---
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

  // ★ 追加: 重ね順
  onItemMoveToFront: (itemId: string) => void;
  onItemMoveToBack: (itemId: string) => void;
  onItemMoveForward: (itemId: string) => void;
  onItemMoveBackward: (itemId: string) => void;

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



  // ★ 修正: グリッド/スナップ機能
  gridSize: number | null;
  setGridSize: React.Dispatch<React.SetStateAction<number | null>>;
}

// --- Context オブジェクトの作成 ---
export const EditorContext = createContext<EditorContextType | null>(null);

// --- カスタムフックの作成 ---
export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
};