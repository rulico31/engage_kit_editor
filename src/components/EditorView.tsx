// src/components/EditorView.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import Header from "./Header";
import Artboard from "./Artboard";
import PropertiesPanel from "./PropertiesPanel";
import NodeEditor from "./NodeEditor";
import LeftPanel from "./LeftPanel";
import DashboardView from "./DashboardView";
import { GridControls } from "./GridControls";
import "./EditorView.css";
import "./GridPopover.css";
import EmbedModal from "./EmbedModal";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import AuthLinkModal from "./Auth/AuthLinkModal"; // 追加
import LoadingOverlay from "./LoadingOverlay";

import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { useAuthStore } from "../stores/useAuthStore"; // 追加
import { useProjectStore } from "../stores/useProjectStore";
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useTabSync } from "../hooks/useTabSync";
import { useActionAnalytics } from "../hooks/useActionAnalytics";
import { usePreviewStore } from "../stores/usePreviewStore";

interface EditorViewProps {
  projectName: string;
  onGoHome: () => void;

  onPublish: () => void | Promise<void>;
}

const GridPopover: React.FC = () => {
  const { gridSize, setGridSize, showGrid, setShowGrid } = useEditorSettingsStore(state => ({
    gridSize: state.gridSize,
    setGridSize: state.setGridSize,
    showGrid: state.showGrid,
    setShowGrid: state.setShowGrid,
  }));

  const snapOptions = [null, 1, 2, 4, 8, 16, 32];

  return (
    <div className="grid-popover">
      <div className="grid-popover-section">
        <label className="grid-popover-label">グリッド線</label>
        <div className="grid-toggle-row">
          <button
            className={`grid-visibility-button ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? "表示中 (ON)" : "非表示 (OFF)"}
          </button>
        </div>
      </div>
      <div className="grid-popover-divider" />
      <div className="grid-popover-section">
        <label className="grid-popover-label">スナップ (PX)</label>
        <div className="grid-button-group">
          {snapOptions.map((size) => (
            <button
              key={size === null ? 'null' : size}
              className={`grid-snap-button ${gridSize === size ? 'active' : ''}`}
              onClick={() => setGridSize(size ?? 0)}
              title={size === null ? "スナップ OFF" : size === 1 ? "ピクセル (1px) スナップ" : `${size}px グリッド`}
            >
              {size === null ? 'OFF' : size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  onGoHome,

  onPublish,
}) => {
  const {
    viewMode,
    setViewMode,
    isPreviewing,
    togglePreview
  } = useEditorSettingsStore(state => ({
    viewMode: state.viewMode,
    setViewMode: state.setViewMode,
    isPreviewing: state.isPreviewing,
    togglePreview: state.togglePreview,
  }));

  const { saveProject, currentProjectId } = useProjectStore(state => ({
    saveProject: state.saveProject,
    currentProjectId: state.currentProjectId
  }));
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 認証関連
  const { user } = useAuthStore();
  const isAnonymous = user?.is_anonymous;
  const [isAuthLinkModalOpen, setIsAuthLinkModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // タブの自動同期（削除時のクローズ、Undo時の復元）
  useTabSync();

  // Previewモード時の行動分析 (Rage Click, Hesitation等)
  // EditorViewでもPreview中はページ情報を渡す
  const { previewState } = usePreviewStore(state => ({
    previewState: state.previewState
  }));
  const { pages } = usePageStore(state => ({
    pages: state.pages
  }));

  const currentPageId = isPreviewing ? previewState?.currentPageId : null;
  const currentPageName = currentPageId ? pages[currentPageId]?.name : null;

  useActionAnalytics(currentProjectId, isPreviewing, currentPageId, currentPageName);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 少し待機してローディングを見せる (UX向上)
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = await saveProject();
      if (success) {
        // 保存成功時はアラートを出す前にローディングを消すか、あるいは出したままにするか。
        // ここではアラートが出るので、その前にローディングを消す
        setIsSaving(false);
        // 少し遅らせてからアラートなどを出すとスムーズだが、既存のフローに従う
        setTimeout(() => alert("プロジェクトを保存しました"), 10);
      } else {
        setIsSaving(false);
      }
    } catch (e) {
      console.error(e);
      setIsSaving(false);
      alert("保存に失敗しました");
    }
  };


  const handlePublishWrapper = async () => {
    setIsPublishing(true);
    try {
      // バリデーション等の重い処理が走る前にローディング表示を確実に描画させるための待機
      await new Promise(resolve => setTimeout(resolve, 50));
      await Promise.resolve(onPublish());
    } catch (error) {
      console.error("Publish failed:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  // 公開・集計のアクションハンドラ（認証ガード付き）
  const handleProtectedAction = (action: () => void) => {
    if (user && isAnonymous) {
      // 匿名ユーザーなら連携モーダルを表示
      setIsAuthLinkModalOpen(true);
    } else {
      // 既に正規ユーザーならそのまま実行
      action();
    }
  };

  const handleEnterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e instanceof Error ? e.message : String(e)}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const [isGridPopoverOpen, setIsGridPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [splitRatio, setSplitRatio] = useState(0.6);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const isDraggingSplitRef = useRef(false);
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((type: "split" | "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    if (type === "split") isDraggingSplitRef.current = true;
    if (type === "left") isDraggingLeftRef.current = true;
    if (type === "right") isDraggingRightRef.current = true;
    document.body.style.cursor = type === "split" ? "row-resize" : "col-resize";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingSplitRef.current && workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      let newRatio = relativeY / rect.height;
      if (newRatio < 0.2) newRatio = 0.2;
      if (newRatio > 0.8) newRatio = 0.8;
      setSplitRatio(newRatio);
    }
    if (isDraggingLeftRef.current) {
      let newWidth = e.clientX;
      if (newWidth < 150) newWidth = 150;
      if (newWidth > 500) newWidth = 500;
      setLeftWidth(newWidth);
    }
    if (isDraggingRightRef.current) {
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setRightWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingSplitRef.current = false;
    isDraggingLeftRef.current = false;
    isDraggingRightRef.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsGridPopoverOpen(false);
      }
    };
    if (isGridPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isGridPopoverOpen]);

  // Handle URL query parameters for deep linking (Jump to Editor)
  const { setPendingFocusNodeId } = useEditorSettingsStore(state => ({
    setPendingFocusNodeId: state.setPendingFocusNodeId
  }));
  const projectMeta = useProjectStore(state => state.projectMeta);
  const setSelectedPageId = usePageStore(state => state.setSelectedPageId);
  const handleItemSelect = useSelectionStore(state => state.handleItemSelect);

  useEffect(() => {
    // Check for nodeId in URL
    const urlParams = new URLSearchParams(window.location.search);
    const nodeIdParam = urlParams.get('nodeId');

    if (nodeIdParam && projectMeta?.data?.pages) {
      console.log('[EditorView] Found nodeId in URL:', nodeIdParam);

      // Logic reused from DashboardView (simplified)
      let foundPageId: string | null = null;
      let foundItemId: string | null = null;
      let isLogicNode = false;

      for (const [pageId, page] of Object.entries(projectMeta.data.pages as Record<string, any>)) {
        const item = page.placedItems.find((it: any) => it.id === nodeIdParam);
        if (item) {
          foundPageId = pageId;
          foundItemId = item.id;
          break;
        }
        if (page.allItemLogics) {
          for (const [itemId, graph] of Object.entries(page.allItemLogics as Record<string, any>)) {
            if (graph.nodes?.find((n: any) => n.id === nodeIdParam)) {
              foundPageId = pageId;
              foundItemId = itemId;
              isLogicNode = true;
              break;
            }
          }
        }
        if (foundPageId) break;
      }

      if (foundPageId && foundItemId) {
        const page = projectMeta.data.pages[foundPageId];
        const item = page.placedItems.find((i: any) => i.id === foundItemId);

        setSelectedPageId(foundPageId);
        if (item) {
          handleItemSelect(foundItemId, item.displayName || item.name, false);
        }

        if (isLogicNode) {
          setViewMode('split');
          setPendingFocusNodeId(nodeIdParam);
        } else {
          setViewMode('design');
          setPendingFocusNodeId(nodeIdParam);
        }

        // Clean up URL without reload
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    }
  }, [projectMeta, setSelectedPageId, handleItemSelect, setViewMode, setPendingFocusNodeId]);


  return (
    <div className="editor-container">
      <Header
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={onGoHome}
        onSave={handleSave}
        onTogglePreview={togglePreview}
        onEnterFullscreen={handleEnterFullscreen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPublish={() => handleProtectedAction(handlePublishWrapper)}
        // onPublish={onPublish}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <div className="editor-workspace-vertical" ref={workspaceRef}>
        {viewMode === "dashboard" && !isPreviewing ? (
          <div className="workspace-section dashboard-section" style={{ width: '100%', height: '100%' }}>
            <DashboardView />
          </div>
        ) : (
          <>
            <div
              className="workspace-upper-row"
              style={{
                height: viewMode === 'split' && !isPreviewing ? `${splitRatio * 100}%` : '100%',
                flexShrink: 0
              }}
            >
              {/* Left Panel & Artboard Area */}
              {viewMode !== "logic" ? (<>
                {/* Left Panel - Hidden during preview */}
                {!isPreviewing && (
                  <>
                    <div className="panel-left" style={{ width: leftWidth }}>
                      <LeftPanel />
                    </div>
                    <div
                      className="resize-separator-vertical"
                      onMouseDown={handleMouseDown("left")}
                      title="ドラッグして左パネル幅を変更"
                    >
                      <div className="resize-handle-pill-vertical" />
                    </div>
                  </>
                )}
                <div className="workspace-section design-section" style={{ flex: 1, position: 'relative' }}>
                  {!isPreviewing && <GridControls />}
                  <div className="canvas-viewport">
                    <Artboard />
                  </div>
                </div>
              </>
              ) : (
                !isPreviewing ? (
                  <div className="workspace-section logic-section" style={{ flex: 1 }}>
                    <NodeEditor />
                  </div>
                ) : (
                  <div className="workspace-section design-section" style={{ flex: 1, position: 'relative' }}>
                    {!isPreviewing && <GridControls />}
                    <div className="canvas-viewport">
                      <Artboard />
                    </div>
                  </div>
                )
              )}

              {/* Right Panel (Properties) - Hidden during preview */}
              {!isPreviewing && (
                <>
                  <div
                    className="resize-separator-vertical"
                    onMouseDown={handleMouseDown("right")}
                    title="ドラッグして右パネル幅を変更"
                  >
                    <div className="resize-handle-pill-vertical" />
                  </div>
                  <div className="panel-right" style={{ width: rightWidth }}>
                    <PropertiesPanel

                    />
                  </div>
                </>
              )}
            </div>

            {/* Split View: Lower Row */}
            {/* Split View: Lower Row - Hidden during preview */}
            {viewMode === 'split' && !isPreviewing && (
              <>
                <div
                  className="resize-separator-horizontal"
                  onMouseDown={handleMouseDown("split")}
                  title="ドラッグして上下比率を変更"
                >
                  <div className="resize-handle-pill-horizontal">
                    <div className="resize-handle-dots-horizontal"></div>
                  </div>
                </div>
                <div className="workspace-lower-row" style={{ flex: 1 }}>
                  <div className="workspace-section logic-section" style={{ width: '100%', height: '100%' }}>
                    <NodeEditor />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {isEmbedModalOpen && (
        <EmbedModal
          projectId={useProjectStore.getState().currentProjectId || ""}
          onClose={() => setIsEmbedModalOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <ProjectSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {isGridPopoverOpen && popoverRef.current && (
        <div style={{ position: 'absolute', top: 50, right: 100, zIndex: 9999 }}>
          <GridPopover />
        </div>
      )}

      {/* アカウント連携モーダル */}
      {isAuthLinkModalOpen && (
        <AuthLinkModal
          onClose={() => setIsAuthLinkModalOpen(false)}
        />
      )}

      {(isSaving || isPublishing) && (
        <LoadingOverlay
          message={isSaving ? "プロジェクトを保存中..." : "公開準備中..."}
        />
      )}
    </div>
  );
};

export default EditorView;