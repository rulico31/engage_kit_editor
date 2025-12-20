import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { MessageSquareText, Minus, X } from 'lucide-react';
import { usePageStore } from '../../stores/usePageStore';
import "./CommentNode.css";

interface CommentNodeData {
    label?: string;
    content: string;
    isMinimized: boolean;
    color?: string;
}

const CommentNode: React.FC<NodeProps<CommentNodeData>> = ({ data, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(data.content || '');
    const [isHovered, setIsHovered] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const updateNodeData = usePageStore(state => state.updateNodeData);
    const { applyNodesChange } = usePageStore.getState();

    // 自動フォーカス
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = useCallback(() => {
        updateNodeData(id, { content });
        setIsEditing(false);
    }, [content, id, updateNodeData]);

    // ★変更: シングルクリックで編集
    const handleContentClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    const toggleMinimize = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const nextState = !data.isMinimized;
        updateNodeData(id, { isMinimized: nextState });

        // 展開時に編集モードへ
        if (!nextState) setIsEditing(true);
    }, [id, data.isMinimized, updateNodeData]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        applyNodesChange([{ type: 'remove', id }]);
    }, [id, applyNodesChange]);

    // --- 最小化モード (Pill Shape) ---
    if (data.isMinimized) {
        return (
            <div
                className="comment-node-minimized"
                onDoubleClick={toggleMinimize} // 最小化解除はダブルクリック（誤操作防止）
                title="ダブルクリックで展開"
            >
                <div className="minimized-icon">
                    <MessageSquareText size={14} />
                </div>
                <span className="minimized-text">
                    {content.length > 15 ? content.substring(0, 15) + "..." : (content || "Note")}
                </span>

                <Handle type="target" position={Position.Top} className="hidden-handle" />
                <Handle type="source" position={Position.Bottom} className="hidden-handle" />
            </div>
        );
    }

    // --- 展開モード (Card Shape) ---
    return (
        <div
            className={`comment-node-expanded ${isEditing ? 'editing' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ホバー or 編集中にボタンを表示 */}
            <div className={`comment-actions ${isHovered || isEditing ? 'visible' : ''}`}>
                <button onClick={toggleMinimize} className="action-btn minimize" title="最小化" onMouseDown={e => e.stopPropagation()}>
                    <Minus size={14} />
                </button>
                <button onClick={handleDelete} className="action-btn delete" title="削除" onMouseDown={e => e.stopPropagation()}>
                    <X size={14} />
                </button>
            </div>

            <div className="comment-content-area">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleSave}
                        className="comment-textarea"
                        placeholder="メモを入力..."
                        onMouseDown={e => e.stopPropagation()} // ドラッグ防止
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                handleSave();
                            }
                        }}
                    />
                ) : (
                    <div
                        onClick={handleContentClick} // ★シングルクリック
                        className={`comment-display ${!content ? 'empty' : ''}`}
                    >
                        {content || 'クリックして編集...'}
                    </div>
                )}
            </div>

            <div className="comment-footer">
                <MessageSquareText size={14} className="footer-icon" />
            </div>

            <Handle type="target" position={Position.Top} className="hidden-handle" />
            <Handle type="source" position={Position.Bottom} className="hidden-handle" />
        </div>
    );
};

export const commentNodeConfig = {
    component: CommentNode
};

export default CommentNode;