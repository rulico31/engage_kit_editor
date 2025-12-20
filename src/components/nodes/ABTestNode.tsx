import React from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Scale, FlaskConical } from "lucide-react";
import "./ABTestNode.css";
import type { PropertyConfig } from "../../types";

// memo化を外して、dataの変更(比率変更)に対して敏感に反応するように修正
const ABTestNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
    // 比率の取得 (デフォルト 50:50)
    // 文字列で来ても数値に変換し、0-100の範囲に収める
    const rawRatio = data.ratioA !== undefined ? data.ratioA : 50;
    const ratioA = Math.min(100, Math.max(0, Number(rawRatio)));
    const ratioB = 100 - ratioA;

    return (
        <div className="ab-test-node">
            {/* 入力ハンドル (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="ab-test-node-handle"
            />

            <div className="ab-test-node-header">
                <Scale className="ab-test-node-icon" />
                <span className="ab-test-node-title">A/Bテスト</span>
                <FlaskConical className="ab-test-node-icon-small" />
            </div>

            <div className="ab-test-node-body">
                {/* 視覚的な分布バー */}
                <div className="distribution-bar-container">
                    <div
                        className="distribution-segment segment-a"
                        style={{ width: `${ratioA}%` }}
                    />
                    <div
                        className="distribution-segment segment-b"
                        style={{ width: `${ratioB}%` }}
                    />
                    {/* 中央の境界線マーカー */}
                    <div className="distribution-divider" style={{ left: `${ratioA}%` }} />
                </div>

                {/* Path A Output */}
                <div className="ab-test-path-row path-a">
                    <div className="path-info">
                        <span className="path-label">Path A</span>
                        <span className="path-value">{ratioA}%</span>
                    </div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="pathA"
                        isConnectable={isConnectable}
                        className="ab-test-node-handle path-handle"
                    />
                </div>

                {/* Path B Output */}
                <div className="ab-test-path-row path-b">
                    <div className="path-info">
                        <span className="path-label">Path B</span>
                        <span className="path-value">{ratioB}%</span>
                    </div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="pathB"
                        isConnectable={isConnectable}
                        className="ab-test-node-handle path-handle"
                    />
                </div>
            </div>
        </div>
    );
};

export default ABTestNode;

export const abTestNodeConfig: any = {
    title: "A/Bテスト設定",
    properties: [
        {
            name: "ratioA",
            label: "Path A の比率 (%):",
            type: "text",
            defaultValue: "50",
            description: "0〜100の数値を入力してください"
        },
    ],
};