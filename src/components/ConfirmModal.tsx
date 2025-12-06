import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDanger = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-content">
                <div className="confirm-modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="confirm-modal-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-modal-footer">
                    <button className="confirm-modal-btn cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`confirm-modal-btn confirm ${isDanger ? 'danger' : 'primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
