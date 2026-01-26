export class InputTracker {
    private correctionCount: number = 0;
    private isComposing: boolean = false;

    // コンストラクタ: PreviewItemでの使用に合わせて引数なし
    constructor() { }

    onCompositionStart() {
        this.isComposing = true;
    }

    onCompositionEnd() {
        this.isComposing = false;
    }

    onInput(value: string) {
        // 将来的に入力速度などを計測する場合はここにロジック追加
    }

    onKeyDown(e: KeyboardEvent, value: string) {
        // if (this.isComposing) return; // IME入力中も含めて削除操作としてカウントする

        // 削除操作（Backspace/Delete）をカウント＝推敲・書き直し
        if (e.key === 'Backspace' || e.key === 'Delete') {
            this.correctionCount++;
        }
    }

    // レポート取得: Blur時などにコンポーネントから呼ばれる
    getReport(finalValue: string) {
        return {
            input_correction_count: this.correctionCount,
            timestamp: Date.now()
        };
    }
}
