/**
 * UTMパラメータ抽出ユーティリティ
 * URLクエリパラメータからUTMデータを取得し、セッション情報として保存
 */

export interface UTMData {
    utm_source?: string;      // 流入元（例: google, facebook, instagram）
    utm_medium?: string;      // メディアタイプ（例: cpc, email, social）
    utm_campaign?: string;    // キャンペーン名（例: summer_sale_2024）
    utm_term?: string;        // 検索キーワード（例: 診断ツール）
    utm_content?: string;     // 広告バリエーション（例: banner_a）
    captured_at: string;      // UTM取得日時（ISO 8601形式）
}

/**
 * URLからUTMパラメータを抽出
 * @param search - window.location.search または URLSearchParams互換の文字列
 * @returns UTMデータオブジェクト、またはパラメータがない場合はnull
 */
export const extractUTMParams = (search: string): UTMData | null => {
    const params = new URLSearchParams(search);

    const utmData: Partial<UTMData> = {
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        utm_term: params.get('utm_term') || undefined,
        utm_content: params.get('utm_content') || undefined,
    };

    // 少なくとも1つのUTMパラメータが存在する場合のみ返す
    const hasAnyUTM = Object.values(utmData).some(value => value !== undefined);

    if (!hasAnyUTM) {
        return null;
    }

    return {
        ...utmData,
        captured_at: new Date().toISOString(),
    } as UTMData;
};

/**
 * sessionStorageからUTMデータを取得
 * @returns 保存されているUTMデータ、またはnull
 */
export const getStoredUTMData = (): UTMData | null => {
    try {
        const stored = sessionStorage.getItem('utm_data');
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to parse stored UTM data:', error);
        return null;
    }
};

/**
 * UTMデータをsessionStorageに保存
 * @param utmData - 保存するUTMデータ
 */
export const storeUTMData = (utmData: UTMData): void => {
    try {
        sessionStorage.setItem('utm_data', JSON.stringify(utmData));
    } catch (error) {
        console.error('Failed to store UTM data:', error);
    }
};

/**
 * 初回アクセス時にUTMパラメータを取得・保存
 * 既存のUTMデータがある場合は上書きしない（最初のタッチポイントを保持）
 */
export const initializeUTMTracking = (): UTMData | null => {
    // 既存のUTMデータがあればそれを優先（ファーストタッチアトリビューション）
    const existingUTM = getStoredUTMData();
    if (existingUTM) {
        return existingUTM;
    }

    // 新規アクセスの場合、URLからUTMを抽出
    const utmData = extractUTMParams(window.location.search);
    if (utmData) {
        storeUTMData(utmData);
    }

    return utmData;
};
