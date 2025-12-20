import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Eye, EyeOff, ToggleLeft, Zap } from "lucide-react";
import { usePageStore } from "../../stores/usePageStore";
import "./ActionNode.css";
import type { PropertyConfig } from "../../types";

const ActionNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // ストアからアイテムリストを取得して、IDから名前を引けるようにする
  const placedItems = usePageStore((s) =>
    s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []
  );

  // ターゲットアイテムの情報を検索
  const targetItem = placedItems.find(item => item.id === data.targetItemId);
  const targetName = targetItem
    ? (targetItem.displayName || targetItem.data.text || targetItem.name)
    : "(Not Set)";

  // モードに応じたアイコンとラベルの定義
  const getActionInfo = () => {
    const mode = data.mode || 'show';
    switch (mode) {
      case 'show':
        return {
          icon: <Eye className="action-node-icon" />,
          label: '表示',
          badgeColor: 'bg-blue-100 text-blue-700'
        };
      case 'hide':
        return {
          icon: <EyeOff className="action-node-icon" />,
          label: '非表示',
          badgeColor: 'bg-gray-100 text-gray-700'
        };
      case 'toggle':
        return {
          icon: <ToggleLeft className="action-node-icon" />,
          label: '切替',
          badgeColor: 'bg-purple-100 text-purple-700'
        };
      default:
        return {
          icon: <Zap className="action-node-icon" />,
          label: 'Action',
          badgeColor: 'bg-blue-100 text-blue-700'
        };
    }
  };

  const { icon, label } = getActionInfo();

  return (
    <div className="action-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="action-node-handle"
      />

      <div className="action-node-header">
        {icon}
        <span className="action-node-title">表示切替</span>
        <span className="action-node-badge">{label}</span>
      </div>

      <div className="action-node-body">
        <div className="action-node-info-row">
          <span className="label">対象:</span>
          <span className="value" title={targetName}>{targetName}</span>
        </div>
        <div className="action-node-info-row">
          <span className="label">動作:</span>
          <span className="value">{label}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="action-node-handle"
      />
    </div>
  );
};

export default memo(ActionNode);

export const actionNodeConfig: any = {
  title: "表示切り替え設定",
  properties: [
    {
      name: "targetItemId",
      label: "ターゲット:",
      type: "select",
      // 選択肢はエディタ側で動的に生成
    },
    {
      name: "mode",
      label: "動作モード:",
      type: "select",
      defaultValue: "show",
      options: [
        { label: "表示する", value: "show" },
        { label: "非表示にする", value: "hide" },
        { label: "切り替える", value: "toggle" },
      ],
    },
  ],
};