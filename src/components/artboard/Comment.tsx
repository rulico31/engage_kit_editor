import React, { useState, useRef, useEffect } from 'react';
import type { CommentType } from '../../types';
import { MessageCircle, X, Minus } from 'lucide-react';
// ★追加: 選択状態を管理するストアをインポート
import { useSelectionStore } from '../../stores/useSelectionStore';
import './Comment.css';

interface CommentProps {
    comment: CommentType;
    onUpdate: (updates: Partial<CommentType>) => void;
    onDelete: () => void;
    isSelected: boolean;
    onClick: () => void;
    onDragStart: (e: React.MouseEvent) => void;
}

export const Comment: React.FC<CommentProps> = ({
    comment,
    onUpdate,
    onDelete,
    isSelected,
    onClick,
    onDragStart,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 編集モード時に自動フォーカス & カーソルを末尾へ
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, [isEditing]);

    const handleSave = () => {
        onUpdate({ content: editContent });
        setIsEditing(false);
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextState = !comment.isMinimized;
        onUpdate({ isMinimized: nextState });

        // 展開時は自動で編集モードへ、最小化時は解除
        if (!nextState) setIsEditing(true);
        else setIsEditing(false);
    };

    // シングルクリックで編集開始
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // 編集中はドラッグさせない
        if (!isEditing) {
            e.stopPropagation(); // 親へのイベント伝播を止める

            // ★重要: コメントをクリックしたら、他のアイテムの選択を全解除する
            useSelectionStore.getState().handleBackgroundClick();

            onClick(); // このコメントを選択状態にする
            onDragStart(e);
        }
    };

    // --- 最小化モード (Badge Style) ---
    if (comment.isMinimized) {
        return (
            <div
                className={`comment-badge ${isSelected ? 'selected' : ''}`}
                style={{ left: comment.x, top: comment.y }}
                onMouseDown={handleMouseDown}
                onDoubleClick={toggleMinimize}
                title="ダブルクリックで展開"
            >
                <MessageCircle size={18} fill="currentColor" className="badge-icon" />
            </div>
        );
    }

    // --- 展開モード (Note Style) ---
    return (
        <div
            className={`comment-note ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
            style={{ left: comment.x, top: comment.y }}
            onMouseDown={handleMouseDown}
        >
            {/* アクションボタン */}
            <div className="comment-actions">
                <button
                    className="action-btn minimize"
                    onClick={toggleMinimize}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="最小化"
                >
                    <Minus size={14} />
                </button>
                <button
                    className="action-btn delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="削除"
                >
                    <X size={14} />
                </button>
            </div>

            {/* コンテンツエリア */}
            <div className="comment-body">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className="comment-textarea comment-text-style"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={handleSave}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="コメントを入力..."
                        onKeyDown={(e) => {
                            // Ctrl+Enter または Cmd+Enter で保存
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                handleSave();
                            }
                        }}
                    />
                ) : (
                    <div
                        className={`comment-content comment-text-style ${!comment.content ? 'empty' : ''}`}
                        onClick={handleContentClick}
                    >
                        {comment.content || 'クリックして編集...'}
                    </div>
                )}
            </div>

            {/* フッター */}
            <div className="comment-footer">
                <div className="footer-avatar-placeholder">
                    <MessageCircle size={12} />
                </div>
            </div>
        </div>
    );
};