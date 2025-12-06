import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { usePageStore } from '../../stores/usePageStore';
import './ABTestNode.css';

const ABTestNode = ({ id, data }: NodeProps) => {
    const updateNodeData = usePageStore((state) => state.updateNodeData);
    const probability = data.probability ?? 50;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { probability: Number(e.target.value) });
    };

    return (
        <div className="ab-test-node">
            {/* Input Handle (Left) */}
            <Handle type="target" position={Position.Left} />

            <div className="ab-test-node-header">
                <span>⚖️ A/B Test</span>
            </div>

            <div className="ab-test-content">
                <div className="ab-test-slider-container noDrag">
                    <div className="ab-test-slider-label">
                        <span>A: {probability}%</span>
                        <span>B: {100 - probability}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={probability}
                        onChange={handleChange}
                        className="ab-test-slider"
                    />
                </div>
            </div>

            {/* Output Handles (Right) */}
            <div className="ab-test-handles-right">
                <div className="ab-test-handle-row">
                    <span className="ab-test-socket-label">Path A</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="pathA"
                        className="ab-handle-right"
                    />
                </div>
                <div className="ab-test-handle-row">
                    <span className="ab-test-socket-label">Path B</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="pathB"
                        className="ab-handle-right"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(ABTestNode);
