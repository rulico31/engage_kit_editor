export interface InputAnalysisReport {
    metrics: {
        exploration: number;      // 探索スコア
        reversal: number;         // 転換スコア
        confidence: number;       // 確信スコア
        hesitation_score: number; // 総合迷い指数
    };
    raw: {
        correction_count: number;
        major_deletion_count: number;
        paste_count: number;
        max_char_length: number;
        final_char_length: number;
        max_char_delta: number;
        input_duration_ms: number;
        first_value?: string;
        original_value?: string;  // 修正前の最大長の値
        final_value: string;
    };
}

export class InputTracker {
    private correctionCount = 0; // Backspace / Delete (IME除く)
    private majorDeletionCount = 0;
    private pasteCount = 0;
    private maxCharLength = 0;
    private maxLengthValue = "";
    private currentLength = 0;
    private startTime = 0;
    private hasStarted = false;
    private firstValue: string | null = null;
    private previousLength = 0;

    // IME対応
    private isComposing = false;
    private lastInputValue = "";

    /**
     * IME変換開始イベント
     */
    onCompositionStart() {
        this.isComposing = true;
    }

    /**
     * IME変換終了イベント
     * @param data - 確定された文字列
     */
    onCompositionEnd(data: string) {
        this.isComposing = false;

        // IME確定時の文字列で各種値を更新
        // firstValueが未設定なら、最初の確定文字列を設定
        if (this.firstValue === null && data.length > 0) {
            this.firstValue = data;
        }

        // IME確定時に最大文字数を更新
        if (this.currentLength > this.maxCharLength) {
            this.maxCharLength = this.currentLength;
            this.maxLengthValue = this.lastInputValue;
        }

        // 入力開始時刻の記録（IME経由で最初に入力された場合）
        if (!this.hasStarted) {
            this.startTime = Date.now();
            this.hasStarted = true;
        }
    }

    /**
     * キーダウンイベント処理
     * @param e - キーボードイベント
     * @param currentValue - 現在の入力値
     */
    onKeyDown(e: KeyboardEvent, currentValue: string) {
        // 入力開始時刻の記録
        if (!this.hasStarted) {
            this.startTime = Date.now();
            this.hasStarted = true;
        }

        this.currentLength = currentValue.length;

        // IME変換中はカウントしない
        if (this.isComposing) return;

        // バックスペース・Delete検知
        if (e.key === 'Backspace' || e.key === 'Delete') {
            this.correctionCount++;
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
        // 入力開始時刻の記録（マウス操作などで入力された場合）
        if (!this.hasStarted) {
            this.startTime = Date.now();
            this.hasStarted = true;
        }

        this.lastInputValue = currentValue;

        if (!this.isComposing) {
            // 初回入力を記録
            if (this.firstValue === null && currentValue.length > 0) {
                this.firstValue = currentValue;
            }

            // 最大文字数更新
            if (currentValue.length > this.maxCharLength) {
                this.maxCharLength = currentValue.length;
                this.maxLengthValue = currentValue;
            }
        }

        // 大幅削除検知（前回から50%以上減少）
        if (this.previousLength > 0 && currentValue.length < this.previousLength * 0.5) {
            this.majorDeletionCount++;
        }

        this.previousLength = currentValue.length;
        this.currentLength = currentValue.length;
    }

    /**
     * レポート生成
     * @param finalValue - 最終的な入力値
     */
    getReport(finalValue: string): InputAnalysisReport {
        const endTime = Date.now();
        const durationMs = this.hasStarted ? (endTime - this.startTime) : 0;
        const durationSec = durationMs / 1000;
        const totalChars = finalValue.length;
        const lengthDelta = Math.max(0, this.maxCharLength - totalChars);

        // --- 心理指標計算 (The 3 Axes) ---

        // A. Exploration (探索): 修正の手数と時間の経過
        let exploration = (this.correctionCount * 1.5);
        if (durationSec > 10) {
            exploration += (durationSec - 10) * 0.5;
        }

        // B. Reversal (転換): 全削除等の大幅削除と、書いてから削った文字数
        let reversal = (this.majorDeletionCount * 30);
        reversal += Math.min(lengthDelta, 50);

        // C. Confidence (確信): ペーストや修正ゼロでの完走
        let confidence = 0;
        if (this.pasteCount > 0) confidence += 30;
        if (this.correctionCount === 0 && durationSec > 0) confidence += 20;

        // --- 総合指標: Hesitation Score ---
        // Hesitation = (Exploration * 0.4) + (Reversal * 0.6) - (Confidence * 0.5)
        let hesitationScore = (exploration * 0.4) + (reversal * 0.6) - (confidence * 0.5);

        // 正規化 (0-100)
        hesitationScore = Math.max(0, Math.min(100, Math.round(hesitationScore)));

        return {
            metrics: {
                exploration: Math.round(exploration * 10) / 10,
                reversal: Math.round(reversal * 10) / 10,
                confidence: Math.round(confidence * 10) / 10,
                hesitation_score: hesitationScore,
            },
            raw: {
                correction_count: this.correctionCount,
                major_deletion_count: this.majorDeletionCount,
                paste_count: this.pasteCount,
                max_char_length: this.maxCharLength,
                final_char_length: totalChars,
                max_char_delta: lengthDelta,
                input_duration_ms: durationMs,
                first_value: this.firstValue || undefined,
                original_value: this.maxLengthValue || undefined,
                final_value: finalValue,
            }
        };
    }

    /**
     * トラッカーをリセット
     */
    reset() {
        this.correctionCount = 0;
        this.majorDeletionCount = 0;
        this.pasteCount = 0;
        this.maxCharLength = 0;
        this.maxLengthValue = "";
        this.currentLength = 0;
        this.startTime = Date.now();
        this.hasStarted = false;
        this.firstValue = null;
        this.previousLength = 0;
        this.isComposing = false;
        this.lastInputValue = "";
    }
}
