// src/stores/useEditorSettingsStore.ts

import create from 'zustand';
import type { ViewMode } from '../types';

interface EditorSettingsStoreState {
  view: "home" | "editor";
  projectName: string;
  viewMode: ViewMode;
  isPreviewing: boolean;
  gridSize: number | null;

  // グリッド表示のON/OFF状態
  showGrid: boolean;

  // モバイルビューモード
  isMobileView: boolean;

  // --- Actions ---
  setView: (view: "home" | "editor") => void;
  setProjectName: (name: string) => void;
  setViewMode: (mode: ViewMode) => void;
  togglePreview: () => void;
  setGridSize: (size: number | null) => void;

  // グリッド表示の切り替えアクション
  setShowGrid: (show: boolean) => void;
  setIsMobileView: (isMobile: boolean) => void;

  resetEditorSettings: () => void;
}

const initialState = {
  view: "home" as "home" | "editor",
  projectName: "",
  viewMode: "split" as ViewMode,
  isPreviewing: false,
  gridSize: 1 as number | null,
  showGrid: true, // デフォルトは表示
  isMobileView: false,
};

export const useEditorSettingsStore = create<EditorSettingsStoreState>((set) => ({
  ...initialState,

  setView: (view) => set({ view }),
  setProjectName: (name) => set({ projectName: name }),
  setViewMode: (mode) => set({ viewMode: mode }),

  togglePreview: () => set(state => ({ isPreviewing: !state.isPreviewing })),

  setGridSize: (size) => set({ gridSize: size }),

  setShowGrid: (show) => set({ showGrid: show }),
  setIsMobileView: (isMobile) => set({ isMobileView: isMobile }),

  resetEditorSettings: () => {
    set(initialState);
  },
}));