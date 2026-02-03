// src/hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react';
import { usePageStore } from '../stores/usePageStore';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useProjectStore } from '../stores/useProjectStore';

export const useKeyboardShortcuts = (props: {
    currentRoute: string;
    zoomLevel?: number;
    setZoomLevel?: React.Dispatch<React.SetStateAction<number>>;
    artboardRef?: React.RefObject<HTMLDivElement | null>;
}) => {
    const { currentRoute, zoomLevel, setZoomLevel, artboardRef } = props;

    useEffect(() => {
        const lastMousePos = { x: 0, y: 0 };

        const handleMouseMove = (e: MouseEvent) => {
            lastMousePos.x = e.clientX;
            lastMousePos.y = e.clientY;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

            const activeElement = document.activeElement as HTMLElement;
            const isInput = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );

            // --- Undo / Redo ---
            if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    // Redo: Ctrl+Shift+Z
                    if (isInput) activeElement.blur();
                    e.preventDefault();
                    usePageStore.getState().redo();
                } else {
                    // Undo: Ctrl+Z
                    if (isInput) {
                        activeElement.blur();
                        e.preventDefault();
                        setTimeout(() => {
                            usePageStore.getState().undo();
                        }, 50);
                    } else {
                        e.preventDefault();
                        usePageStore.getState().undo();
                    }
                }
                return;
            }

            if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
                // Redo: Ctrl+Y
                if (isInput) activeElement.blur();
                e.preventDefault();
                usePageStore.getState().redo();
                return;
            }

            // Ignore other keys if input is focused
            if (isInput) return;

            const { deleteItems, updateItem, copyItems, pasteItems } = usePageStore.getState();
            const selectionStore = useSelectionStore.getState();
            const projectStore = useProjectStore.getState();

            // Node Editor Context Detection
            const isEditorSelected = !!document.querySelector('.node-editor-wrapper .selected');
            const inNodeEditor = !!(
                activeElement?.closest('.react-flow') ||
                activeElement?.closest('.node-editor-wrapper') ||
                document.querySelector('.node-editor-wrapper:hover')
            );

            // --- Save: Ctrl+S ---
            if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (currentRoute === 'editor') {
                    projectStore.saveProject().catch(err => {
                        console.error(err);
                        alert("保存に失敗しました");
                    });
                }
                return;
            }

            // --- Copy: Ctrl+C ---
            if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
                if (inNodeEditor || isEditorSelected) {
                    e.preventDefault();
                    usePageStore.getState().copyNodes(selectionStore.selectedIds);
                    return;
                }

                if (selectionStore.selectedIds.length > 0) {
                    e.preventDefault();
                    copyItems(selectionStore.selectedIds);
                }
                return;
            }

            // --- Paste: Ctrl+V ---
            if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
                e.preventDefault();

                if (inNodeEditor || isEditorSelected) {
                    usePageStore.getState().pasteNodes();
                    return;
                }

                const artboardRect = artboardRef?.current?.getBoundingClientRect();
                if (artboardRect) {
                    // マウス座標をアートボードのローカル座標（ズーム考慮）に変換
                    const x = (lastMousePos.x - artboardRect.left) / (zoomLevel || 1);
                    const y = (lastMousePos.y - artboardRect.top) / (zoomLevel || 1);
                    pasteItems({ x, y });
                } else {
                    pasteItems();
                }
                return;
            }

            // --- Zoom: Ctrl + / - / 0 ---
            if (isCtrlOrCmd && setZoomLevel) {
                if (e.key === '=' || e.key === '+' || e.key === ';') {
                    e.preventDefault();
                    setZoomLevel(prev => Math.min(prev + 0.1, 5.0));
                    return;
                } else if (e.key === '-') {
                    e.preventDefault();
                    setZoomLevel(prev => Math.max(prev - 0.1, 0.2));
                    return;
                } else if (e.key === '0') {
                    e.preventDefault();
                    setZoomLevel(1.0);
                    return;
                }
            }

            // --- Delete: Delete or Backspace ---
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (inNodeEditor || isEditorSelected) {
                    // Let ReactFlow handle its own deletion or skip global delete
                    console.log('🛡️ useKeyboardShortcuts: Skipping global delete (NodeEditor is active)');
                    return;
                }

                if (selectionStore.selectedIds.length > 0) {
                    e.preventDefault();
                    deleteItems(selectionStore.selectedIds);
                }
                return;
            }

            // --- Arrow Keys Movement ---
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (selectionStore.selectedIds.length > 0) {
                    e.preventDefault();
                    const shift = e.shiftKey ? 10 : 1;
                    const pageId = usePageStore.getState().selectedPageId;
                    const currentPageItems = pageId ? usePageStore.getState().pages[pageId]?.placedItems : [];

                    if (!currentPageItems) return;

                    selectionStore.selectedIds.forEach(id => {
                        const item = currentPageItems.find(p => p.id === id);
                        if (!item) return;

                        let x = item.x ?? 0;
                        let y = item.y ?? 0;
                        if (e.key === 'ArrowUp') y -= shift;
                        if (e.key === 'ArrowDown') y += shift;
                        if (e.key === 'ArrowLeft') x -= shift;
                        if (e.key === 'ArrowRight') x += shift;

                        updateItem(id, { x, y });
                    });
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [currentRoute, zoomLevel, setZoomLevel, artboardRef]);
};
