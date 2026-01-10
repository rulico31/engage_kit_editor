import React, { useState } from 'react';
import { useDebugLogStore } from '../stores/useDebugLogStore';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import './DebugLogPanel.css';

const DebugLogPanel: React.FC = () => {
    const { logs, clearLogs, isVisible } = useDebugLogStore();

    if (!isVisible) return null;
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

    const toggleLogDetails = (logId: string) => {
        setExpandedLogIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
        });
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className={`debug-log-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="debug-log-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="debug-log-title">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    <span>デバッグログ ({logs.length})</span>
                </div>
                {isExpanded && (
                    <button
                        className="debug-log-clear-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            clearLogs();
                        }}
                        title="ログをクリア"
                    >
                        <Trash2 size={14} />
                        クリア
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="debug-log-content">
                    {logs.length === 0 ? (
                        <div className="debug-log-empty">ログがありません</div>
                    ) : (
                        <div className="debug-log-list">
                            {logs.map((log) => (
                                <div key={log.id} className={`debug-log-entry level-${log.level}`}>
                                    <div
                                        className="debug-log-main"
                                        onClick={() => log.details && toggleLogDetails(log.id)}
                                        style={{ cursor: log.details ? 'pointer' : 'default' }}
                                    >
                                        <span className="debug-log-time">{formatTime(log.timestamp)}</span>
                                        <span className="debug-log-icon">{getLevelIcon(log.level)}</span>
                                        <span className="debug-log-message">{log.message}</span>
                                    </div>

                                    {log.details && expandedLogIds.has(log.id) && (
                                        <div className="debug-log-details">
                                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DebugLogPanel;
