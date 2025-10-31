// src/App.tsx

import React, { useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import "./App.css";

import Artboard from "./components/Artboard";
import ToolboxItem from "./components/ToolboxItem";
import PropertiesPanel from "./components/PropertiesPanel";

import type { PlacedItemType } from "./types";

function App() {
  const [placedItems, setPlacedItems] = useState<PlacedItemType[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem =
    placedItems.find((item) => item.id === selectedItemId) || null;

  // ↓↓↓↓↓↓↓↓↓↓ アイテム更新用関数を新設 ↓↓↓↓↓↓↓↓↓↓
  /**
   * アイテムのプロパティを更新する
   * @param itemId 更新するアイテムのID
   * @param updatedProps 更新するプロパティ (例: { x: 100, y: 150 })
   */
  const handleItemUpdate = (
    itemId: string,
    updatedProps: Partial<PlacedItemType> // PlacedItemTypeの一部のプロパティ
  ) => {
    setPlacedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, ...updatedProps } // 既存アイテムと更新内容をマージ
          : item
      )
    );
  };
  // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

  return (
    <PanelGroup direction="vertical" className="container">
      {/* (A-1) 上部メインエリア */}
      <Panel defaultSize={75} minSize={30}>
        <PanelGroup direction="horizontal">
          {/* (B-1) 左エリア */}
          <Panel defaultSize={20} minSize={15} className="panel-column">
            {/* ツールボックス */}
            <PanelGroup direction="vertical">
              <Panel defaultSize={40} minSize={20} className="panel-content">
                <div className="panel-header">ツールボックス</div>
                <div className="tool-list">
                  <ToolboxItem name="テキスト" />
                  <ToolboxItem name="ボタン" />
                  <ToolboxItem name="画像" />
                </div>
              </Panel>
              {/* コンテンツブラウザ */}
              <PanelResizeHandle className="resize-handle" />
              <Panel defaultSize={60} minSize={20} className="panel-content">
                <div className="panel-header">コンテンツブラウザ</div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* (B-2) 中央エリア (キャンバス) */}
          <Panel defaultSize={55} minSize={30} className="panel-content">
            <div className="panel-header">キャンバス</div>
            <div className="canvas-viewport">
              <Artboard
                placedItems={placedItems}
                setPlacedItems={setPlacedItems}
                setSelectedItemId={setSelectedItemId}
                selectedItemId={selectedItemId}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* (B-3) 右エリア (プロパティ) */}
          <Panel defaultSize={25} minSize={15} className="panel-content">
            <div className="panel-header">プロパティ</div>
            {/* ↓↓↓↓↓↓↓↓↓↓ onUpdate 関数を渡す ↓↓↓↓↓↓↓↓↓↓ */}
            <PropertiesPanel
              item={selectedItem}
              onUpdate={handleItemUpdate}
            />
            {/* ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑ */}
          </Panel>
        </PanelGroup>
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      {/* (A-2) 下部エリア (ノードエディタ) */}
      <Panel defaultSize={25} minSize={15} className="panel-content">
        <div className="panel-header">ノードエディタ</div>
      </Panel>
    </PanelGroup>
  );
}

export default App;