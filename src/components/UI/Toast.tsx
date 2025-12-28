import React from 'react';
import { useToastStore } from '../../stores/useToastStore';
import './Toast.css';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
    success: <CheckCircle color="#10b981" />,
    error: <AlertCircle color="#ef4444" />,
    info: <Info color="#3b82f6" />,
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <div className="toast-icon">
                        {icons[toast.type]}
                    </div>
                    <div className="toast-content">
                        {toast.message}
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
