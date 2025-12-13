import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import './SubmitFormNode.css';

const SubmitFormNode = ({ isConnectable }: NodeProps) => {
    return (
        <div className="submit-form-node">
            <div className="submit-form-node-header">
                <span className="submit-form-node-icon">📤</span>
                Submit Form
            </div>

            <div className="submit-form-node-body">
                <div className="submit-form-node-row" style={{ top: '35%' }}>
                    <span className="submit-form-node-label-success">Success</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="success"
                        isConnectable={isConnectable}
                        className="submit-form-node-handle"
                    />
                </div>
                <div className="submit-form-node-row" style={{ top: '65%' }}>
                    <span className="submit-form-node-label-error">Error</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="error"
                        isConnectable={isConnectable}
                        className="submit-form-node-handle"
                    />
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="submit-form-node-handle-input"
            />
        </div>
    );
};

export default memo(SubmitFormNode);
