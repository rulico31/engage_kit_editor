// src/components/LeftPanel.tsx

import React from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import ToolboxItem from "./ToolboxItem";
import ContentBrowser from "./ContentBrowser";
// ↓↓↓↓↓↓↓↓↓↓ (★ 変更なし) PageInfo と Context をインポート ↓↓↓↓↓↓↓↓↓↓
// import type { PageInfo } from "../types";
import { useEditorContext } from "../contexts/EditorContext";
// ↑↑↑↑↑↑↑↑↑↑ (★ 変更なし) ↑↑↑↑↑↑↑↑↑↑

// (★ 変更なし)
// interface LeftPanelProps { ... }

export const LeftPanel: React.FC = React.memo(() => {
  // (★ 変更なし)
  const {
    pageInfoList,
    selectedPageId,
    onSelectPage,
    onAddPage,
  } = useEditorContext();

  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) return 文直下の <Panel ...> を削除 ↓↓↓↓↓↓↓↓↓↓
  return (
    // <Panel defaultSize={20} minSize={15} className="panel-column"> // (★ この行を削除)
      <PanelGroup direction="vertical">
        {/* (A) 上部: ツールボックス */}
        <Panel defaultSize={40} minSize={20} className="panel-content">
          <div className="tool-list">
            <ToolboxItem name="テキスト" />
            <ToolboxItem name="ボタン" />
            <ToolboxItem name="画像" />
            <ToolboxItem name="テキスト入力欄" />
          </div>
        </Panel>
        
        <PanelResizeHandle className="resize-handle" />
        
        {/* (B) 下部: コンテンツブラウザ (ページ管理) */}
        <Panel defaultSize={60} minSize={20} className="panel-content">
          <ContentBrowser
            pages={pageInfoList}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
            onAddPage={onAddPage}
          />
        </Panel>
      </PanelGroup>
    // </Panel> // (★ この行を削除)
  );
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
});

// React.memo でラップすることで、不要な再レンダリングを防ぎます
export default LeftPanel;