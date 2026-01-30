export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

export interface ValidationOptions {
    required?: boolean;
    inputType?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
    enableCountryCode?: boolean; // For phone numbers
}

/**
 * 入力値を検証します
 * @param value 入力された値
 * @param options バリデーションオプション
 * @returns エラーメッセージ（エラーがない場合は null）
 */
export const validateInput = (value: string | undefined | null, options: ValidationOptions): string | null => {
    const trimmed = value ? String(value).trim() : "";

    // 1. 必須チェック
    if (options.required && !trimmed) {
        return "必須項目です";
    }

    // 値がない場合はこれ以降の形式チェックは不要（必須でないなら空でOK）
    if (!trimmed) {
        return null;
    }

    // 2. 入力タイプ別チェック
    switch (options.inputType) {
        case 'email':
            // メールアドレスの形式チェック（ドメインチェック強化）
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmed)) {
                return "メールアドレスの形式が正しくありません";
            }
            // ドメイン部分の検証
            const domain = trimmed.split('@')[1];
            if (!domain || domain.length < 3 || !domain.includes('.')) {
                return "有効なドメイン名を含むメールアドレスを入力してください";
            }
            break;

        case 'tel':
            // 電話番号の検証（国コード対応）
            if (options.enableCountryCode) {
                // 国コード選択が有効な場合は数字のみ許可（ハイフンは任意）
                const telRegex = /^[0-9\-\s]{8,}$/;
                if (!telRegex.test(trimmed)) {
                    return "電話番号は8桁以上の数字で入力してください";
                }
            } else {
                // 国コード選択が無効な場合は通常の電話番号形式
                const telRegex = /^[0-9\-]{10,}$/;
                if (!telRegex.test(trimmed)) {
                    return "電話番号の形式が正しくありません";
                }
            }
            break;

        case 'number':
            if (isNaN(Number(trimmed))) {
                return "数値を入力してください";
            }
            break;
    }

    return null;
};
