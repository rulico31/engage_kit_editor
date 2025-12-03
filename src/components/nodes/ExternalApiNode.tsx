import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import './ExternalApiNode.css';
import type { NodePropertyConfig } from '../../types';

const ExternalApiNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="external-api-node">
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
            />

            <div className="external-api-node-header">
                <span className="external-api-node-icon">🌍</span>
                External API
            </div>

            <div className="external-api-node-info">
                <div><strong>Method:</strong> {data.method || 'GET'}</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>URL:</strong> {data.url || '(Not set)'}
                </div>
                <div><strong>To:</strong> {data.variableName || '(No var)'}</div>
            </div>

            <div className="external-api-node-labels">
                <span className="external-api-node-label-success">Success</span>
                <span className="external-api-node-label-error">Error</span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="success"
                style={{ left: '25%' }}
                isConnectable={isConnectable}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="error"
                style={{ left: '75%' }}
                isConnectable={isConnectable}
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
