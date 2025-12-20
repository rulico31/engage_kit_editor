import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Film, Move, Maximize, RotateCw, Sun } from "lucide-react";
import { usePageStore } from "../../stores/usePageStore";
import "./AnimateNode.css";
import type { PropertyConfig } from "../../types";

const AnimateNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // ストアからアイテムリストを取得して、IDから名前を引けるようにする
  const placedItems = usePageStore((s) =>
    s.selectedPageId ? s.pages[s.selectedPageId]?.placedItems || [] : []
  );

  // ターゲットアイテムの情報を検索
  const targetItem = placedItems.find(item => item.id === data.targetItemId);
  const targetName = targetItem
    ? (targetItem.displayName || targetItem.data.text || targetItem.name)
    : "(Not Set)";

  // アニメーションタイプに応じたアイコンと要約テキストの生成
  const getAnimationInfo = () => {
    const type = data.animType || 'opacity';
    const mode = data.animationMode || 'absolute';
    const val = data.value || 0;
    const duration = data.durationS || 0.5;

    // 追加: 詳細設定の取得
    const delay = Number(data.delayS) || 0;
    const easing = data.easing || 'ease';

    let icon = <Film className="animate-node-icon" />;
    let label = "アニメーション";
    let summary = "";

    switch (type) {
      case 'opacity':
        icon = <Sun className="animate-node-icon" />;
        label = "フェード";
        if (mode === 'relative') {
          const op = data.relativeOperation === 'subtract' ? '-' : '*';
          summary = `不透明度 ${op} ${val}`;
        } else {
          summary = `不透明度を ${val} に`;
        }
        break;
      case 'moveX':
        icon = <Move className="animate-node-icon" />;
        label = "X移動";
        summary = mode === 'relative' ? `Xを ${val}px 移動` : `Xを ${val}px に`;
        break;
      case 'moveY':
        icon = <Move className="animate-node-icon" style={{ transform: 'rotate(90deg)' }} />;
        label = "Y移動";
        summary = mode === 'relative' ? `Yを ${val}px 移動` : `Yを ${val}px に`;
        break;
      case 'scale':
        icon = <Maximize className="animate-node-icon" />;
        label = "拡大縮小";
        summary = mode === 'relative' ? `倍率を ${val}倍 変更` : `${val}倍 に`;
        break;
      case 'rotate':
        icon = <RotateCw className="animate-node-icon" />;
        label = "回転";
        summary = mode === 'relative' ? `${val}° 回転` : `${val}° に`;
        break;
      default:
        break;
    }

    return { icon, label, summary, duration, delay, easing };
  };

  const { icon, summary, duration, delay, easing } = getAnimationInfo();

  // タイミング情報の表示テキストを作成
  const getTimingText = () => {
    const parts = [];
    if (delay > 0) parts.push(`+${delay}秒 遅延`);
    if (easing !== 'ease') parts.push(easing);
    return parts.join(', ');
  };

  const timingText = getTimingText();

  return (
    <div className="animate-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="animate-node-handle"
      />

      <div className="animate-node-header">
        {icon}
        <span className="animate-node-title">アニメーション</span>
        <span className="animate-node-badge">{duration}秒</span>
      </div>

      <div className="animate-node-body">
        <div className="animate-node-info-row">
          <span className="label">対象:</span>
          <span className="value" title={targetName}>{targetName}</span>
        </div>
        <div className="animate-node-info-row">
          <span className="label">効果:</span>
          <span className="value">{summary}</span>
        </div>

        {/* タイミング詳細（遅延やイージングがある場合のみ表示） */}
        {timingText && (
          <div className="animate-node-info-row">
            <span className="label">タイミング:</span>
            <span className="value" style={{ fontSize: '11px', color: '#666' }}>{timingText}</span>
          </div>
        )}

        {/* 繰り返し設定がある場合のみ表示 */}
        {data.loopMode === 'count' && (
          <div className="animate-node-info-row">
            <span className="label">ループ:</span>
            <span className="value">{data.loopCount} 回</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="animate-node-handle"
      />
    </div>
  );
};

export default memo(AnimateNode);

export const animateNodeConfig: any[] = [
  {
    title: "ターゲット",
    properties: [
      {
        name: "targetItemId",
        label: "ターゲット:",
        type: "select",
      },
    ],
  },
  {
    title: "アニメーション設定",
    properties: [
      {
        name: "animType",
        label: "種類:",
        type: "select",
        defaultValue: "opacity",
        options: [
          { label: "不透明度", value: "opacity" },
          { label: "X位置", value: "moveX" },
          { label: "Y位置", value: "moveY" },
          { label: "拡大縮小", value: "scale" },
          { label: "回転", value: "rotate" },
        ],
      },
      {
        name: "animationMode",
        label: "指定方法:",
        type: "select",
        defaultValue: "absolute",
        options: [
          { label: "指定した値にする (絶対値)", value: "absolute" },
          { label: "現在の値に追加/増減 (相対値)", value: "relative" },
        ],
      },
      {
        name: "relativeOperation",
        label: "計算方法 (不透明度):",
        type: "select",
        defaultValue: "multiply",
        options: [
          { label: "乗算 (現在の値 * X)", value: "multiply" },
          { label: "減算 (現在の値 - X)", value: "subtract" },
        ],
        condition: {
          name: "animationMode",
          value: "relative",
        },
      },
      {
        name: "value",
        label: "目標値 / 増減値:",
        type: "text",
        defaultValue: 0,
      },
      {
        name: "durationS",
        label: "時間 (秒):",
        type: "text",
        defaultValue: 0.5,
        step: 0.1,
        min: 0,
      },
    ],
  },
  {
    title: "繰り返し (オプション)",
    properties: [
      {
        name: "loopMode",
        label: "繰り返しモード:",
        type: "select",
        defaultValue: "none",
        options: [
          { label: "一度だけ再生", value: "none" },
          { label: "回数を指定", value: "count" },
        ],
      },
      {
        name: "loopCount",
        label: "繰り返し回数:",
        type: "text",
        defaultValue: 2,
        step: 1,
        min: 2,
        condition: {
          name: "loopMode",
          value: "count",
        },
      },
    ],
  },
  {
    title: "詳細設定 (オプション)",
    properties: [
      {
        name: "delayS",
        label: "遅延 (秒):",
        type: "text",
        defaultValue: 0,
        step: 0.1,
        min: 0,
      },
      {
        name: "easing",
        label: "イージング:",
        type: "select",
        defaultValue: "ease",
        options: [
          { label: "ease", value: "ease" },
          { label: "ease-in", value: "ease-in" },
          { label: "ease-out", value: "ease-out" },
          { label: "ease-in-out", value: "ease-in-out" },
          { label: "linear", value: "linear" },
        ],
      },
    ],
  },
];