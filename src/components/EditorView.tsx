// src/components/EditorView.tsx

import React from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import Header from "./Header";
import Artboard from "./Artboard";
import PropertiesPanel from "./PropertiesPanel";
import NodeEditor from "./NodeEditor";
import LeftPanel from "./LeftPanel";
import { useEditorContext } from "../contexts/EditorContext";

interface EditorViewProps {
  projectName: string;
  isPreviewing: boolean;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePreview: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  isPreviewing,
  onGoHome,
  onExportProject,
  onImportProject,
  onTogglePreview,
}) => {
  const { isPreviewing: isPreviewingFromContext } = useEditorContext();

  return (
    <div className="container">
      {/* ---- ヘッダー ---- */}
      <Header
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={onGoHome}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onTogglePreview={onTogglePreview}
      />

      {/* ---- プレビュー or 編集ビュー ---- */}
      {isPreviewingFromContext ? (
        <div className="preview-viewport">
          <Artboard />
        </div>
      ) : (
        // =====================================================
        // 🧩 編集モード：縦 + 横方向の PanelGroup
        // position: relative を両方の PanelGroup に設定
        // =====================================================
        <PanelGroup
          direction="vertical"
          style={{
            height: "calc(100vh - 45px)",
            position: "relative", // ✅ ハンドル基準
            overflow: "hidden",
          }}
        >
          {/* ===== 上部メインエリア ===== */}
          <Panel defaultSize={75} minSize={30}>
            <PanelGroup
              direction="horizontal"
              style={{
                position: "relative", // ✅ 横方向のハンドル基準
                height: "100%",
                overflow: "hidden",
              }}
            >
              {/* ↓↓↓↓↓↓↓↓↓↓ (★ 修正) className から "panel-content" を削除 ↓↓↓↓↓↓↓↓↓↓ */}
              {/* 左パネル */}
              <Panel
                defaultSize={20}
                minSize={10}
                // (★) "panel-content" を削除し、"panel-column" (App.cssで定義) を設定
                className="panel-column" 
              >
                <LeftPanel />
              </Panel>

              <PanelResizeHandle className="resize-handle" />

              {/* 中央アートボード */}
              <Panel
                defaultSize={55}
                minSize={30}
                className="center-panel" // (★) "panel-content" を削除
              >
                <div className="canvas-viewport">
                  <Artboard />
                </div>
              </Panel>

              <PanelResizeHandle className="resize-handle" />

              {/* 右パネル（プロパティ） */}
              <Panel
                defaultSize={25}
                minSize={15}
                className="right-panel" // (★) "panel-content" を削除
              >
                <PropertiesPanel />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle horizontal" />

          {/* ===== 下部エリア（ノードエディタ） ===== */}
          <Panel
            defaultSize={25}
            minSize={15}
            className="bottom-panel" // (★) "panel-content" を削除
          >
            <NodeEditor />
          </Panel>
          {/* ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑ */}
        </PanelGroup>
      )}
    </div>
  );
};

export default EditorView;