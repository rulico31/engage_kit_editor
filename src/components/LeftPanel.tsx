// src/components/LeftPanel.tsx

import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import "./LeftPanel.css";
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { PageNameModal } from "./PageNameModal";
import { Edit2, Copy } from "lucide-react";

// --- レイヤーパネルのインポート (内部コンポーネント) ---
const LayerPanel: React.FC = () => {
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
                item.name.startsWith("ボタン") ? "🔘" : 
                  item.type === 'custom_html' ? "<>" : "⬜"}
          </span>
          <span className="layer-name">{item.data.text || item.name}</span>
        </div>
      ))}
    </div>
  );
};

// --- ページリスト (左下) ---
interface PageListItemProps {
  pageId: string;
  pageName: string;
  isSelected: boolean;
  isRenaming: boolean;
  editName: string;
  index: number;
  onSelect: () => void;
  onRenameStart: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onEditNameChange: (value: string) => void;
  onRenameSave: () => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  canDelete: boolean;
  movePageItem: (dragIndex: number, hoverIndex: number) => void;
}

const PageListItem: React.FC<PageListItemProps> = ({
  pageId,
  pageName,
  isSelected,
  isRenaming,
  editName,
  index,
  onSelect,
  onRenameStart,
  onDuplicate,
  onDelete,
  onEditNameChange,
  onRenameSave,
  onRenameKeyDown,
  editInputRef,
  canDelete,
  movePageItem,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PAGE,
    item: { index, pageId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.PAGE,
    hover: (item: { index: number; pageId: string }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      movePageItem(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`page-list-item ${isSelected ? "selected" : ""}`}
      onClick={() => !isRenaming && onSelect()}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
    >
      {isRenaming ? (
        <input
          ref={editInputRef}
          className="page-name-input"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onBlur={onRenameSave}
          onKeyDown={onRenameKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="page-name" title={pageName}>{pageName}</span>
          <div className="page-actions">
            <button
              className="page-rename-btn"
              onClick={onDuplicate}
              title="ページを複製"
            >
              <Copy size={12} />
            </button>
            <button
              className="page-rename-btn"
              onClick={onRenameStart}
              title="名前を変更"
            >
              <Edit2 size={12} />
            </button>
            {canDelete && (
              <button
                className="page-delete-btn"
                onClick={onDelete}
                title="削除"
              >
                ×
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
const PageList: React.FC = () => {
  const { pages, pageOrder, selectedPageId, addPage, setSelectedPageId, deletePage, updatePageName, duplicatePage, reorderPages } = usePageStore(state => ({
    pages: state.pages,
    pageOrder: state.pageOrder,
    selectedPageId: state.selectedPageId,
    addPage: state.addPage,
    setSelectedPageId: state.setSelectedPageId,
    deletePage: state.deletePage,
    updatePageName: state.updatePageName,
    duplicatePage: state.duplicatePage,
    reorderPages: state.reorderPages,
  }));

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [initialPageName, setInitialPageName] = React.useState("");

  // リネーム用ステート
  const [renamingPageId, setRenamingPageId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const editInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (renamingPageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [renamingPageId]);

  const handleOpenModal = () => {
    setInitialPageName(`Page ${pageOrder.length + 1}`);
    setIsModalOpen(true);
  };

  const handleAddPage = (name: string) => {
    addPage(name);
    // 新しいページ作成時は選択状態を解除してページプロパティを表示する（タブ履歴は残す）
    useSelectionStore.getState().handleBackgroundClick();
    setIsModalOpen(false);
  };

  const handleRenameStart = (e: React.MouseEvent, pageId: string, currentName: string) => {
    e.stopPropagation();
    setRenamingPageId(pageId);
    setEditName(currentName);
  };

  const handleRenameSave = () => {
    if (renamingPageId && editName.trim()) {
      updatePageName(renamingPageId, editName.trim());
    }
    setRenamingPageId(null);
    setEditName("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSave();
    } else if (e.key === 'Escape') {
      setRenamingPageId(null);
    }
  };

  const movePageItem = (dragIndex: number, hoverIndex: number) => {
    reorderPages(dragIndex, hoverIndex);
  };

  return (
    <div className="page-list-container">
      <div className="page-list-scroll">
        {pageOrder.map((pageId, index) => {
          const page = pages[pageId];
          const isRenaming = renamingPageId === pageId;

          return (
            <PageListItem
              key={pageId}
              pageId={pageId}
              pageName={page.name}
              isSelected={selectedPageId === pageId}
              isRenaming={isRenaming}
              editName={editName}
              index={index}
              onSelect={() => setSelectedPageId(pageId)}
              onRenameStart={(e) => handleRenameStart(e, pageId, page.name)}
              onDuplicate={(e) => { e.stopPropagation(); duplicatePage(pageId); }}
              onDelete={(e) => { e.stopPropagation(); deletePage(pageId); }}
              onEditNameChange={setEditName}
              onRenameSave={handleRenameSave}
              onRenameKeyDown={handleRenameKeyDown}
              editInputRef={editInputRef}
              canDelete={pageOrder.length > 1}
              movePageItem={movePageItem}
            />
          );
        })}
      </div>
      <button className="add-page-button" onClick={handleOpenModal}>
        ページを追加 (+)
      </button>
      <PageNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddPage}
        initialName={initialPageName}
      />
    </div>
  );
};

// --- ドラッグ可能なツールアイコン ---
const DraggableTool: React.FC<{ type: string; name: string; label: string; icon: string }> = ({ type, name, label, icon }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type, // Use specific type as drag source type
    item: { type, name, label }, // Include type in payload
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

  // 修正: 初期値を '70%' から '50%' に変更し、ページリストの領域を確保
  const [contentHeight, setContentHeight] = React.useState<string | number>('50%');
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;

    // Convert percentage to pixels on first drag
    let startHeight = 0;
    if (typeof contentHeight === 'number') {
      startHeight = contentHeight;
    } else if (panelRef.current) {
      // 修正: 現在のパーセンテージ設定に基づいてピクセル高さを計算 (以前は0.7固定だった)
      const currentPercent = parseFloat(contentHeight as string) || 50;
      startHeight = panelRef.current.clientHeight * (currentPercent / 100);
    } else {
      startHeight = 400; // Fallback
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 最小高さ100px、最大高さ(パネル全体 - 100px)の制限
      const newHeight = Math.max(100, Math.min(startHeight + deltaY, (panelRef.current?.clientHeight || 600) - 100));
      setContentHeight(newHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="left-panel" ref={panelRef}>
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
      <div className="left-panel-content" style={{ height: contentHeight, flex: 'none' }}>
        {activeTab === 'tools' ? (
          <div className="left-panel-tools-container" style={{ padding: '0 8px' }}>
            <div className="tool-section-title" style={{ fontSize: '12px', fontWeight: 'bold', margin: '12px 0 8px', opacity: 0.7 }}>基本アイテム</div>
            <div className="tools-grid">
              <DraggableTool type={ItemTypes.TEXT} name="テキスト" label="テキスト" icon="T" />
              <DraggableTool type={ItemTypes.BUTTON} name="ボタン" label="ボタン" icon="🔘" />
              <DraggableTool type={ItemTypes.IMAGE} name="画像" label="画像" icon="🖼️" />
              <DraggableTool type={ItemTypes.BOX} name="テキスト入力欄" label="テキスト入力欄" icon="📝" />
            </div>

            <div className="tool-section-title" style={{ fontSize: '12px', fontWeight: 'bold', margin: '16px 0 8px', opacity: 0.7 }}>レイアウトプリセット</div>
            <div className="tools-grid">
              <DraggableTool type="LAYOUT_COLUMN_2" name="layout-50-50" label="2カラム (50:50)" icon="🌓" />
              <DraggableTool type="LAYOUT_COLUMN_2_64" name="layout-60-40" label="2カラム (60:40)" icon="🌗" />
            </div>

            <div className="tool-section-title" style={{ fontSize: '12px', fontWeight: 'bold', margin: '16px 0 8px', opacity: 0.7 }}>特殊コンポーネント</div>
            <div className="tools-grid">
               <DraggableTool type="COMP_LINE_REG" name="line-reg" label="LINE登録誘導" icon="💬" />
               <DraggableTool type={ItemTypes.CUSTOM_HTML} name="custom-html" label="カスタムHTML" icon="<>" />
            </div>
          </div>
        ) : (
          <LayerPanel />
        )}
      </div>

      {/* Splitter */}
      <div className="panel-splitter" onMouseDown={handleMouseDown} />

      {/* 下部: ページリスト (常に表示) */}
      <div className="left-panel-footer" style={{ flex: 1, overflow: 'hidden' }}>
        <PageList />
      </div>
    </div>
  );
};

export default LeftPanel;