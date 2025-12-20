import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Split, CheckCircle2, XCircle } from "lucide-react";
import { usePageStore } from "../../stores/usePageStore"; // 名前解決用にストアを追加
import "./IfNode.css";
import type { PropertyConfig } from "../../types";

const IfNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // ストアからアイテムリストを取得して、IDから名前を引けるようにする
  const placedItems = usePageStore((s) =>
    s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []
  );

  // 設定内容を解析して、人間が読める「条件式」の要約を作成する
  const getConditionSummary = () => {
    const source = data.conditionSource || 'item';

    // パターンA: アイテムの状態（表示/非表示）
    if (source === 'item') {
      const targetId = data.conditionTargetId;
      // IDからアイテム名を検索
      const targetItem = placedItems.find(item => item.id === targetId);
      const targetName = targetItem
        ? (targetItem.displayName || targetItem.data.text || targetItem.name)
        : "(対象なし)";

      const state = data.conditionType === 'isHidden' ? 'は非表示' : 'は表示中';

      return `${targetName} ${state}`;
    }

    // パターンB: 変数の値比較
    if (source === 'variable') {
      const variable = data.variableName || 'var';
      const op = data.comparison || '==';
      const val = data.comparisonValue || '';

      return `${variable} ${op} ${val}`;
    }

    return '(条件未設定)';
  };

  const conditionSummary = getConditionSummary();

  return (
    <div className="if-node">
      {/* 入力ハンドル (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="if-node-handle"
      />

      <div className="if-node-header">
        <Split className="if-node-icon" />
        <span className="if-node-title">条件分岐</span>
      </div>

      <div className="if-node-body">
        {/* 条件式の表示エリア */}
        <div className="if-node-logic-display">
          <span className="logic-text" title={conditionSummary}>
            {conditionSummary}
          </span>
        </div>

        <div className="if-node-divider" />

        {/* True Branch (真) */}
        <div className="if-node-branch-row true-branch">
          <span className="branch-label">True</span>
          <CheckCircle2 className="branch-icon" />
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            isConnectable={isConnectable}
            className="if-node-handle branch-handle"
          />
        </div>

        {/* False Branch (偽) */}
        <div className="if-node-branch-row false-branch">
          <span className="branch-label">False</span>
          <XCircle className="branch-icon" />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            isConnectable={isConnectable}
            className="if-node-handle branch-handle"
          />
        </div>
      </div>
    </div>
  );
};

export default memo(IfNode);

// ★ 設定(Config)は元の内容をそのまま維持しています
export const ifNodeConfig: any = {
  title: "条件設定", // タイトルのみ少し分かりやすく変更
  properties: [
    {
      name: "conditionSource",
      label: "比較対象のソース:",
      type: "select",
      defaultValue: "item",
      options: [
        { label: "アイテムのプロパティ", value: "item" },
        { label: "変数の値", value: "variable" },
      ],
    },
    {
      name: "conditionTargetId",
      label: "対象アイテム:",
      type: "select",
      condition: {
        name: "conditionSource",
        value: "item",
      },
      // ※エディタ側でitemsからoptionsを生成する想定
    },
    {
      name: "conditionType",
      label: "状態:",
      type: "select",
      defaultValue: "isVisible",
      options: [
        { label: "表示されている", value: "isVisible" },
        { label: "非表示である", value: "isHidden" },
      ],
      condition: {
        name: "conditionSource",
        value: "item",
      },
    },
    {
      name: "variableName",
      label: "変数名:",
      type: "text",
      defaultValue: "",
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
    {
      name: "comparisonType",
      label: "データ型:",
      type: "select",
      defaultValue: "string",
      options: [
        { label: "文字列", value: "string" },
        { label: "数値", value: "number" },
      ],
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
    {
      name: "comparison",
      label: "比較演算子:",
      type: "select",
      defaultValue: "==",
      options: [ // オプションが不足していた場合は追加してください
        { label: "== (等しい)", value: "==" },
        { label: "!= (異なる)", value: "!=" },
        { label: "> (より大きい)", value: ">" },
        { label: ">= (以上)", value: ">=" },
        { label: "< (より小さい)", value: "<" },
        { label: "<= (以下)", value: "<=" },
      ],
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
    {
      name: "comparisonValue",
      label: "比較する値:",
      type: "text",
      defaultValue: "",
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
  ],
};