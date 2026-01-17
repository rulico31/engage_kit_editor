import { useEffect, useRef } from "react";
import { logAnalyticsEvent } from "../lib/analytics";

/**
 * レイジクリック、ヘジテーション、離脱、インタラクション追跡を行うフック
 * @param projectId プロジェクトID
 * @param isEnabled 有効化フラグ (Previewモード時のみtrueにする等)
 */
export const useActionAnalytics = (projectId: string | null, isEnabled: boolean) => {
    const lastInteractionRef = useRef<string | null>(null);

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
                if (nodeId) {
                    lastInteractionRef.current = nodeId;
                }
            }
        };

        // 2. アイドル(熟考)検知
        let idleTimer: any;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                logAnalyticsEvent('idle_hesitation', { duration: 5 }, projectId);
            }, 5000);
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

                if (nodeElement) {
                    targetNodeId = nodeElement.getAttribute('data-node-id');
                    if (targetNodeId) {
                        // IDからタイプを簡易推定 (例: image-123 -> image)
                        const parts = targetNodeId.split('-');
                        if (parts.length > 0) {
                            targetNodeType = parts[0];
                        }
                    }
                }

                console.log(`⚡ Rage Click Detected! Target: ${targetNodeId || 'Empty Space'}`);

                logAnalyticsEvent('rage_click', {
                    timestamp: now,
                    target_node_id: targetNodeId,
                    target_node_type: targetNodeType
                }, projectId);

                clickTimestamps = []; // リセット
            }
        };

        // 4. 離脱時ログ送信 (Beacon API)
        const sendExitLog = () => {
            const analyticsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-beacon`;
            const payload = {
                event_type: 'exit_context',
                project_id: projectId,
                session_id: sessionStorage.getItem('engage_session_id'),
                metadata: {
                    last_interacted_node: lastInteractionRef.current,
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

        // イベントリスナー登録 (Capture phase)
        window.addEventListener('mousemove', handleInteraction, { capture: true });
        window.addEventListener('touchstart', handleInteraction, { capture: true });

        window.addEventListener('mousemove', resetIdleTimer, { capture: true });
        window.addEventListener('touchstart', resetIdleTimer, { capture: true });
        window.addEventListener('scroll', resetIdleTimer, { capture: true });
        window.addEventListener('click', resetIdleTimer, { capture: true });

        window.addEventListener('click', handleRageClick, { capture: true });
        window.addEventListener('touchstart', handleRageClick, { capture: true });

        // Thinking Time Listener
        window.addEventListener('click', handleThinkingTime, { capture: true });

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
            window.removeEventListener('click', handleRageClick, { capture: true });
            window.removeEventListener('touchstart', handleRageClick, { capture: true });
            window.removeEventListener('click', handleThinkingTime, { capture: true });
            window.removeEventListener('beforeunload', sendExitLog);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [projectId, isEnabled]);
};
