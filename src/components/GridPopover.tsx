import React from "react";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import "./GridPopover.css";

interface GridPopoverProps {
    onClose?: () => void;
}

export const GridPopover: React.FC<GridPopoverProps> = () => {
    const { gridSize, showGrid, setGridSize, setShowGrid } = useEditorSettingsStore(
        (state) => ({
            gridSize: state.gridSize,
            showGrid: state.showGrid,
            setGridSize: state.setGridSize,
            setShowGrid: state.setShowGrid,
        })
    );

    const handleGridSizeChange = (size: number) => {
        setGridSize(size);
        if (!showGrid) {
            setShowGrid(true);
        }
    };

    const handleToggleGrid = () => {
        setShowGrid(!showGrid);
    };

    const handleNoGrid = () => {
        setShowGrid(false);
    };

    return (
        <div className="grid-popover">
            <div className="grid-popover-section">
                <div className="grid-toggle-row">
                    <span className="grid-popover-label">Grid Visibility</span>
                    <button
                        className={`grid-visibility-button ${showGrid ? "active" : ""}`}
                        onClick={handleToggleGrid}
                    >
                        {showGrid ? "ON" : "OFF"}
                    </button>
                </div>
            </div>

            <div className="grid-popover-divider" />

            <div className="grid-popover-section">
                <span className="grid-popover-label">Grid Size</span>
                <div className="grid-button-group">
                    {[1, 2, 4, 8, 16, 32].map((size) => (
                        <button
                            key={size}
                            className={`grid-snap-button ${showGrid && gridSize === size ? "active" : ""
                                }`}
                            onClick={() => handleGridSizeChange(size)}
                        >
                            {size}px
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid-popover-divider" />

            <div className="grid-popover-section">
                <button
                    className={`grid-snap-button ${!showGrid ? "active" : ""}`}
                    onClick={handleNoGrid}
                    style={{ width: "100%" }}
                >
                    No Grid
                </button>
            </div>
        </div>
    );
};
