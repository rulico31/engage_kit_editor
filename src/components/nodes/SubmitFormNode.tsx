import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import './SubmitFormNode.css';

const SubmitFormNode = ({ isConnectable }: NodeProps) => {
    return (
        <div className="submit-form-node">
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
            />

            <div className="submit-form-node-header">
                <span className="submit-form-node-icon">📤</span>
                Submit Form
            </div>

            <div className="submit-form-node-labels">
                <span className="submit-form-node-label-success">Success</span>
                <span className="submit-form-node-label-error">Error</span>
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

export default memo(SubmitFormNode);
