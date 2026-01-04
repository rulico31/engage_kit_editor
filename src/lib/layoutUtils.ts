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
    // 単純な0.375倍だと小さくなりすぎるため、少し係数を上げる(0.45倍程度)か、最小値を確保する
    const heightRatio = SCALE_RATIO * 1.2;
    mobileH = Math.round(item.height * heightRatio);

    // 幅とX座標の計算
    if (isWide) {
        // 幅広アイテムは、スマホ幅の90%に設定して中央寄せ
        mobileW = Math.round(MOBILE_WIDTH * 0.9);
        mobileX = Math.round((MOBILE_WIDTH - mobileW) / 2);
    } else if (isCentered) {
        // 中央にあるアイテムは、幅をスケーリングしつつ中央寄せを維持
        // ただし、単純縮小だと小さすぎる場合は少し幅を持たせる
        const widthRatio = Math.max(SCALE_RATIO, 0.5); // 最低でも半分くらいのスケール感
        mobileW = Math.round(item.width * widthRatio);
        // 画面幅を超えないようにクランプ
        if (mobileW > MOBILE_WIDTH * 0.9) mobileW = Math.round(MOBILE_WIDTH * 0.9);

        mobileX = Math.round((MOBILE_WIDTH - mobileW) / 2);
    } else {
        // それ以外（左寄せ・右寄せ等の要素）は、相対位置を維持しつつ配置
        // X座標の比率計算
        const xRatio = item.x / (PC_WIDTH - item.width); // 配置可能な領域に対する割合

        // 幅のスケーリング（少し大きめに）
        const widthRatio = Math.max(SCALE_RATIO, 0.45);
        mobileW = Math.round(item.width * widthRatio);

        // 画面からはみ出さないように幅を制限
        if (mobileW > MOBILE_WIDTH * 0.95) mobileW = Math.round(MOBILE_WIDTH * 0.95);

        // X座標の配置（左端なら0、右端なら右寄せになるように補間）
        // layoutUtilsの単純比例だと中央に寄ってしまうことがあるため、
        // PCでの「左端からの距離」と「右端からの距離」の比率を維持するイメージ
        if (Number.isFinite(xRatio)) {
            // xRatioが計算可能な場合（width != PC_WIDTH）
            // maxMobileXは計算ロジックでは使用していないため削除
            // 単純な item.x * SCALE_RATIO だと左に寄りがちなので、全体幅に対する比率で配置
            const relativeX = (item.x / PC_WIDTH) * MOBILE_WIDTH;
            mobileX = Math.round(relativeX);
        } else {
            mobileX = Math.round(item.x * SCALE_RATIO);
        }
    }

    // 3. 最小サイズの確保 (タップしやすさ・視認性)
    const MIN_WIDTH = 40;
    const MIN_HEIGHT = 20; // テキストなどの場合もあるので控えめに
    const TOUCH_MIN_SIZE = 40; // ボタン等の場合

    if (mobileW < MIN_WIDTH) mobileW = MIN_WIDTH;

    // タイプによる補正（ボタンや画像は少し大きめに）
    if (['button', 'image', 'video'].includes(item.type || '')) {
        if (mobileH < TOUCH_MIN_SIZE) mobileH = TOUCH_MIN_SIZE;
    } else {
        if (mobileH < MIN_HEIGHT) mobileH = MIN_HEIGHT;
    }

    // Y座標: 単純スケーリング (スクロール前提なので位置関係が維持されればOK)
    // ただしヘッダー等の重なりを避けるため、極端に上すぎる場合は調整してもよいが、今回は単純変換
    mobileY = Math.round(item.y * SCALE_RATIO);

    // 最終的なクランプ処理 (画面からはみ出し防止)
    if (mobileX < 0) mobileX = 0;
    if (mobileX + mobileW > MOBILE_WIDTH) {
        mobileX = MOBILE_WIDTH - mobileW;
        if (mobileX < 0) { // それでもはみ出る（幅が画面より広い）場合
            mobileX = 0;
            mobileW = MOBILE_WIDTH;
        }
    }

    return {
        mobileX,
        mobileY,
        mobileWidth: mobileW,
        mobileHeight: mobileH
    };
};

/**
 * モバイル配置からPC配置を計算する（逆変換）
 * 基本的にはPC配置をマスターとする運用が推奨されるが、モバイルのみで追加した場合のフォールバック用
 */
export const calculateDesktopLayout = (item: { mobileX: number, mobileY: number, mobileWidth: number, mobileHeight: number }) => {
    const INV_RATIO = 1 / SCALE_RATIO;

    return {
        x: Math.round(item.mobileX * INV_RATIO),
        y: Math.round(item.mobileY * INV_RATIO),
        width: Math.round(item.mobileWidth * INV_RATIO),
        height: Math.round(item.mobileHeight * INV_RATIO)
    };
};

/**
 * アイテムオブジェクトを受け取り、モバイルプロパティが欠落している場合に補完した新しいオブジェクトを返す
 */
export const ensureMobileLayout = (item: PlacedItemType): PlacedItemType => {
    // 既にモバイルプロパティが完全に設定されていれば何もしない
    if (
        item.mobileX !== undefined &&
        item.mobileY !== undefined &&
        item.mobileWidth !== undefined &&
        item.mobileHeight !== undefined
    ) {
        return item;
    }

    // 自動計算
    const mobileLayout = calculateMobileLayout({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        type: item.type
    });

    return {
        ...item,
        ...mobileLayout
    };
};
