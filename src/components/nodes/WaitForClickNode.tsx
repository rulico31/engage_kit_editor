import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { MousePointerClick, Target } from "lucide-react";
import { usePageStore } from "../../stores/usePageStore"; // 名前解決用にストアを追加
import "./WaitForClickNode.css";

const WaitForClickNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // ストアからアイテムリストを取得して、IDから名前を引けるようにする
  const placedItems = usePageStore((s) =>
    s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []
  );

  // ターゲット名の解決ロジック（複数対応）
  const getTargetNames = () => {
    const targetIds = data.targetItemIds || (data.targetItemId ? [data.targetItemId] : []); // マイグレーション対応
    if (targetIds.length === 0) return null;

    const names = targetIds.map((id: string) => {
      const item = placedItems.find(i => i.id === id);
      return item?.displayName || item?.data.text || item?.name || '(Unknown)';
    });

    if (names.length <= 2) {
      return names.join(', ');
    } else {
      return `${names[0]}, ${names[1]} (+${names.length - 2})`;
    }
  };

  const targetNames = getTargetNames();

  return (
    <div className="wait-click-node">
      {/* 入力ハンドル (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="wait-click-node-handle"
      />

      <div className="wait-click-node-header">
        <MousePointerClick className="wait-click-node-icon" />
        <span className="wait-click-node-title">クリック待機</span>
      </div>

      <div className="wait-click-node-body">
        <div className="wait-click-label">対象アイテム:</div>

        {targetNames ? (
          <div className="target-item-badge">
            <Target className="target-icon-small" />
            <span className="target-name">{targetNames}</span>
          </div>
        ) : (
          <div className="target-item-badge not-set">
            <span className="target-name">(未設定)</span>
          </div>
        )}
      </div>

      {/* 出力ハンドル (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="wait-click-node-handle"
      />
    </div>
  );
};

export default memo(WaitForClickNode);

export const waitForClickNodeConfig: any = {
  title: "クリック待機設定",
  properties: [
    {
      name: "targetItemIds",
      label: "対象アイテム:",
      type: "multiselect", // 複数選択対応
      defaultValue: [],
      // エディタ側で options: placedItems を注入する想定
    },
  ],
};