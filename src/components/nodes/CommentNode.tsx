import React, { useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { usePageStore } from '../../stores/usePageStore';

interface CommentNodeData {
    label: string;
    content: string;
    isMinimized: boolean;
    color?: string;
}

const CommentNode: React.FC<NodeProps<CommentNodeData>> = ({ data, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(data.content || '');

    const updateNodeData = usePageStore(state => state.updateNodeData);
    const { applyNodesChange } = usePageStore.getState();

    const handleSave = useCallback(() => {
        // コンテンツを保存
        updateNodeData(id, { content });
        setIsEditing(false);
    }, [content, id, updateNodeData]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    const handleMinimize = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        updateNodeData(id, { isMinimized: !data.isMinimized });
    }, [id, data.isMinimized, updateNodeData]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // ノードを削除
        applyNodesChange([{ type: 'remove', id }]);
    }, [id, applyNodesChange]);

    const backgroundColor = data.color || '#FEF3C7';

    // SVGアイコン
    const MinimizeIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );

    const CloseIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    if (data.isMinimized) {
        return (
            <div
                onDoubleClick={handleMinimize}
                style={{
                    backgroundColor,
                    border: '2px solid #F59E0B',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
            >
                <span style={{ fontSize: '20px' }}>💬</span>
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor,
                border: '2px solid #F59E0B',
                borderRadius: '8px',
                minWidth: '200px',
                minHeight: '100px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* ヘッダー */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    color: '#92400E',
                    fontSize: '12px',
                    fontWeight: 600,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '4px' }}>💬</span>
                    <span>コメント</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleMinimize}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#92400E',
                            opacity: 0.6,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                        title="最小化"
                    >
                        <MinimizeIcon />
                    </button>
                    <button
                        onClick={handleDelete}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#92400E',
                            opacity: 0.6,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                        title="削除"
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* コンテンツ */}
            <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#78350F' }}>
                {isEditing ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleSave}
                        autoFocus
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            border: 'none',
                            background: 'transparent',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            color: 'inherit',
                        }}
                    />
                ) : (
                    <div
                        onDoubleClick={handleDoubleClick}
                        style={{
                            minHeight: '60px',
                            cursor: 'text',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {content || 'ダブルクリックして編集...'}
                    </div>
                )}
            </div>

            {/* ハンドルは非表示（接続不要） */}
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
            <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
        </div>
    );
};

export default CommentNode;
