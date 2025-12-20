import React, { useState, useRef, useEffect } from 'react';
import { useEditorSettingsStore } from '../stores/useEditorSettingsStore';
import './GridPopover.css';

export const GridControls: React.FC = () => {
    const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
    const gridMenuRef = useRef<HTMLDivElement>(null);

    const { gridSize, setGridSize, showGrid, setShowGrid } = useEditorSettingsStore(state => ({
        gridSize: state.gridSize,
        setGridSize: state.setGridSize,
        showGrid: state.showGrid,
        setShowGrid: state.setShowGrid,
    }));

    // グリッドメニュー外クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (gridMenuRef.current && !gridMenuRef.current.contains(event.target as Node)) {
                setIsGridMenuOpen(false);
            }
        };
        if (isGridMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isGridMenuOpen]);

    return (
        <div ref={gridMenuRef} className="grid-controls-wrapper">
            <button
                onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                }}
            >
                Grid
            </button>

            {isGridMenuOpen && (
                <div
                    className="grid-popover"
                    style={{
                        position: 'absolute',
                        top: '40px',
                        right: '0',
                        width: '240px',
                        backgroundColor: '#252526',
                        border: '1px solid #454545',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    {/* グリッド線表示切り替え */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75em', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>
                            グリッド線
                        </label>
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            style={{
                                padding: '8px',
                                backgroundColor: showGrid ? '#2a8a4a' : '#333',
                                color: '#fff',
                                border: `1px solid ${showGrid ? '#2a8a4a' : '#444'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            {showGrid ? '表示中 (ON)' : '非表示 (OFF)'}
                        </button>
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#3e3e3e' }} />

                    {/* グリッドサイズ選択 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75em', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>
                            グリッドサイズ (PX)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {[null, 1, 2, 4, 8, 16, 32].map((size) => (
                                <button
                                    key={size === null ? 'null' : size}
                                    onClick={() => setGridSize(size)}
                                    style={{
                                        padding: '8px 0',
                                        backgroundColor: gridSize === size ? '#007acc' : '#333',
                                        color: gridSize === size ? '#fff' : '#ccc',
                                        border: `1px solid ${gridSize === size ? '#007acc' : '#444'}`,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9em',
                                        fontWeight: 600,
                                    }}
                                >
                                    {size === null ? 'なし' : size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
