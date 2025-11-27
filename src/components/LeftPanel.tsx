// src/components/LeftPanel.tsx

import React, { useRef } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import "./LeftPanel.css";
import { usePageStore } from "../stores/usePageStore";

// --- レイヤーパネルのインポート (内部コンポーネント) ---
const LayerPanel: React.FC = () => {
  // 修正: 'pages' は未使用なので削除しました
  const { placedItems, selectedPageId } = usePageStore(state => ({
    placedItems: state.selectedPageId ? state.pages[state.selectedPageId].placedItems : [],
    selectedPageId: state.selectedPageId,
  }));

  // 重ね順（DOM順）の逆順で表示すると、上が「手前」に見える
  const reversedItems = [...placedItems].reverse();

  if (!selectedPageId) return <div className="layer-empty">ページを選択してください</div>;

  return (
    <div className="layer-list">
      {reversedItems.length === 0 && <div className="layer-empty">アイテムがありません</div>}
      {reversedItems.map((item) => (
        <div key={item.id} className="layer-item">
          <span className="layer-icon">
            {item.name.startsWith("画像") ? "🖼️" : 
             item.name.startsWith("テキスト") ? "T" : 
             item.name.startsWith("ボタン") ? "🔘" : "⬜"}
          </span>
          <span className="layer-name">{item.data.text || item.name}</span>
        </div>
      ))}
    </div>
  );
};

// --- ページリスト (左下) ---
const PageList: React.FC = () => {
  const { pages, pageOrder, selectedPageId, addPage, setSelectedPageId, deletePage } = usePageStore(state => ({
    pages: state.pages,
    pageOrder: state.pageOrder,
    selectedPageId: state.selectedPageId,
    addPage: state.addPage,
    setSelectedPageId: state.setSelectedPageId,
    deletePage: state.deletePage,
  }));

  return (
    <div className="page-list-container">
      <div className="page-list-scroll">
        {pageOrder.map((pageId) => {
          const page = pages[pageId];
          return (
            <div
              key={pageId}
              className={`page-list-item ${selectedPageId === pageId ? "selected" : ""}`}
              onClick={() => setSelectedPageId(pageId)}
            >
              <span className="page-name">{page.name}</span>
              {pageOrder.length > 1 && (
                <button 
                  className="page-delete-btn"
                  onClick={(e) => { e.stopPropagation(); deletePage(pageId); }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button className="add-page-button" onClick={() => addPage()}>
        ページを追加 (+)
      </button>
    </div>
  );
};

// --- ドラッグ可能なツールアイコン ---
const DraggableTool: React.FC<{ name: string; label: string; icon: string }> = ({ name, label, icon }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOOL,
    item: { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const ref = useRef<HTMLDivElement>(null);
  drag(ref);

  return (
    <div ref={ref} className={`tool-item ${isDragging ? "dragging" : ""}`}>
      <span className="tool-icon">{icon}</span>
      <span className="tool-label">{label}</span>
    </div>
  );
};

// --- LeftPanel Main ---
const LeftPanel: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'tools' | 'layers'>('tools');

  return (
    <div className="left-panel">
      {/* タブ切り替え */}
      <div className="left-panel-tabs">
        <button 
          className={`panel-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          ツール
        </button>
        <button 
          className={`panel-tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          レイヤー
        </button>
      </div>

      {/* 上部コンテンツ (ツール or レイヤー) */}
      <div className="left-panel-content">
        {activeTab === 'tools' ? (
          <div className="tools-grid">
            <DraggableTool name="テキスト" label="テキスト" icon="T" />
            <DraggableTool name="ボタン" label="ボタン" icon="🔘" />
            <DraggableTool name="画像" label="画像" icon="🖼️" />
            <DraggableTool name="テキスト入力欄" label="テキスト入力欄" icon="📝" />
          </div>
        ) : (
          <LayerPanel />
        )}
      </div>

      {/* 下部: ページリスト (常に表示) */}
      <div className="left-panel-footer">
        <PageList />
      </div>
    </div>
  );
};

export default LeftPanel;