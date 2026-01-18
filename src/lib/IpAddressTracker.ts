/**
 * IPアドレス取得ユーティリティ
 * 外部APIを使用してクライアントのIPアドレスを取得します
 */

let cachedIpAddress: string | null = null;

/**
 * クライアントのIPアドレスを取得
 * キャッシュされた値があればそれを返し、なければAPIから取得
 */
export const getClientIpAddress = async (): Promise<string | null> => {
    // キャッシュがあればそれを返す
    if (cachedIpAddress) {
        return cachedIpAddress;
    }

    try {
        // ipify APIを使用（無料、高速、信頼性が高い）
        const response = await fetch('https://api.ipify.org?format=json', {
            method: 'GET',
            // タイムアウト設定（5秒）
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        cachedIpAddress = data.ip || null;

        if (import.meta.env.DEV) {
            console.log('🌐 IP Address fetched:', cachedIpAddress);
        }

        return cachedIpAddress;
    } catch (error) {
        console.warn('Failed to fetch IP address:', error);
        // エラーの場合はnullを返す（リード送信を失敗させない）
        return null;
    }
};

/**
 * セッション開始時にIPアドレスを事前取得
 * ページ読み込み時に呼び出すことで、リード送信時の遅延を防ぐ
 */
export const prefetchIpAddress = () => {
    getClientIpAddress().catch(() => {
        // エラーは無視（次回の取得時に再試行される）
    });
};
