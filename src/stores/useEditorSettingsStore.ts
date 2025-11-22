// src/stores/useEditorSettingsStore.ts

import create from 'zustand';
import type { ViewMode } from '../components/Header';

interface EditorSettingsStoreState {
  view: "home" | "editor";
  projectName: string;
  viewMode: ViewMode;
  isPreviewing: boolean;
  gridSize: number | null;
  
  // ★ 追加: グリッド表示のON/OFF状態
  showGrid: boolean;
  
  // --- Actions ---
  setView: (view: "home" | "editor") => void;
  setProjectName: (name: string) => void;
  setViewMode: (mode: ViewMode) => void;
  togglePreview: () => void;
  setGridSize: (size: number | null) => void;
  
  // ★ 追加: グリッド表示の切り替えアクション
  setShowGrid: (show: boolean) => void;
  
  resetEditorSettings: () => void;
}

const initialState = {
  view: "home" as "home" | "editor",
  projectName: "",
  viewMode: "split" as ViewMode,
  isPreviewing: false,
  gridSize: 1 as number | null,
  showGrid: true, // デフォルトは表示
};

export const useEditorSettingsStore = create<EditorSettingsStoreState>((set) => ({
  ...initialState,
  
  setView: (view) => set({ view }),
  setProjectName: (name) => set({ projectName: name }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  togglePreview: () => set(state => ({ isPreviewing: !state.isPreviewing })),
  
  setGridSize: (size) => set({ gridSize: size }),
  
  setShowGrid: (show) => set({ showGrid: show }),
  
  resetEditorSettings: () => {
    set(initialState);
  },
}));