import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { DoorOpen, ArrowRightCircle } from "lucide-react";
import { usePageStore } from "../../stores/usePageStore";
import "./PageNode.css";
import type { PropertyConfig } from "../../types";


const PageNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // ストアから全ページ情報を取得して、IDからページ名を引けるようにする
  const pages = usePageStore((s) => s.pages);

  // ターゲットページの情報を検索
  const targetPage = data.targetPageId ? pages[data.targetPageId] : null;
  const targetPageName = targetPage ? targetPage.name : "(未設定)";

  return (
    <div className="page-node">
      {/* 入力ハンドル (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="page-node-handle"
      />

      <div className="page-node-header">
        <DoorOpen className="page-node-icon" />
        <span className="page-node-title">ページ遷移</span>
        <ArrowRightCircle className="page-node-icon-small" />
      </div>

      <div className="page-node-body">
        <div className="page-node-info-row">
          <span className="label">遷移先:</span>
        </div>
        <div className="page-node-destination">
          {targetPageName}
        </div>
      </div>

      {/* ページ遷移はフローの終端となるため、出力ハンドルは配置しません */}
    </div>
  );
};

export default memo(PageNode);

export const pageNodeConfig: any = {
  title: "遷移設定",
  properties: [
    {
      name: "targetPageId",
      label: "遷移先ページ:",
      type: "select",
      // 選択肢はエディタ側でページリストに基づいて動的に生成されます
    },
  ],
};