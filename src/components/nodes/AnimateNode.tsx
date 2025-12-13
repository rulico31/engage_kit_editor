// src/components/nodes/AnimateNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./AnimateNode.css"; // (★ 対応するCSSを次に作成します)
import type { NodePropertyConfig } from "../../types"; // ★ 型をインポート

interface AnimateNodeProps extends NodeProps { }

const AnimateNode: React.FC<AnimateNodeProps> = ({
  data,
}) => {
  return (
    <div className="animate-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="animate-node-label">
        {data.label || "アニメーション"}
      </div>

      {/* (設定はプロパティパネルで行う) */}

      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(AnimateNode);

// ★ 以下をファイル末尾に追加
export const animateNodeConfig: NodePropertyConfig[] = [
  {
    title: "ターゲット",
    properties: [
      {
        name: "targetItemId",
        label: "ターゲット:",
        type: "select", // (PropertiesPanel側で placedItems から options を生成)
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
          { label: "不透明度 (Opacity)", value: "opacity" },
          { label: "X位置 (Move X)", value: "moveX" },
          { label: "Y位置 (Move Y)", value: "moveY" },
          { label: "拡大縮小 (Scale)", value: "scale" },
          { label: "回転 (Rotate)", value: "rotate" },
        ],
      },
      {
        name: "animationMode",
        label: "指定方法:",
        type: "select", // (ラジオボタンの代用)
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
        // (注: 本来は animType === 'opacity' も条件だが、
        //  指定された型では1つの条件しか設定できないため animationMode のみで判定)
        condition: {
          name: "animationMode",
          value: "relative",
        },
      },
      {
        name: "value",
        label: "目標値 / 増減値:", // (ラベルは動的に変更できないため固定)
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