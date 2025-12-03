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
            <Handle type="target" position={Position.Top} />

            <div className="ab-test-node-header">
                <span>⚖️ A/B Test</span>
            </div>

            <div className="ab-test-content">
                <div className="ab-test-slider-container">
                    <div className="ab-test-slider-label">
                        <span>Path A: {probability}%</span>
                        <span>Path B: {100 - probability}%</span>
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

            <div className="ab-test-handles">
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="pathA"
                    style={{ left: '20%' }}
                />
                <span className="ab-test-handle-label left" style={{ left: '10%' }}>Path A</span>

                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="pathB"
                    style={{ left: '80%' }}
                />
                <span className="ab-test-handle-label right" style={{ right: '10%' }}>Path B</span>
            </div>
        </div>
    );
};

export default memo(ABTestNode);
