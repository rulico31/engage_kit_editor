// src/hooks/useSwipeGesture.ts

import { useEffect, useRef } from 'react';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

/**
 * スワイプジェスチャーを検出するカスタムフック
 * @param handlers - スワイプ方向ごとのコールバック関数
 * @param threshold - スワイプと判定する最小距離（px）
 */
export function useSwipeGesture(
    handlers: SwipeHandlers,
    threshold: number = 50
) {
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchStartX.current - touchEndX;
            const diffY = touchStartY.current - touchEndY;

            // 横方向のスワイプ（絶対値がより大きい方向を判定）
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > threshold) {
                    if (diffX > 0) {
                        handlers.onSwipeLeft?.();
                    } else {
                        handlers.onSwipeRight?.();
                    }
                }
            }
            // 縦方向のスワイプ
            else {
                if (Math.abs(diffY) > threshold) {
                    if (diffY > 0) {
                        handlers.onSwipeUp?.();
                    } else {
                        handlers.onSwipeDown?.();
                    }
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handlers, threshold]);
}
