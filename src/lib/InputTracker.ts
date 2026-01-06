/**
 * InputTracker - テキスト入力の書き直し検知クラス
 * ユーザーの迷いや修正行動を追跡し、心理状態を推定
 * 
 * IME対応: 日本語入力時の変換中キーストロークを分離カウント
 */

export interface InputCorrectionData {
    input_correction_count: number;    // バックスペース・削除キーの合計回数
    backspace_count: number;           // バックスペースキーのみの回数
    delete_count: number;              // Deleteキーのみの回数
    major_deletion_count: number;      // 大幅削除（50%以上）の回数
    paste_count: number;               // ペースト操作の回数
    max_char_length: number;           // 途中での最大文字数
    final_char_length: number;         // 最終的な文字数
    max_char_delta: number;            // 最大文字数と最終文字数の差
    input_duration_ms: number;         // 入力フォーカスから送信までの時間
    average_typing_speed: number;      // 平均入力速度（文字/秒）
    hesitation_score: number;          // 迷いスコア（0-100、高いほど迷っている）
    first_value?: string;              // 最初に入力した値（削除前）
    final_value: string;               // 最終的な入力値
    ime_backspace_count: number;       // IME変換中のバックスペース回数（別カウント）
    ime_delete_count: number;          // IME変換中のDelete回数（別カウント）
}

export class InputTracker {
    private backspaceCount = 0;
    private deleteCount = 0;
    private majorDeletionCount = 0;
    private pasteCount = 0;
    private maxCharLength = 0;
    private currentLength = 0;
    private startTime = Date.now();
    private firstValue: string | null = null;
    private previousLength = 0;

    // IME対応
    private isComposing = false;
    private imeBackspaceCount = 0;
    private imeDeleteCount = 0;

    /**
     * IME変換開始イベント
     */
    onCompositionStart() {
        this.isComposing = true;
    }

    /**
     * IME変換終了イベント
     */
    onCompositionEnd() {
        this.isComposing = false;
    }

    /**
     * キーダウンイベント処理
     * @param e - キーボードイベント
     * @param currentValue - 現在の入力値
     */
    onKeyDown(e: KeyboardEvent, currentValue: string) {
        this.currentLength = currentValue.length;

        // バックスペース検知
        if (e.key === 'Backspace') {
            if (this.isComposing) {
                // 変換中のバックスペースは別カウント
                this.imeBackspaceCount++;
            } else {
                // 通常のバックスペースは迷いとしてカウント
                this.backspaceCount++;
            }
        }

        // Delete検知
        if (e.key === 'Delete') {
            if (this.isComposing) {
                this.imeDeleteCount++;
            } else {
                this.deleteCount++;
            }
        }

        // ペースト検知
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            this.pasteCount++;
        }
    }

    /**
     * 入力イベント処理
     * @param currentValue - 現在の入力値
     */
    onInput(currentValue: string) {
        // 初回入力を記録
        if (this.firstValue === null && currentValue.length > 0) {
            this.firstValue = currentValue;
        }

        // 最大文字数更新
        if (currentValue.length > this.maxCharLength) {
            this.maxCharLength = currentValue.length;
        }

        // 大幅削除検知（前回から50%以上減少）
        if (this.previousLength > 0 && currentValue.length < this.previousLength * 0.5) {
            this.majorDeletionCount++;
        }

        this.previousLength = currentValue.length;
    }

    /**
     * 最終レポート取得
     * @param finalValue - 最終的な入力値
     * @returns 入力修正データ
     */
    getReport(finalValue: string): InputCorrectionData {
        const duration = Date.now() - this.startTime;
        const totalChars = finalValue.length;

        // 迷いスコア計算（0-100）
        // 通常のバックスペース・削除のみをカウント（IME変換中は除外）
        const correctionScore = (this.backspaceCount + this.deleteCount) * 2;
        const deletionScore = this.majorDeletionCount * 10;
        const deltaScore = (this.maxCharLength - totalChars) * 0.5;
        const hesitationScore = Math.min(100, correctionScore + deletionScore + deltaScore);

        return {
            input_correction_count: this.backspaceCount + this.deleteCount,
            backspace_count: this.backspaceCount,
            delete_count: this.deleteCount,
            major_deletion_count: this.majorDeletionCount,
            paste_count: this.pasteCount,
            max_char_length: this.maxCharLength,
            final_char_length: totalChars,
            max_char_delta: this.maxCharLength - totalChars,
            input_duration_ms: duration,
            average_typing_speed: duration > 0 ? (totalChars / duration) * 1000 : 0,
            hesitation_score,
            first_value: this.firstValue || undefined,
            final_value: finalValue,
            ime_backspace_count: this.imeBackspaceCount,
            ime_delete_count: this.imeDeleteCount,
        };
    }

    /**
     * トラッカーをリセット（新しい入力フィールド用）
     */
    reset() {
        this.backspaceCount = 0;
        this.deleteCount = 0;
        this.majorDeletionCount = 0;
        this.pasteCount = 0;
        this.maxCharLength = 0;
        this.currentLength = 0;
        this.startTime = Date.now();
        this.firstValue = null;
        this.previousLength = 0;
        this.isComposing = false;
        this.imeBackspaceCount = 0;
        this.imeDeleteCount = 0;
    }
}
