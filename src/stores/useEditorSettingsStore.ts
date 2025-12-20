// src/stores/useEditorSettingsStore.ts

import { create } from 'zustand'; // ★修正: named import に変更
import type { ViewMode } from '../types';

interface EditorSettingsState {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number | null;
  viewMode: ViewMode;
  isPreviewing: boolean;
  isMobileView: boolean;

  // Actions
  toggleGrid: () => void;
  setShowGrid: (show: boolean) => void;
  toggleSnap: () => void;
  setGridSize: (size: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  togglePreview: () => void;
  setIsMobileView: (isMobile: boolean) => void;
}

export const useEditorSettingsStore = create<EditorSettingsState>((set, get) => ({
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  viewMode: 'design',
  isPreviewing: false,
  isMobileView: false,

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setShowGrid: (show) => set({ showGrid: show }),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setGridSize: (size) => set({ gridSize: size }),
  setViewMode: (mode) => set({ viewMode: mode }),
  togglePreview: () => {
    const newState = !get().isPreviewing;
    set({ isPreviewing: newState });

    // プレビュー開始時にPreviewStoreを初期化、終了時にリセット
    if (newState) {
      // プレビューをONにするとき - 動的インポートで循環参照を避ける
      import('../stores/usePreviewStore').then(({ usePreviewStore }) => {
        usePreviewStore.getState().initPreview();
      });
    } else {
      // プレビューをOFFにするとき
      import('../stores/usePreviewStore').then(({ usePreviewStore }) => {
        usePreviewStore.getState().stopPreview();
      });
    }
  },
  setIsMobileView: (isMobile) => set({ isMobileView: isMobile }),
}));