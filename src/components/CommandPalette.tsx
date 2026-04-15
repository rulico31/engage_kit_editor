import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  MousePointerClick, 
  MessageSquare, 
  Code,
  Search,
  Columns,
  Square,
  List as ListIcon,
  Table as TableIcon,
  Layers,
  GalleryVertical,
  Youtube,
  Minus
} from 'lucide-react';
import './CommandPalette.css';
import { ItemTypes } from '../ItemTypes';

interface CommandItem {
  id: string;
  type: string;
  label: string;
  description: string;
  category: 'basic' | 'layout' | 'special';
  icon: React.ReactNode;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: 'text', type: ItemTypes.TEXT, label: 'テキスト', description: '見出しや段落を追加します', category: 'basic', icon: <Type size={18} /> },
  { id: 'button', type: ItemTypes.BUTTON, label: 'ボタン', description: 'クリック可能なボタンを追加', category: 'basic', icon: <MousePointerClick size={18} /> },
  { id: 'image', type: ItemTypes.IMAGE, label: '画像', description: 'イメージをアップロード', category: 'basic', icon: <ImageIcon size={18} /> },
  { id: 'input', type: ItemTypes.BOX, label: '入力フォーム', description: 'テキスト入力欄を追加', category: 'basic', icon: <Square size={18} /> },
  
  { id: 'heading', type: ItemTypes.HEADING, label: '見出し', description: '見出しを追加 (H1-H6)', category: 'basic', icon: <Type size={18} style={{ fontWeight: 'bold' }} /> },
  { id: 'list', type: ItemTypes.LIST, label: 'リスト', description: '箇条書きや番号付きリスト', category: 'basic', icon: <ListIcon size={18} /> },
  { id: 'table', type: ItemTypes.TABLE, label: 'テーブル', description: '表組みを作成', category: 'basic', icon: <TableIcon size={18} /> },
  
  { id: 'layout-50-50', type: 'LAYOUT_COLUMN_2', label: '2カラム (50:50)', description: '横並びのレイアウトを作成', category: 'layout', icon: <Columns size={18} /> },
  { id: 'layout-60-40', type: 'LAYOUT_COLUMN_2_64', label: '2カラム (60:40)', description: '比率を変えた横並びレイアウト', category: 'layout', icon: <Columns size={18} /> },
  { id: 'cover', type: ItemTypes.COVER, label: 'カバー', description: '画像の上にテキストを重ねる', category: 'layout', icon: <Layers size={18} /> },
  { id: 'gallery', type: ItemTypes.GALLERY, label: 'ギャラリー', description: '複数の画像を並べて表示', category: 'layout', icon: <GalleryVertical size={18} /> },
  
  { id: 'line-reg', type: 'COMP_LINE_REG', label: 'LINE登録誘導', description: 'LINE公式アカウント連携用', category: 'special', icon: <MessageSquare size={18} /> },
  { id: 'custom-html', type: ItemTypes.CUSTOM_HTML, label: 'カスタムHTML', description: '独自のHTMLコードを挿入', category: 'special', icon: <Code size={18} /> },
  { id: 'embed', type: ItemTypes.EMBED, label: '埋め込み', description: 'YouTube動画などを挿入', category: 'special', icon: <Youtube size={18} /> },
  { id: 'separator', type: ItemTypes.SEPARATOR, label: '区切り線', description: '水平線を追加', category: 'special', icon: <Minus size={18} /> },
];

interface CommandPaletteProps {
  onSelect: (item: CommandItem) => void;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredItems = COMMAND_ITEMS.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect, onClose]);

  // Ensure selected item is visible in scroll
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette-container" onClick={e => e.stopPropagation()}>
        <div className="command-palette-search">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ブロックを検索..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="search-shortcut">ESCで閉じる</div>
        </div>
        
        <div className="command-palette-list" ref={listRef}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="item-icon-wrapper">
                  {item.icon}
                </div>
                <div className="item-info">
                  <div className="item-label">{item.label}</div>
                  <div className="item-description">{item.description}</div>
                </div>
                {index === selectedIndex && (
                  <div className="item-enter">⏎ Enter</div>
                )}
              </div>
            ))
          ) : (
            <div className="command-palette-empty">該当するブロックが見つかりません</div>
          )}
        </div>
        
        <div className="command-palette-footer">
          <div className="footer-tip">
            <kbd>↑</kbd> <kbd>↓</kbd> で選択、 <kbd>Enter</kbd> で決定
          </div>
        </div>
      </div>
    </div>
  );
};
