import { useState, useRef, useCallback } from "react";
import { usePageStore } from "../../stores/usePageStore";
import { useSelectionStore } from "../../stores/useSelectionStore";
import { useEditorSettingsStore } from "../../stores/useEditorSettingsStore";
import type { PlacedItemType } from "../../types";

export const snapToGrid = (value: number, size: number | null, min: number = -Infinity): number => {
  if (size === null) return Math.max(min, value);
  if (size === 1) return Math.max(min, Math.round(value));
  const snapped = Math.round(value / size) * size;
  return Math.max(min, snapped);
};

export const useArtboardLogic = (artboardRef: React.RefObject<HTMLDivElement | null>) => {
  // ストアからの状態取得
  const { isPreviewing, gridSize, zoomLevel } = useEditorSettingsStore(state => ({
    isPreviewing: state.isPreviewing,
    gridSize: state.gridSize,
    viewMode: state.viewMode,
    zoomLevel: state.zoomLevel,
  }));

  const { deleteItems, updateItems } = usePageStore(state => ({
    deleteItems: state.deleteItems,
    updateItems: state.updateItems,
  }));

  const { selectedIds } = useSelectionStore(state => ({
    selectedIds: state.selectedIds
  }));

  const placedItems = usePageStore(s => s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []);

  // ローカルステート
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  // ドラッグ用のRef
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartItemStates = useRef<Record<string, { x: number, y: number }>>({});
  const ignoreNextClickRef = useRef(false);

  // --- ショートカットは useKeyboardShortcuts.ts に移行済み ---

  // --- ドラッグ移動ロジック ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !dragStartPos.current || !artboardRef.current) return;

    const artboardRect = artboardRef.current.getBoundingClientRect();
    const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
    const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;

    const dx = mouseXInArtboard - dragStartPos.current.x;
    const dy = mouseYInArtboard - dragStartPos.current.y;

    const isMobileView = useEditorSettingsStore.getState().isMobileView;

    const updates = Object.entries(dragStartItemStates.current).map(([id, startState]) => {
      if (isMobileView) {
        // モバイルビューでは mobileX, mobileY を更新
        return {
          id,
          props: {
            mobileX: snapToGrid(startState.x + dx, gridSize),
            mobileY: snapToGrid(startState.y + dy, gridSize)
          }
        };
      } else {
        // デスクトップビューでは x, y を更新
        return {
          id,
          props: {
            x: snapToGrid(startState.x + dx, gridSize),
            y: snapToGrid(startState.y + dy, gridSize)
          }
        };
      }
    });

    if (updates.length > 0) {
      updateItems(updates, true);
      ignoreNextClickRef.current = true;
    }
  }, [updateItems, zoomLevel, gridSize, artboardRef]);

  const handleMouseUp = useCallback(() => {
    // デバウンスタイマーが自動的に履歴を保存するため、ここでは呼ばない
    isDraggingRef.current = false;
    dragStartPos.current = null;
    dragStartItemStates.current = {};
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleItemDragStart = useCallback((e: React.MouseEvent, itemId: string, handleItemSelect: (id: string, label: string, isMulti: boolean) => void) => {
    if (isPreviewing) return;
    ignoreNextClickRef.current = false;

    const item = placedItems.find((p) => p.id === itemId);
    if (!item || item.data.isArtboardBackground) return;

    let targets = new Set<string>();
    const isMultiSelect = e.ctrlKey || e.metaKey;

    if (selectedIds.includes(itemId)) {
      targets = new Set(selectedIds);
    } else {
      handleItemSelect(itemId, item.data.text || item.name, isMultiSelect);
      ignoreNextClickRef.current = true;
      if (isMultiSelect) targets = new Set([...selectedIds, itemId]);
      else targets = new Set([itemId]);
    }

    // ドラッグ可能なアイテムのみを対象とする
    const validTargets = new Set<string>();
    targets.forEach(id => {
      const targetItem = placedItems.find(p => p.id === id);
      if (targetItem) {
        validTargets.add(id);
      }
    });

    isDraggingRef.current = true;
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    dragStartPos.current = {
      x: (e.clientX - artboardRect.left) / zoomLevel,
      y: (e.clientY - artboardRect.top) / zoomLevel
    };

    const isMobileView = useEditorSettingsStore.getState().isMobileView;
    const initialStates: Record<string, { x: number, y: number }> = {};
    placedItems.forEach((p: PlacedItemType) => {
      if (validTargets.has(p.id)) {
        // モバイルビューの場合は mobileX/mobileY を、未設定なら x/y をフォールバック
        const x = isMobileView && p.mobileX !== undefined ? p.mobileX : (p.x ?? 0);
        const y = isMobileView && p.mobileY !== undefined ? p.mobileY : (p.y ?? 0);
        initialStates[p.id] = { x, y };
      }
    });
    dragStartItemStates.current = initialStates;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    e.stopPropagation();
  }, [isPreviewing, placedItems, selectedIds, zoomLevel, artboardRef, handleMouseMove, handleMouseUp]);

  return {
    ignoreNextClickRef,
    contextMenu,
    setContextMenu,
    handleItemDragStart,
    deleteItems,
    selectedIds
  };
};