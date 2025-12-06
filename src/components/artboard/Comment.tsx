import React, { useState } from 'react';
import type { CommentType } from '../../types';
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

    const handleSave = () => {
        onUpdate({ content: editContent });
        setIsEditing(false);
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ isMinimized: !comment.isMinimized });
    };

    const handleContentDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditing) {
            onClick();
            onDragStart(e);
        }
    };

    // SVG Icons
    const MinimizeIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );

    const CloseIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    const CommentIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    );

    if (comment.isMinimized) {
        return (
            <div
                className={`comment-minimized ${isSelected ? 'selected' : ''}`}
                style={{
                    left: comment.x,
                    top: comment.y,
                    backgroundColor: comment.color || '#FFFFFF', // Default to clean white
                }}
                onClick={onClick}
                onMouseDown={handleMouseDown}
                onDoubleClick={toggleMinimize}
            >
                <div className="comment-icon">
                    <CommentIcon />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`comment-expanded ${isSelected ? 'selected' : ''}`}
            style={{
                left: comment.x,
                top: comment.y,
                backgroundColor: comment.color || '#FEF3C7', // Default to pastel yellow
            }}
            onClick={onClick}
            onMouseDown={handleMouseDown}
        >
            <div className="comment-header">
                <button
                    className="comment-minimize-btn"
                    onClick={toggleMinimize}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="最小化"
                >
                    <MinimizeIcon />
                </button>
                <button
                    className="comment-delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="削除"
                >
                    <CloseIcon />
                </button>
            </div>
            <div className="comment-body">
                {isEditing ? (
                    <textarea
                        className="comment-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={handleSave}
                        onMouseDown={(e) => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <div
                        className="comment-content"
                        onDoubleClick={handleContentDoubleClick}
                    >
                        {comment.content || 'ダブルクリックして編集...'}
                    </div>
                )}
            </div>
        </div>
    );
};
