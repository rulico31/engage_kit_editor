import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import "./SubmitFormNode.css";
import type { PropertyConfig } from "../../types";

const SubmitFormNode: React.FC<NodeProps> = ({ isConnectable }) => {
    return (
        <div className="submit-form-node">
            {/* 入力ハンドル (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="submit-form-node-handle"
            />

            <div className="submit-form-node-header">
                <Send className="submit-form-node-icon" />
                <span className="submit-form-node-title">SUBMIT FORM</span>
            </div>

            <div className="submit-form-node-body">
                {/* Success Route */}
                <div className="submit-form-node-status-row success">
                    <span className="status-label">Success</span>
                    <CheckCircle2 className="status-icon" />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="success"
                        isConnectable={isConnectable}
                        className="submit-form-node-handle status-handle"
                    />
                </div>

                {/* Error Route */}
                <div className="submit-form-node-status-row error">
                    <span className="status-label">Error</span>
                    <AlertCircle className="status-icon" />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="error"
                        isConnectable={isConnectable}
                        className="submit-form-node-handle status-handle"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(SubmitFormNode);

export const submitFormNodeConfig: any = {
    title: "フォーム送信設定",
    properties: [
        // 必要に応じて送信先URL設定などを追加可能
        // 現状はデフォルトの送信機能を使用
    ],
};