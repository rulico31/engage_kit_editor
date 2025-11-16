// src/stores/useEditorSettingsStore.ts

import create from 'zustand';
import type { ViewMode } from '../components/Header'; // (Header.tsxから型をインポート)

interface EditorSettingsStoreState {
  view: "home" | "editor";
  projectName: string;
  viewMode: ViewMode;
  isPreviewing: boolean;
  gridSize: number | null;
  
  // --- Actions ---
  setView: (view: "home" | "editor") => void;
  setProjectName: (name: string) => void;
  setViewMode: (mode: ViewMode) => void;
  togglePreview: () => void;
  setGridSize: (size: number | null) => void;
  
  resetEditorSettings: () => void;
}

const initialState = {
  view: "home" as "home" | "editor",
  projectName: "",
  viewMode: "split" as ViewMode,
  isPreviewing: false,
  gridSize: 1 as number | null,
};

export const useEditorSettingsStore = create<EditorSettingsStoreState>((set) => ({
  ...initialState,
  
  setView: (view) => set({ view }),
  setProjectName: (name) => set({ projectName: name }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  togglePreview: () => set(state => ({ isPreviewing: !state.isPreviewing })),
  
  setGridSize: (size) => set({ gridSize: size }),
  
  resetEditorSettings: () => {
    set(initialState);
  },
}));