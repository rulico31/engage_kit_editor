import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Zap, MousePointerClick, Image as ImageIcon, Type, Target } from "lucide-react";
import { usePageStore } from "../../stores/usePageStore";
import "./EventNode.css";
import type { PropertyConfig } from "../../types";

const EventNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // ストアからアイテムリストを取得して、IDから名前を引けるようにする
  const placedItems = usePageStore((s) =>
    s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []
  );

  // イベントタイプに応じたアイコンとラベルの定義
  const getEventInfo = () => {
    switch (data.eventType) {
      case 'click':
        return { icon: <MousePointerClick className="event-node-icon" />, label: 'クリック時' };
      case 'onImageLoad':
        return { icon: <ImageIcon className="event-node-icon" />, label: '読み込み時' };
      case 'onInputComplete':
        return { icon: <Type className="event-node-icon" />, label: '送信時' };
      default:
        return { icon: <Zap className="event-node-icon" />, label: data.eventType || 'Event' };
    }
  };

  const { icon, label } = getEventInfo();

  // ターゲット名の解決ロジック（複数対応）
  const getTargetNames = () => {
    const targetIds = data.targetItemIds || [];
    if (!Array.isArray(targetIds) || targetIds.length === 0) return null;

    const names = targetIds.map((id: string) => {
      const item = placedItems.find(i => i.id === id);
      return item ? (item.displayName || item.data.text || item.name) : '(Unknown)';
    });

    if (names.length <= 2) {
      return names.join(', ');
    } else {
      return `${names[0]}, ${names[1]} (+${names.length - 2})`;
    }
  };

  const targetNames = getTargetNames();

  return (
    <div className="event-node">
      <div className="event-node-header">
        {icon}
        <span className="event-node-title">イベント</span>
        <span className="event-node-badge">{label}</span>
      </div>

      <div className="event-node-body">
        <div className="event-node-info-row">
          <span className="label">トリガー:</span>
          <span className="value">{label}</span>
        </div>

        {/* ターゲット情報がある場合は表示 */}
        {targetNames ? (
          <div className="event-node-info-row">
            <span className="label">対象:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '120px' }}>
              <Target size={12} color="#888" />
              <span className="value" title={targetNames} style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                flex: 1
              }}>
                {targetNames}
              </span>
            </div>
          </div>
        ) : (
          <div className="event-node-info-row">
            <span className="label">対象:</span>
            <span className="value" style={{ color: '#666', fontStyle: 'italic' }}>(全て / ページ全体)</span>
          </div>
        )}
      </div>

      {/* イベントは始点なので出力ハンドル(Right)のみ */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="event-node-handle"
      />
    </div>
  );
};

export default memo(EventNode);

export const eventNodeConfig: any = {
  title: "イベント設定",
  properties: [
    {
      name: "eventType",
      label: "トリガーの種類:",
      type: "select",
      defaultValue: "click",
      // 選択肢は NodePropertiesEditor 側でコンテキストに応じて動的に生成されます
    },
    {
      name: "targetItemIds",
      label: "対象アイテム (複数可):",
      type: "multiselect",
      defaultValue: [],
      // 選択肢は NodePropertiesEditor 側で自動生成されます
    },
  ],
};