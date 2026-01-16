export interface InputAnalysisReport {
    metrics: {
        exploration: number;      // 探索スコア (試行錯誤の度合い)
        reversal: number;         // 転換スコア (意見の翻り)
        confidence: number;       // 確信スコア (迷いのなさ/資料参照)
        hesitation_score: number; // 総合迷い指数 (0-100)
    };
    raw: {
        correction_count: number;
        major_deletion_count: number;
        paste_count: number;          // ペースト回数 (New)
        input_duration_ms: number;
        final_char_length: number;
        focus_count: number;          // フォーカス回数
        micro_abandonment: boolean;   // 入力放棄フラグ (New)
        final_value: string;
    };
}

export class InputTracker {
    // Basic counters
    private correctionCount = 0; // Backspace / Delete
    private majorDeletionCount = 0;
    private pasteCount = 0;
    private focusCount = 0;

    // State tracking
    private startTime = 0;
    private hasTypingStarted = false;
    private isComposing = false; // IMEフラグ
    private previousLength = 0;
    private maxCharLength = 0;

    // For abandonment detection
    private hasMeaningfulInput = false;

    // References
    private element: HTMLInputElement | HTMLTextAreaElement | null = null;
    private listeners: { [key: string]: EventListener } = {};

    constructor() { }

    /**
     * 要素にイベントリスナーをアタッチ
     */
    attach(element: HTMLInputElement | HTMLTextAreaElement) {
        this.element = element;
        this.reset();

        // リスナー定義
        this.listeners = {
            compositionstart: () => {
                this.isComposing = true;
            },
            compositionend: (e: Event) => {
                this.isComposing = false;
                // IME確定時に入力長をチェック
                this.checkInput((e as InputEvent).data || (e.target as any).value || "");
            },
            keydown: (e: Event) => this.onKeyDown(e as KeyboardEvent),
            input: (e: Event) => {
                // IME中は無視 (compositionendで処理)
                if (!this.isComposing) {
                    this.checkInput((e.target as any).value || "");
                }
            },
            paste: () => {
                this.pasteCount++;
                this.startTimerIfNeeded();
                this.hasMeaningfulInput = true;
                console.log('[InputTracker] Paste detected (Confidence Signal)');
            },
            focus: () => {
                this.focusCount++;
                this.startTimerIfNeeded();
            },
            blur: () => {
                // Blur時に何も入力していなければ放棄の可能性
            }
        };

        // イベント登録
        Object.entries(this.listeners).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }

    /**
     * リスナー解除
     */
    detach() {
        if (!this.element) return;
        Object.entries(this.listeners).forEach(([event, handler]) => {
            this.element!.removeEventListener(event, handler);
        });
        this.element = null;
    }

    private startTimerIfNeeded() {
        if (!this.hasTypingStarted) {
            this.startTime = Date.now();
            this.hasTypingStarted = true;
        }
    }

    private onKeyDown(e: KeyboardEvent) {
        this.startTimerIfNeeded();

        // IME中はキー入力をカウントしない (ブラウザにより挙動が異なるが念のため)
        if (this.isComposing) return;

        // Backspace / Delete 検知
        if (e.key === 'Backspace' || e.key === 'Delete') {
            this.correctionCount++;
        }
    }

    private checkInput(currentValue: string) {
        this.startTimerIfNeeded();

        const currentLength = currentValue.length;

        // 初回の意味ある入力
        if (!this.hasMeaningfulInput && currentLength > 0) {
            this.hasMeaningfulInput = true;
        }

        // 大幅削除検知 (前回から30%以上かつ5文字以上減少)
        if (this.previousLength > 5 && currentLength < this.previousLength * 0.7) {
            this.majorDeletionCount++;
        }

        // 最大文字数更新
        if (currentLength > this.maxCharLength) {
            this.maxCharLength = currentLength;
        }

        this.previousLength = currentLength;
    }

    /**
     * レポート生成
     */
    getReport(finalValue: string): InputAnalysisReport {
        const endTime = Date.now();
        const durationMs = this.hasTypingStarted ? (endTime - this.startTime) : 0;
        const durationSec = durationMs / 1000;
        const totalChars = finalValue.length;

        // --- 修正されたB2B心理指標 ---

        // A. Exploration (探索): 修正の手数
        // IME入力では修正が発生しにくいため、係数を調整
        let exploration = this.correctionCount * 2.0;

        // 時間がかかりすぎている場合も探索とみなす (1文字あたり1秒以上など)
        if (totalChars > 0 && durationSec > totalChars * 1.5) {
            exploration += 10;
        }

        // B. Reversal (転換/迷い): 大幅削除
        let reversal = this.majorDeletionCount * 40;

        // 最終的に文字数が大幅に減った場合 (最大長からの減少)
        const lengthDelta = Math.max(0, this.maxCharLength - totalChars);
        if (lengthDelta > 10) {
            reversal += 20;
        }

        // C. Confidence (確信): ペースト、または一貫した入力
        let confidence = 0;
        if (this.pasteCount > 0) confidence += 40; // コピペは強力な確信シグナル (別資料あり)
        if (this.correctionCount === 0 && totalChars > 5) confidence += 30; // 修正なし

        // Micro-Abandonment (入力放棄)
        // フォーカスしたが、最終的にほぼ空 (空白のみなど)
        const isAbandoned = this.focusCount > 0 && totalChars < 2 && !this.hasMeaningfulInput;
        if (isAbandoned) {
            // 放棄はHesitationの極致
            reversal += 50;
        }

        // --- 総合指標: Hesitation Score ---
        // 0 (Confident) <-> 100 (Hesitant)
        let hesitationScore = 50 + (exploration * 0.5) + (reversal * 0.7) - (confidence * 0.8);
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
                input_duration_ms: durationMs,
                final_char_length: totalChars,
                focus_count: this.focusCount,
                micro_abandonment: isAbandoned,
                final_value: finalValue,
            }
        };
    }

    /**
     * リセット
     */
    reset() {
        this.correctionCount = 0;
        this.majorDeletionCount = 0;
        this.pasteCount = 0;
        this.focusCount = 0;
        this.startTime = Date.now();
        this.hasTypingStarted = false;
        this.isComposing = false;
        this.previousLength = 0;
        this.maxCharLength = 0;
        this.hasMeaningfulInput = false;
    }
}

