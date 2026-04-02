import type { PlacedItemType } from '../types';

export const PC_WIDTH = 1000;
export const MOBILE_WIDTH = 375;
export const SCALE_RATIO = MOBILE_WIDTH / PC_WIDTH; // 0.375

/**
 * PC配置からモバイル配置を計算する
 * アスペクト比を維持して縮小し、座標もスケーリングする
 */
export const calculateMobileLayout = (item: { x: number, y: number, width: number, height: number, type?: string }) => {
    const itemCenterX = item.x + item.width / 2;
    const pcCenterX = PC_WIDTH / 2;

    // 1. 中央揃え判定: PCで中心が画面中央付近(±10%)にある場合
    const isCentered = Math.abs(itemCenterX - pcCenterX) < (PC_WIDTH * 0.1);

    // 2. 幅広判定: PCで画面幅の50%以上を占めている場合
    const isWide = item.width > (PC_WIDTH * 0.5);

    let mobileW = 0;
    let mobileH = 0;
    let mobileX = 0;
    let mobileY = 0;

    // 高さの計算（基本はアスペクト比維持だが、少し大きめに補正）
    const heightRatio = SCALE_RATIO * 1.2;
    mobileH = Math.round(item.height * heightRatio);

    // 幅とX座標の計算
    if (isWide) {
        mobileW = Math.round(MOBILE_WIDTH * 0.9);
        mobileX = Math.round((MOBILE_WIDTH - mobileW) / 2);
    } else if (isCentered) {
        const widthRatio = Math.max(SCALE_RATIO, 0.5);
        mobileW = Math.round(item.width * widthRatio);
        if (mobileW > MOBILE_WIDTH * 0.9) mobileW = Math.round(MOBILE_WIDTH * 0.9);
        mobileX = Math.round((MOBILE_WIDTH - mobileW) / 2);
    } else {
        const xRatio = item.x / (PC_WIDTH - item.width);
        const widthRatio = Math.max(SCALE_RATIO, 0.45);
        mobileW = Math.round(item.width * widthRatio);
        if (mobileW > MOBILE_WIDTH * 0.95) mobileW = Math.round(MOBILE_WIDTH * 0.95);

        if (Number.isFinite(xRatio)) {
            const relativeX = (item.x / PC_WIDTH) * MOBILE_WIDTH;
            mobileX = Math.round(relativeX);
        } else {
            mobileX = Math.round(item.x * SCALE_RATIO);
        }
    }

    const MIN_WIDTH = 40;
    if (mobileW < MIN_WIDTH) mobileW = MIN_WIDTH;

    const isActionable = ['button', 'input', 'textarea', 'dropdown'].includes(item.type || '');
    if (isActionable) {
        mobileW = Math.round(MOBILE_WIDTH * 0.9);
        mobileX = Math.round((MOBILE_WIDTH - mobileW) / 2);
        if (mobileH < 44) mobileH = 44;
    }

    if (item.type === 'image' || item.type === 'video') {
        const pcRatio = item.width / item.height;
        if (pcRatio > 0 && !Number.isNaN(pcRatio)) {
            mobileH = Math.round(mobileW / pcRatio);
        }
    }

    mobileY = Math.round(item.y * SCALE_RATIO);

    if (mobileX < 0) mobileX = 0;
    if (mobileX + mobileW > MOBILE_WIDTH) {
        mobileX = Math.round((MOBILE_WIDTH - mobileW) / 2);
    }

    return {
        mobileX,
        mobileY,
        mobileWidth: mobileW,
        mobileHeight: mobileH
    };
};

export const calculateDesktopLayout = (item: { mobileX: number, mobileY: number, mobileWidth: number, mobileHeight: number }) => {
    const INV_RATIO = 1 / SCALE_RATIO;
    return {
        x: Math.round(item.mobileX * INV_RATIO),
        y: Math.round(item.mobileY * INV_RATIO),
        width: Math.round(item.mobileWidth * INV_RATIO),
        height: Math.round(item.mobileHeight * INV_RATIO)
    };
};

export const ensureMobileLayout = (item: PlacedItemType): PlacedItemType => {
    if (
        item.mobileX !== undefined &&
        item.mobileY !== undefined &&
        item.mobileWidth !== undefined &&
        item.mobileHeight !== undefined
    ) {
        return item;
    }

    const mobileLayout = calculateMobileLayout({
        x: item.x ?? 0,
        y: item.y ?? 0,
        width: item.width ?? 100,
        height: item.height ?? 50,
        type: item.type
    });

    return {
        ...item,
        ...mobileLayout
    };
};

/**
 * PC版の配置を元に、スマホ用に自動で「縦積み（および水平パッキング）」するロジック v3
 * 
 * 概要:
 *   - PC版の Y 座標順にソート。
 *   - 「欲張りなパッキング」により、可能な限り要素を横に並べる（高さを節約）。
 *   - 「動的圧縮」時に「絶対重なり防止（押し出し）」を行い、要素の消失を防ぐ。
 */
export const calculateAutoMobileStack = (items: PlacedItemType[]): PlacedItemType[] => {
    if (items.length === 0) return items;

    const STACK_MARGIN = 12; // 基本の縦余白
    const HORIZONTAL_GAP = 8; // 横並び時の隙間
    const MOBILE_WIDTH = 375;
    const CANVAS_SIDE_MARGIN = 20;
    const AVAILABLE_WIDTH = MOBILE_WIDTH - (CANVAS_SIDE_MARGIN * 2);
    const TARGET_VIEW_HEIGHT = 667;

    const sortedItems = [...items].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    const resultMap = new Map<string, PlacedItemType>();
    let currentY = STACK_MARGIN;

    let i = 0;
    while (i < sortedItems.length) {
        const rowItems: PlacedItemType[] = [];
        let head = sortedItems[i];
        rowItems.push(head);
        
        const pcW = head.width ?? 100;
        const isBlock = pcW > 300 || head.type === 'image' || head.type === 'video';

        if (!isBlock) {
            let j = i + 1;
            while (j < sortedItems.length) {
                const next = sortedItems[j];
                const nextPcW = next.width ?? 100;
                const isNextNearY = Math.abs((next.y ?? 0) - (head.y ?? 0)) < 60;
                const isNextSmall = nextPcW < 250;

                if (isNextNearY && isNextSmall && (rowItems.length < 3)) {
                    rowItems.push(next);
                    j++;
                } else {
                    break;
                }
            }
        }

        const count = rowItems.length;
        let maxRowHeight = 0;

        if (count > 1) {
            const itemW = Math.floor((AVAILABLE_WIDTH - (HORIZONTAL_GAP * (count - 1))) / count);
            rowItems.forEach((item, idx) => {
                const pcW = item.width ?? 100;
                const pcH = item.height ?? 50;
                const r = pcW / pcH;
                const baseFS = (item.data?.fontSize || 15);
                const mFS = Math.max(12, Math.round(baseFS * 0.7));
                const minH = Math.max(44, Math.round(mFS * 1.5));
                const mX = CANVAS_SIDE_MARGIN + (idx * (itemW + HORIZONTAL_GAP));
                
                let mH = (item.type === 'image' || item.type === 'video')
                    ? Math.max(minH, Math.round(itemW / r))
                    : minH;

                resultMap.set(item.id, {
                    ...item,
                    mobileX: mX,
                    mobileY: currentY,
                    mobileWidth: itemW,
                    mobileHeight: mH,
                    mobileFontSize: mFS,
                });
                maxRowHeight = Math.max(maxRowHeight, mH);
            });
            i += count;
        } else {
            const item = rowItems[0];
            const pcW = item.width ?? 100;
            const pcH = item.height ?? 50;
            const r = pcW / pcH;
            const baseFS = (item.data?.fontSize || 15);
            const mFS = Math.max(12, Math.round(baseFS * 0.7));
            const minH = (item.type === 'text' || item.type === 'button') 
                ? Math.max(40, Math.round(mFS * 1.6)) 
                : 20;

            let mW = AVAILABLE_WIDTH;
            if (pcW < 200 && (item.type === 'image' || item.type === 'video')) {
                mW = Math.min(AVAILABLE_WIDTH, Math.round(pcW * 0.9));
            }
            const mH = Math.max(minH, Math.round(mW / r));
            const mX = Math.round((MOBILE_WIDTH - mW) / 2);

            resultMap.set(item.id, {
                ...item,
                mobileX: mX,
                mobileY: currentY,
                mobileWidth: mW,
                mobileHeight: mH,
                mobileFontSize: mFS,
            });
            maxRowHeight = mH;
            i++;
        }
        currentY += maxRowHeight + STACK_MARGIN;
    }

    const finalTotalHeight = currentY;
    if (finalTotalHeight > TARGET_VIEW_HEIGHT) {
        const compressionRatio = Math.max(0.65, TARGET_VIEW_HEIGHT / finalTotalHeight);
        let safeY = STACK_MARGIN;
        const sortedResultKeys = Array.from(resultMap.keys())
            .sort((a, b) => (resultMap.get(a)?.mobileY ?? 0) - (resultMap.get(b)?.mobileY ?? 0));

        let groupBuffer: string[] = [];
        let lastOrigY = -1;

        const flushGroup = () => {
             if (groupBuffer.length === 0) return;
             let maxH = 0;
             groupBuffer.forEach(id => {
                 const m = resultMap.get(id)!;
                 const newH = Math.round((m.mobileHeight ?? 0) * (compressionRatio + 0.1));
                 const newFS = Math.max(10, Math.round((m.mobileFontSize ?? 15) * (compressionRatio + 0.05)));
                 resultMap.set(id, {
                     ...m,
                     mobileY: safeY,
                     mobileHeight: newH,
                     mobileFontSize: newFS,
                 });
                 maxH = Math.max(maxH, newH);
             });
             safeY += maxH + Math.round(STACK_MARGIN * compressionRatio);
             groupBuffer = [];
        };

        sortedResultKeys.forEach(id => {
            const m = resultMap.get(id)!;
            if (lastOrigY !== -1 && m.mobileY !== lastOrigY) {
                flushGroup();
            }
            groupBuffer.push(id);
            lastOrigY = m.mobileY ?? 0;
        });
        flushGroup();
    }

    return items.map(item => resultMap.get(item.id) ?? item);
};
