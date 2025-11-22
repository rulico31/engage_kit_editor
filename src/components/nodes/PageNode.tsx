// src/components/nodes/PageNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./PageNode.css";
import type { NodePropertyConfig } from "../../types";

// ★ 修正: id を削除
interface PageNodeProps extends NodeProps {}

const PageNode: React.FC<PageNodeProps> = ({
  data,
}) => {
  return (
    <div className="page-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="page-node-label">{data.label || "ページ遷移"}</div>
      
      {/* (ページ遷移ノードは終点なので、出力ハンドルはなし) */}
    </div>
  );
};

export default memo(PageNode);

export const pageNodeConfig: NodePropertyConfig = {
  title: "ノード設定",
  properties: [
    {
      name: "targetPageId",
      label: "遷移先ページ:",
      type: "select", 
    },
  ],
};