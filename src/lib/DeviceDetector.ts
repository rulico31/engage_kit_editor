import { UAParser } from 'ua-parser-js';

/**
 * デバイス情報の詳細データ構造
 */
export interface DeviceInfo {
    device_type: 'mobile' | 'tablet' | 'desktop';  // デバイスタイプ
    os_name: string;                                // OS名（例: iOS, Android, Windows）
    os_version: string;                             // OSバージョン（例: 16.4, 13, 11）
    browser_name: string;                           // ブラウザ名（例: Chrome, Safari, Firefox）
    browser_version: string;                        // ブラウザバージョン（例: 120.0.6099）
    screen_width: number;                           // 画面幅（例: 375）
    screen_height: number;                          // 画面高さ（例: 812）
    pixel_ratio: number;                            // デバイスピクセル比（例: 3）
    user_agent: string;                             // 生のUserAgent文字列（バックアップ用）
    viewport_width: number;                         // ビューポート幅
    viewport_height: number;                        // ビューポート高さ
    language: string;                               // ブラウザ言語設定（例: ja-JP）
    timezone: string;                               // タイムゾーン（例: Asia/Tokyo）
}

/**
 * デバイス情報検出クラス
 * User-Agentとブラウザ情報を解析してデバイス詳細を取得
 */
class DeviceDetector {
    private cachedDeviceInfo: DeviceInfo | null = null;

    /**
     * デバイス情報を取得（キャッシュ機構付き）
     * @returns デバイス情報オブジェクト
     */
    getDeviceInfo(): DeviceInfo {
        // キャッシュがあればそれを返す（パフォーマンス最適化）
        if (this.cachedDeviceInfo) {
            return this.cachedDeviceInfo;
        }

        const parser = new UAParser();
        const result = parser.getResult();

        // デバイスタイプ判定
        const deviceType = this.detectDeviceType(result);

        // デバイス情報オブジェクト作成
        this.cachedDeviceInfo = {
            device_type: deviceType,
            os_name: result.os.name || 'Unknown',
            os_version: result.os.version || 'Unknown',
            browser_name: result.browser.name || 'Unknown',
            browser_version: result.browser.version || 'Unknown',
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            pixel_ratio: window.devicePixelRatio || 1,
            user_agent: navigator.userAgent,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            language: navigator.language,
            timezone: this.getTimezone(),
        };

        return this.cachedDeviceInfo;
    }

    /**
     * デバイスタイプを判定
     * @param result - UAParser解析結果
     * @returns デバイスタイプ
     */
    private detectDeviceType(result: UAParser.IResult): 'mobile' | 'tablet' | 'desktop' {
        // 1. ライブラリが提供するデバイスタイプを優先
        const type = result.device.type;
        if (type === 'mobile') return 'mobile';
        if (type === 'tablet') return 'tablet';

        // 2. iPadOS対応（Mac OSとして認識される場合がある）
        const isMac = result.os.name === 'Mac OS';
        const isIOS = result.os.name === 'iOS';
        const hasTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

        // iPadOSのSafariはデスクトップ用サイト表示時にMac OSとして振る舞うため、タッチポイントで救い上げる
        if ((isMac || isIOS) && hasTouch) {
            // 確実にiPadが含まれているか、単にタッチがあるMac(iPad Pro等)をタブレットとする
            if (/iPad/i.test(navigator.userAgent)) return 'tablet';
            if (/iPhone|iPod/i.test(navigator.userAgent)) return 'mobile';
            // それ以外（iPad Proの最新版など、UAで判別不能な場合でもタッチがあればタブレット）
            return 'tablet';
        }

        // 3. Android対応の補正
        if (result.os.name === 'Android') {
            // モバイルブラウザ特有の文字列が含まれていればスマホ、なければタブレット
            return /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'tablet';
        }

        // 4. 追加補正：User-AgentでDesktop判定されても、画面幅とタッチ情報からタブレットを救済
        const windowWidth = window.innerWidth || 0;
        const hasAnyTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        
        // 481px〜1200pxかつタッチ操作があれば、実質タブレットとして扱う
        if (windowWidth >= 481 && windowWidth <= 1200 && hasAnyTouch) {
            return 'tablet';
        }

        // デフォルト
        return 'desktop';
    }

    /**
     * タイムゾーンを取得
     * @returns タイムゾーン文字列
     */
    private getTimezone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
            console.warn('Failed to get timezone:', error);
            return 'Unknown';
        }
    }

    /**
     * sessionStorageからデバイス情報を取得
     * @returns 保存されているデバイス情報、またはnull
     */
    getStoredDeviceInfo(): DeviceInfo | null {
        try {
            const stored = sessionStorage.getItem('device_info');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Failed to parse stored device info:', error);
            return null;
        }
    }

    /**
     * デバイス情報をsessionStorageに保存
     * @param deviceInfo - 保存するデバイス情報
     */
    storeDeviceInfo(deviceInfo: DeviceInfo): void {
        try {
            sessionStorage.setItem('device_info', JSON.stringify(deviceInfo));
        } catch (error) {
            console.error('Failed to store device info:', error);
        }
    }

    /**
     * 初回アクセス時にデバイス情報を取得・保存
     * 既存のデバイス情報がある場合はそれを返す
     */
    initializeDeviceTracking(): DeviceInfo {
        // 既存のデバイス情報があればそれを優先
        const existingInfo = this.getStoredDeviceInfo();
        if (existingInfo) {
            this.cachedDeviceInfo = existingInfo;
            return existingInfo;
        }

        // 新規の場合、デバイス情報を取得して保存
        const deviceInfo = this.getDeviceInfo();
        this.storeDeviceInfo(deviceInfo);

        return deviceInfo;
    }
}

// シングルトンインスタンス
export const deviceDetector = new DeviceDetector();

// 便利な関数エクスポート
export const getDeviceInfo = () => deviceDetector.getDeviceInfo();
export const initializeDeviceTracking = () => deviceDetector.initializeDeviceTracking();
export const getStoredDeviceInfo = () => deviceDetector.getStoredDeviceInfo();
