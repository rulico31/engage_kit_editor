import React, { useCallback } from "react";
import type { PlacedItemType } from "../../types";
import { useEditorSettingsStore } from "../../stores/useEditorSettingsStore";

interface ResizeHandlesProps {
    item: PlacedItemType;
    zoomLevel: number;
    onResizeStart: () => void;
    onResize: (updates: Partial<PlacedItemType>) => void;
    onResizeEnd: () => void;
}

type HandleType = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
    item,
    zoomLevel,
    onResizeStart,
    onResize,
    onResizeEnd,
}) => {
    const handleMouseDown = useCallback(
        (e: React.MouseEvent, type: HandleType) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart();

            const isMobileView = useEditorSettingsStore.getState().isMobileView;

            const startX = e.clientX;
            const startY = e.clientY;
            // モバイルビューの場合はmobileX/mobileYを、未設定ならx/yをフォールバック
            const startItemX = isMobileView && item.mobileX !== undefined ? item.mobileX : item.x;
            const startItemY = isMobileView && item.mobileY !== undefined ? item.mobileY : item.y;
            const startWidth = isMobileView && item.mobileWidth !== undefined ? item.mobileWidth : item.width;
            const startHeight = isMobileView && item.mobileHeight !== undefined ? item.mobileHeight : item.height;

            const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = (moveEvent.clientX - startX) / zoomLevel;
                const deltaY = (moveEvent.clientY - startY) / zoomLevel;

                let newX = startItemX;
                let newY = startItemY;
                let newWidth = startWidth;
                let newHeight = startHeight;

                // Calculate new dimensions and position based on handle type
                if (type.includes("e")) {
                    newWidth = Math.max(10, startWidth + deltaX);
                }
                if (type.includes("w")) {
                    const w = Math.max(10, startWidth - deltaX);
                    newX = startItemX + (startWidth - w);
                    newWidth = w;
                }
                if (type.includes("s")) {
                    newHeight = Math.max(10, startHeight + deltaY);
                }
                if (type.includes("n")) {
                    const h = Math.max(10, startHeight - deltaY);
                    newY = startItemY + (startHeight - h);
                    newHeight = h;
                }

                // Apply aspect ratio constraint if needed (e.g. for images)
                if (item.data.keepAspectRatio) {
                    // Simple aspect ratio implementation (prioritizing width change for corners)
                    const ratio = startWidth / startHeight;
                    if (type === 'se' || type === 'sw' || type === 'ne' || type === 'nw') {
                        if (type.includes('w')) {
                            // Width is master
                            newHeight = newWidth / ratio;
                            if (type.includes('n')) {
                                newY = startItemY + (startHeight - newHeight);
                            }
                        } else {
                            // Width is master
                            newHeight = newWidth / ratio;
                            if (type.includes('n')) {
                                newY = startItemY + (startHeight - newHeight);
                            }
                        }
                    }
                }

                // モバイルビューではmobileX/mobileY/mobileWidth/mobileHeightを更新
                if (isMobileView) {
                    onResize({
                        mobileX: newX,
                        mobileY: newY,
                        mobileWidth: newWidth,
                        mobileHeight: newHeight,
                    });
                } else {
                    onResize({
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight,
                    });
                }
            };

            const onMouseUp = () => {
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
                onResizeEnd();
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [item, zoomLevel, onResizeStart, onResize, onResizeEnd]
    );

    const handleStyle = (type: HandleType): React.CSSProperties => {
        const size = 8;
        const offset = -4; // Center the handle
        const style: React.CSSProperties = {
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: "white",
            border: "1px solid #007bff",
            borderRadius: "50%", // Circle handles
            zIndex: 10,
            pointerEvents: "auto",
        };

        switch (type) {
            case "n":
                return { ...style, top: `${offset}px`, left: "50%", marginLeft: `${offset}px`, cursor: "ns-resize" };
            case "s":
                return { ...style, bottom: `${offset}px`, left: "50%", marginLeft: `${offset}px`, cursor: "ns-resize" };
            case "e":
                return { ...style, right: `${offset}px`, top: "50%", marginTop: `${offset}px`, cursor: "ew-resize" };
            case "w":
                return { ...style, left: `${offset}px`, top: "50%", marginTop: `${offset}px`, cursor: "ew-resize" };
            case "ne":
                return { ...style, top: `${offset}px`, right: `${offset}px`, cursor: "nesw-resize" };
            case "nw":
                return { ...style, top: `${offset}px`, left: `${offset}px`, cursor: "nwse-resize" };
            case "se":
                return { ...style, bottom: `${offset}px`, right: `${offset}px`, cursor: "nwse-resize" };
            case "sw":
                return { ...style, bottom: `${offset}px`, left: `${offset}px`, cursor: "nesw-resize" };
        }
    };

    return (
        <>
            {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as HandleType[]).map((type) => (
                <div
                    key={type}
                    style={handleStyle(type)}
                    onMouseDown={(e) => handleMouseDown(e, type)}
                />
            ))}
        </>
    );
};
