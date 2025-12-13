import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import './ExternalApiNode.css';
import type { NodePropertyConfig } from '../../types';

const ExternalApiNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="external-api-node">
            <div className="external-api-node-header">
                <span className="external-api-node-icon">🌍</span>
                <span className="external-api-node-title">External API</span>
                <span className={`external-api-node-method-badge ${data.method === 'POST' ? 'post' : 'get'}`}>
                    {data.method || 'GET'}
                </span>
            </div>

            <div className="external-api-node-body">
                <div className="external-api-node-info-row">
                    <span className="label">URL:</span>
                    <span className="value" title={data.url}>{data.url || '(Not set)'}</span>
                </div>
                <div className="external-api-node-info-row">
                    <span className="label">To:</span>
                    <span className="value">{data.variableName || '(No var)'}</span>
                </div>

                {/* Outputs Section */}
                <div className="external-api-node-output-container">
                    <div className="external-api-node-row" style={{ top: '30%' }}>
                        <span className="external-api-node-label-success">Success</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="success"
                            isConnectable={isConnectable}
                            className="external-api-node-handle"
                        />
                    </div>
                    <div className="external-api-node-row" style={{ top: '70%' }}>
                        <span className="external-api-node-label-error">Error</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="error"
                            isConnectable={isConnectable}
                            className="external-api-node-handle"
                        />
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="external-api-node-handle-input"
            />
        </div>
    );
};

export default memo(ExternalApiNode);

export const externalApiNodeConfig: NodePropertyConfig = {
    title: "API設定",
    properties: [
        {
            name: "url",
            label: "URL:",
            type: "text",
            defaultValue: "",
        },
        {
            name: "method",
            label: "Method:",
            type: "select",
            defaultValue: "GET",
            options: [
                { label: "GET", value: "GET" },
                { label: "POST", value: "POST" },
            ],
        },
        {
            name: "variableName",
            label: "保存先変数名:",
            type: "text",
            defaultValue: "apiResult",
        },
    ],
};
