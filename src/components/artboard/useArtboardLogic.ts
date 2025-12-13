import { useState, useRef, useEffect, useCallback } from "react";
import { usePageStore } from "../../stores/usePageStore";
import { useSelectionStore } from "../../stores/useSelectionStore";
import { useEditorSettingsStore } from "../../stores/useEditorSettingsStore";

export const snapToGrid = (value: number, size: number | null, min: number = -Infinity): number => {
  if (size === null) return Math.max(min, value);
  if (size === 1) return Math.max(min, Math.round(value));
  const snapped = Math.round(value / size) * size;
  return Math.max(min, snapped);
};

export const useArtboardLogic = (artboardRef: React.RefObject<HTMLDivElement | null>) => {
  // ストアからの状態取得
  const { isPreviewing, gridSize } = useEditorSettingsStore(state => ({
    isPreviewing: state.isPreviewing,
    gridSize: state.gridSize,
    viewMode: state.viewMode,
  }));

  const { deleteItems, updateItems, groupItems, ungroupItems } = usePageStore(state => ({
    deleteItems: state.deleteItems,
    updateItems: state.updateItems,
    groupItems: state.groupItems,
    ungroupItems: state.ungroupItems,
  }));

  const { selectedIds } = useSelectionStore(state => ({
    selectedIds: state.selectedIds
  }));

  const placedItems = usePageStore(s => s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []);

  // ローカルステート
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  // ドラッグ用のRef
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartItemStates = useRef<Record<string, { x: number, y: number }>>({});
  const ignoreNextClickRef = useRef(false);

  // --- キーボードショートカット (Zoom, Delete, Grouping) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useEditorSettingsStore.getState().isPreviewing) return;

      // Zoom
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+" || e.key === ";") {
          e.preventDefault();
          setZoomLevel(prev => Math.min(prev + 0.1, 5.0));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoomLevel(prev => Math.max(prev - 0.1, 0.2));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || (activeEl as HTMLElement)?.isContentEditable;
        if (isInput) return;

        const currentViewMode = useEditorSettingsStore.getState().viewMode;
        if (currentViewMode === 'logic') return;
        if (currentViewMode === 'split') {
          if (activeEl?.closest('.react-flow') || activeEl?.closest('.node-editor')) {
            return;
          }
        }

        const { tabs, activeTabId } = useSelectionStore.getState();
        const activeEntry = tabs.find(t => t.id === activeTabId);
        if (activeEntry && activeEntry.type === 'node') return;

        const currentSelectedIds = useSelectionStore.getState().selectedIds;
        if (currentSelectedIds.length > 0) {
          e.preventDefault();
          deleteItems(currentSelectedIds);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteItems]);

  // --- ドラッグ移動ロジック ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !dragStartPos.current || !artboardRef.current) return;

    const artboardRect = artboardRef.current.getBoundingClientRect();
    const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
    const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;

    const dx = mouseXInArtboard - dragStartPos.current.x;
    const dy = mouseYInArtboard - dragStartPos.current.y;

    // モバイルビューの場合は、移動量をPC座標系に逆変換する
    // Mobile Scale = 375 / 1000 = 0.375
    // Delta PC = Delta Mobile / 0.375
    const isMobileView = useEditorSettingsStore.getState().isMobileView;
    const mobileScale = 375 / 1000;

    const finalDx = isMobileView ? dx / mobileScale : dx;
    // Y座標はスケーリングしていないのでそのまま (dy)

    const updates = Object.entries(dragStartItemStates.current).map(([id, startState]) => ({
      id,
      props: {
        x: snapToGrid(startState.x + finalDx, gridSize),
        y: snapToGrid(startState.y + dy, gridSize)
      }
    }));

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

  const handleItemDragStart = useCallback((e: React.MouseEvent, itemId: string, handleItemSelect: any) => {
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

    const validTargets = new Set<string>();
    targets.forEach(id => {
      const targetItem = placedItems.find(p => p.id === id);
      if (!targetItem) return;

      const startGroupId = targetItem.groupId;
      let parent = startGroupId ? placedItems.find(p => p.id === startGroupId) || null : null;
      let parentIsTarget = false;

      while (parent) {
        if (targets.has(parent.id)) {
          parentIsTarget = true;
          break;
        }
        const nextGroupId = parent.groupId;
        parent = nextGroupId ? placedItems.find(p => p.id === nextGroupId) || null : null;
      }

      if (!parentIsTarget) validTargets.add(id);
    });

    isDraggingRef.current = true;
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    dragStartPos.current = {
      x: (e.clientX - artboardRect.left) / zoomLevel,
      y: (e.clientY - artboardRect.top) / zoomLevel
    };

    const initialStates: Record<string, { x: number, y: number }> = {};
    placedItems.forEach(p => {
      if (validTargets.has(p.id)) initialStates[p.id] = { x: p.x, y: p.y };
    });
    dragStartItemStates.current = initialStates;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    e.stopPropagation();
  }, [isPreviewing, placedItems, selectedIds, zoomLevel, artboardRef, handleMouseMove, handleMouseUp]);

  return {
    zoomLevel,
    ignoreNextClickRef,
    contextMenu,
    setContextMenu,
    handleItemDragStart,
    groupItems,
    ungroupItems,
    deleteItems,
    selectedIds
  };
};