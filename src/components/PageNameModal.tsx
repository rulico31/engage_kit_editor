import React, { useState, useEffect, useRef } from 'react';
import './PageNameModal.css';

interface PageNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    initialName?: string;
}

export const PageNameModal: React.FC<PageNameModalProps> = ({ isOpen, onClose, onConfirm, initialName = '' }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>新しいページを作成</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="ページ名を入力"
                        className="modal-input"
                    />
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="modal-cancel-btn">
                            キャンセル
                        </button>
                        <button type="submit" className="modal-confirm-btn" disabled={!name.trim()}>
                            作成
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
