// src/components/nodes/PageNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./PageNode.css";
// (★ 削除)
// import type { PageInfo } from "../../types.ts";

// (★ 変更) Props の型から不要なものを削除
interface PageNodeProps extends NodeProps {
  // (★ 削除) pageInfoList: PageInfo[];
  // (★ 削除) onDataChange: (nodeId: string, dataUpdate: any) => void;
}

const PageNode: React.FC<PageNodeProps> = ({
  id,
  data,
  // (★ 削除) pageInfoList,
  // (★ 削除) onDataChange,
}) => {
  // (★ 削除) すべてのハンドラを削除
  // const handleTargetChange = ...

  return (
    <div className="page-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="page-node-label">{data.label || "ページ遷移"}</div>

      {/* (★ 削除) ここからドロップダウンUIをすべて削除 */}
      {/*
      <div className="page-node-select-wrapper">
        <label>遷移先ページ:</label>
        <select ... >
          ...
        </select>
      </div>
      */}
      {/* (★ 削除) ここまで */}
      
      {/* (ページ遷移ノードは終点なので、出力ハンドルはなし) */}
    </div>
  );
};

export default memo(PageNode);