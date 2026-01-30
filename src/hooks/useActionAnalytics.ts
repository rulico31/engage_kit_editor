import { useEffect, useRef } from "react";
import { logAnalyticsEvent } from "../lib/analytics";

/**
 * レイジクリック、ヘジテーション、離脱、インタラクション追跡を行うフック
 * @param projectId プロジェクトID
 * @param isEnabled 有効化フラグ (Previewモード時のみtrueにする等)
 * @param pageId 現在のページID (Optional)
 * @param pageName 現在のページ名 (Optional)
 */
export const useActionAnalytics = (projectId: string | null, isEnabled: boolean, pageId?: string | null, pageName?: string | null) => {
    const lastInteractionRef = useRef<string | null>(null);
    const lastInteractionTypeRef = useRef<string | null>(null);
    const lastInteractionNameRef = useRef<string | null>(null); // Added

    const interactionTimerRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!projectId || !isEnabled) return;

        // 1. インタラクション追跡 (真の離脱点検出用)
        const handleInteraction = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement;
            // data-node-id 属性を持つ要素を探す (PlacedItemコンポーネントが持っている前提)
            const nodeElement = target.closest('[data-node-id]');
            if (nodeElement) {
                const nodeId = nodeElement.getAttribute('data-node-id');
                const nodeType = nodeElement.getAttribute('data-node-type');
                const nodeName = nodeElement.getAttribute('data-node-name'); // Added

                if (nodeId) {
                    lastInteractionRef.current = nodeId;
                    lastInteractionTypeRef.current = nodeType || 'unknown';
                    lastInteractionNameRef.current = nodeName || 'unknown'; // Added
                }
            }
        };

        // 2. アイドル(熟考)検知
        let idleTimer: any;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                // session_idを含めることでダッシュボードでの集計が可能になる
                const sessionId = sessionStorage.getItem('engage_session_id');
                logAnalyticsEvent('idle_hesitation', {
                    duration: 20,
                    session_id: sessionId,
                    page_id: pageId,
                    page_name: pageName
                }, projectId);
                console.log('[Analytics] idle_hesitation triggered after 20s inactivity');
            }, 20000);
        };

        // 初期化時にタイマーを開始 (何もしない場合も考慮)
        resetIdleTimer();

        // 3. レイジクリック検知
        let clickTimestamps: number[] = [];
        const handleRageClick = (e: MouseEvent | TouchEvent) => {
            const now = Date.now();
            // 1秒以内のクリックだけを残す
            clickTimestamps = clickTimestamps.filter(t => now - t < 1000);
            clickTimestamps.push(now);

            if (clickTimestamps.length >= 3) {
                // クリックされたターゲット要素の特定
                const target = e.target as HTMLElement;
                const nodeElement = target.closest('[data-node-id]');
                let targetNodeId = null;
                let targetNodeType = null;
                let targetNodeName = null; // Added

                if (nodeElement) {
                    targetNodeId = nodeElement.getAttribute('data-node-id');
                    targetNodeName = nodeElement.getAttribute('data-node-name'); // Added
                    if (targetNodeId) {
                        // IDからタイプを簡易推定 (例: image-123 -> image)
                        targetNodeType = nodeElement.getAttribute('data-node-type');
                        if (!targetNodeType) {
                            const parts = targetNodeId.split('-');
                            if (parts.length > 0) {
                                targetNodeType = parts[0];
                            }
                        }
                    }
                }

                console.log(`⚡ Rage Click Detected! Target: ${targetNodeId || 'Empty Space'}`);

                logAnalyticsEvent('rage_click', {
                    timestamp: now,
                    target_node_id: targetNodeId,
                    target_node_type: targetNodeType,
                    item_name: targetNodeName, // Added
                    page_id: pageId,
                    page_name: pageName
                }, projectId);

                clickTimestamps = []; // リセット
            }
        };

        // 3.5. ペースト検知
        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();

            // 入力フィールドへのペーストのみ検知
            if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
                const nodeElement = target.closest('[data-node-id]');
                const nodeId = nodeElement?.getAttribute('data-node-id') || null;
                const nodeName = nodeElement?.getAttribute('data-node-name') || null; // Added

                const pastedText = e.clipboardData?.getData('text') || '';
                const textLength = pastedText.length;

                console.log(`📋 Paste Detected! Target: ${nodeId || 'Unknown'}, Length: ${textLength}`);

                logAnalyticsEvent('input_paste', {
                    timestamp: Date.now(),
                    target_node_id: nodeId,
                    text_length: textLength,
                    session_id: sessionStorage.getItem('engage_session_id'),
                    item_name: nodeName, // Added
                    page_id: pageId,
                    page_name: pageName
                }, projectId);
            }
        };

        // 4. 離脱時ログ送信 (Beacon API)
        const sendExitLog = () => {
            // Beaconなどはページコンテキストが必要ならここで追加するが、
            // ページ移動時に unmount されるので、その時点の pageId が使われるはず。
            // ただしSPA遷移などでコンポーネントが生き残る場合は注意。
            // ここでは依存配列に pageId が入るので再生成される。

            const analyticsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-beacon`;
            const payload = {
                event_type: 'exit_context',
                project_id: projectId,
                session_id: sessionStorage.getItem('engage_session_id'),
                metadata: {
                    last_interacted_node: lastInteractionRef.current,
                    last_interacted_node_type: lastInteractionTypeRef.current,
                    last_interacted_node_name: lastInteractionNameRef.current, // Added
                    page_id: pageId,
                    page_name: pageName,
                    timestamp: Date.now()
                }
            };

            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            let sent = false;
            if (navigator.sendBeacon) {
                sent = navigator.sendBeacon(analyticsUrl, blob);
            }

            if (!sent) {
                console.log("Beacon not sent (or API not available). Payload:", payload);
            } else {
                // Beacon成功時は特にログを出さない（頻繁な終了ログを防ぐ）か、開発時は出して確認
                console.log("Beacon scheduled for exit.");
            }
        };

        // 5. 思考時間(Thinking Time)計測
        // ★ NOTE: 削除理由 - この機能は usePreviewStore.handleItemEvent で同等の計測を行っており、
        //   ここで重複送信すると「ページロードからの時間」と「前回操作からの時間」が混在してしまう。
        //   usePreviewStore側はinitPreview()でタイマーリセットされるため正確な計測が可能。
        //   ViewerHostではuseActionAnalyticsを使うが、interaction計測はViewerHost側で行う。
        /*
        const handleThinkingTime = (e: MouseEvent | TouchEvent) => {
            // クリック時のみ計測 (タッチはtouchstartでなくclickで統一するか、重複排除が必要)
            // ここではclickのみを対象とする
            if (e.type !== 'click') return;

            const now = Date.now();
            const durationMs = now - interactionTimerRef.current;
            interactionTimerRef.current = now; // タイマーリセット

            // 極端な値を除外
            if (durationMs < 100 || durationMs > 1800000) return; // 100ms未満(ノイズ) or 30分以上(放置)

            // パターン判定
            let thinkingPattern: 'intuitive' | 'normal' | 'hesitation' | 'noise' = 'normal';
            if (durationMs < 2500) thinkingPattern = 'intuitive';
            else if (durationMs < 8000) thinkingPattern = 'normal';
            else thinkingPattern = 'hesitation';

            // ターゲット情報の取得
            const target = e.target as HTMLElement;
            const nodeElement = target.closest('[data-node-id]');
            const nodeId = nodeElement?.getAttribute('data-node-id') || null;

            // ノード名(近似)
            let nodeName = nodeId || 'unknown';
            if (nodeElement && nodeElement.textContent) {
                nodeName = nodeElement.textContent.slice(0, 20);
            }

            logAnalyticsEvent('interaction', {
                nodeId: nodeId,
                nodeType: 'click_interaction',
                metadata: {
                    event_name: 'click',
                    duration_ms: durationMs,
                    thinking_pattern: thinkingPattern,
                    node_name: nodeName
                }
            }, projectId);
        };
        */

        // イベントリスナー登録 (Capture phase)
        window.addEventListener('mousemove', handleInteraction, { capture: true });
        window.addEventListener('touchstart', handleInteraction, { capture: true });

        window.addEventListener('mousemove', resetIdleTimer, { capture: true });
        window.addEventListener('touchstart', resetIdleTimer, { capture: true });
        window.addEventListener('scroll', resetIdleTimer, { capture: true });
        window.addEventListener('click', resetIdleTimer, { capture: true });
        window.addEventListener('keydown', resetIdleTimer, { capture: true }); // キーボード入力を検知
        window.addEventListener('input', resetIdleTimer, { capture: true }); // テキスト入力を検知

        window.addEventListener('click', handleRageClick, { capture: true });
        window.addEventListener('touchstart', handleRageClick, { capture: true });

        // Thinking Time Listener (Disabled - see note above)
        // window.addEventListener('click', handleThinkingTime, { capture: true });

        // Paste Listener
        window.addEventListener('paste', handlePaste as EventListener, { capture: true });

        window.addEventListener('beforeunload', sendExitLog);

        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') sendExitLog();
        }
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearTimeout(idleTimer);
            window.removeEventListener('mousemove', handleInteraction, { capture: true });
            window.removeEventListener('touchstart', handleInteraction, { capture: true });
            window.removeEventListener('mousemove', resetIdleTimer, { capture: true });
            window.removeEventListener('touchstart', resetIdleTimer, { capture: true });
            window.removeEventListener('scroll', resetIdleTimer, { capture: true });
            window.removeEventListener('click', resetIdleTimer, { capture: true });
            window.removeEventListener('keydown', resetIdleTimer, { capture: true });
            window.removeEventListener('input', resetIdleTimer, { capture: true });
            window.removeEventListener('click', handleRageClick, { capture: true });
            window.removeEventListener('touchstart', handleRageClick, { capture: true });
            // window.removeEventListener('click', handleThinkingTime, { capture: true });
            window.removeEventListener('paste', handlePaste as EventListener, { capture: true });
            window.removeEventListener('beforeunload', sendExitLog);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [projectId, isEnabled, pageId, pageName]);
};
