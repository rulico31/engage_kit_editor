import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class AnimateExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, getPreviewState, setPreviewState, placedItems, triggerItemId, pushNext, allEdges, processQueue } = params;


        if (import.meta.env.DEV) {
            console.log('🎬 アニメーションノード実行', {
                nodeId: node.id,
                nodeData: node.data,
                targetItemId: node.data.targetItemId
            });
        }

        const {
            targetItemId,
            animType,
            value,
            durationS = 0.5,
            delayS = 0,
            easing = 'ease',
            animationMode = 'absolute',
            loopMode = 'none',
            loopCount = 2,
            relativeOperation = 'multiply'
        } = node.data;

        const resolvedTargetId = targetItemId === 'TRIGGER_ITEM' ? triggerItemId : targetItemId;

        if (resolvedTargetId) {
            const currentState = getPreviewState();
            const initialItem = placedItems.find(p => p.id === resolvedTargetId);

            if (currentState[resolvedTargetId] && initialItem) {

                let cssProperty = '';
                const durationMs = (Number(durationS) + Number(delayS)) * 1000;
                let toState: Partial<any>;

                const playAnimation = (remaining: number) => {
                    let fromState: any;
                    // 最新のStateを取得
                    const currentItemState = getPreviewState()[resolvedTargetId];

                    if (animationMode === 'relative') {
                        fromState = { ...currentItemState, transition: 'none' };
                        toState = { ...fromState };
                        const numValue = Number(value || 0);

                        if (animType === 'opacity') {
                            cssProperty = 'opacity';
                            if (relativeOperation === 'subtract') {
                                toState.opacity = fromState.opacity - numValue;
                            } else {
                                toState.opacity = fromState.opacity * numValue;
                            }
                        }
                        else if (animType === 'moveX') {
                            cssProperty = 'left';
                            toState.x = fromState.x + numValue;
                        }
                        else if (animType === 'moveY') {
                            cssProperty = 'top';
                            toState.y = fromState.y + numValue;
                        }
                        else if (animType === 'scale') {
                            cssProperty = 'transform';
                            toState.scale = fromState.scale * numValue;
                        }
                        else if (animType === 'rotate') {
                            cssProperty = 'transform';
                            toState.rotation = fromState.rotation + numValue;
                        }

                    } else {
                        // 絶対値モード
                        fromState = {
                            ...currentItemState,
                            transition: 'none',
                        };
                        toState = { ...fromState };

                        if (animType === 'opacity') { cssProperty = 'opacity'; toState.opacity = Number(value); }
                        else if (animType === 'moveX') { cssProperty = 'left'; toState.x = Number(value); }
                        else if (animType === 'moveY') { cssProperty = 'top'; toState.y = Number(value); }
                        else if (animType === 'scale') { cssProperty = 'transform'; toState.scale = Number(value); }
                        else if (animType === 'rotate') { cssProperty = 'transform'; toState.rotation = Number(value); }
                    }

                    if (!cssProperty) {
                        pushNext(node.id, null, allEdges, []);
                        // TODO: pushNext だけでは再帰が進まないので、本来呼び出し元ループに戻るか processQueue する必要がある
                        // ここでは processQueue を呼ぶ
                        const nextQ: string[] = [];
                        pushNext(node.id, null, allEdges, nextQ);
                        if (nextQ.length > 0) processQueue(nextQ);
                        return;
                    }

                    // 1. まず transition: none で開始状態をセット (リセット)
                    setPreviewState({
                        ...getPreviewState(),
                        [resolvedTargetId]: fromState,
                    });

                    // 2. わずかに遅らせて transition を有効にし、目標値をセット
                    setTimeout(() => {
                        setPreviewState({
                            ...getPreviewState(),
                            [resolvedTargetId]: {
                                ...getPreviewState()[resolvedTargetId],
                                ...toState,
                                transition: `${cssProperty} ${durationS}s ${easing} ${delayS}s`
                            },
                        });
                    }, 10);

                    // 3. アニメーション終了後の処理 (ループまたは次のノードへ)
                    setTimeout(() => {
                        if (loopMode === 'count' && remaining > 1) {
                            const nextRemaining = remaining - 1;
                            playAnimation(nextRemaining);
                        } else {
                            const nextQueue: string[] = [];
                            pushNext(node.id, null, allEdges, nextQueue);
                            if (nextQueue.length > 0) {
                                processQueue(nextQueue);
                            }
                        }
                    }, durationMs + 20); // 少し余裕を持たせる
                };

                const initialPlays = (loopMode === 'count') ? Number(loopCount) : 1;
                playAnimation(initialPlays);

            } else {
                // ターゲットが見つからない場合はスキップ
                const nextQueue: string[] = [];
                pushNext(node.id, null, allEdges, nextQueue);
                if (nextQueue.length > 0) processQueue(nextQueue);
            }
        } else {
            const nextQueue: string[] = [];
            pushNext(node.id, null, allEdges, nextQueue);
            if (nextQueue.length > 0) processQueue(nextQueue);
        }
    }
}
