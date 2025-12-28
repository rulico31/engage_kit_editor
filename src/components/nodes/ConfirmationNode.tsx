import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { CheckSquare, ArrowLeft, Check } from "lucide-react";
import "./ConfirmationNode.css";
import type { PropertyConfig } from "../../types";

const ConfirmationNode: React.FC<NodeProps> = ({ isConnectable }) => {
    return (
        <div className="confirmation-node">
            {/* 入力ハンドル (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="confirmation-node-handle"
            />

            <div className="confirmation-node-header">
                <CheckSquare className="confirmation-node-icon" />
                <span className="confirmation-node-title">CONFIRM</span>
            </div>

            <div className="confirmation-node-body">
                {/* Back Route - ハンドルなし（プロパティで設定） */}
                <div className="confirmation-node-status-row back">
                    <span className="status-label">戻る</span>
                    <ArrowLeft className="status-icon" />
                </div>

                {/* Confirm Route */}
                <div className="confirmation-node-status-row confirm">
                    <span className="status-label">OK</span>
                    <Check className="status-icon" />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="confirm"
                        isConnectable={isConnectable}
                        className="confirmation-node-handle status-handle"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(ConfirmationNode);

export const confirmationNodeConfig: any = {
    title: "確認画面設定",
    properties: [
        {
            name: "targetItemIds",
            label: "確認対象の入力項目",
            type: "multiselect",
            defaultValue: [],
            helperText: "選択された項目の入力チェックを行い、確認画面に表示します。"
        },
        {
            name: "headerText",
            label: "ヘッダーテキスト",
            type: "textarea",
            defaultValue: "入力内容をご確認ください"
        },
        {
            name: "noticeText",
            label: "注意書き",
            type: "textarea",
            defaultValue: "内容に誤りがないかご確認の上、OKボタンを押してください。"
        },
        {
            name: "backPageId",
            label: "戻る先ページ",
            type: "select",
            defaultValue: "",
            helperText: "「戻る」ボタンをクリックした際の遷移先ページ。未設定の場合はモーダルを閉じるのみ。"
        }
    ] as PropertyConfig[],
};
