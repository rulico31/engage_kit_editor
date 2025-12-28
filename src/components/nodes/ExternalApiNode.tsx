import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Globe, CheckCircle2, AlertCircle } from "lucide-react";
import "./ExternalApiNode.css";
import type { PropertyConfig } from "../../types";

const ExternalApiNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
    const method = data.method || "GET";
    const url = data.url || "";
    const variableName = data.variableName || "(なし)";

    // URLの表示用整形ロジック（修正版）
    const getDisplayUrl = (url: string) => {
        if (!url) return "(未設定)";
        // "https://" などのプロトコル部分だけ削除し、あとはCSSの省略機能に任せる
        return url.replace(/^https?:\/\//, '');
    };

    return (
        <div className="external-api-node">
            {/* 入力ハンドル (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="external-api-node-handle"
            />

            <div className="external-api-node-header">
                <Globe className="external-api-node-icon" />
                <span className="external-api-node-title">外部API</span>
                <span className={`external-api-node-badge ${method.toLowerCase()}`}>
                    {method}
                </span>
            </div>

            <div className="external-api-node-body">
                <div className="external-api-node-info-row">
                    <span className="label">URL:</span>
                    <span className="value url" title={url}>{getDisplayUrl(url)}</span>
                </div>
                <div className="external-api-node-info-row">
                    <span className="label">保存先:</span>
                    <span className="value">{variableName}</span>
                </div>

                <div className="external-api-node-divider" />

                {/* Success Route */}
                <div className="external-api-node-status-row success">
                    <span className="status-label">Success</span>
                    <CheckCircle2 className="status-icon" />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="success"
                        isConnectable={isConnectable}
                        className="external-api-node-handle status-handle"
                    />
                </div>

                {/* Error Route */}
                <div className="external-api-node-status-row error">
                    <span className="status-label">Error</span>
                    <AlertCircle className="status-icon" />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="error"
                        isConnectable={isConnectable}
                        className="external-api-node-handle status-handle"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(ExternalApiNode);

export const externalApiNodeConfig: any = {
    title: "API接続設定",
    properties: [
        {
            name: "url",
            label: "エンドポイントURL:",
            type: "text",
            defaultValue: "",
        },
        {
            name: "method",
            label: "メソッド:",
            type: "select",
            defaultValue: "POST",
            options: [
                { label: "POST (送信)", value: "POST" },
            ],
        },
        {
            name: "variableName",
            label: "保存先変数名 (任意):",
            type: "text",
            defaultValue: "apiResult",
        },
    ],
};