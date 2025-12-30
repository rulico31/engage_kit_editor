import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes as findNext, resolveTriggerItem as resolve } from "../NodeExecutor";

interface AnimateNodeData {
    targetItemId?: string;
    animType?: 'opacity' | 'moveX' | 'moveY' | 'scale' | 'rotate';
    value?: number;
    durationS?: number;
    delayS?: number;
    easing?: string;
    animationMode?: 'absolute' | 'relative';
    loopMode?: 'none' | 'count';
    loopCount?: number;
    relativeOperation?: 'multiply' | 'subtract';
}

/**
 * Executor for Animate nodes
 */
export class AnimateExecutor implements NodeExecutor<AnimateNodeData> {
    async execute(
        node: Node<AnimateNodeData>,
        _context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        console.log('🎬 アニメーションノード実行', {
            nodeId: node.id,
            nodeData: node.data,
            targetItemId: node.data.targetItemId
        });

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

        // Resolve TRIGGER_ITEM placeholder
        const resolvedTargetId = resolve(targetItemId, state.triggerItemId);

        if (!resolvedTargetId) {
            console.warn('⚠️ targetItemIdが設定されていません', { nodeId: node.id });
            return {
                nextNodes: findNext(node.id, null, state.allEdges)
            };
        }

        const currentState = state.getPreviewState();
        const initialItem = state.placedItems.find(p => p.id === resolvedTargetId);

        // PreviewState にアイテムが存在しない場合はスキップ
        if (!currentState[resolvedTargetId] || !initialItem) {
            console.warn('⚠️ ターゲットアイテムが見つかりません', { resolvedTargetId });
            return {
                nextNodes: findNext(node.id, null, state.allEdges)
            };
        }

        const durationMs = (Number(durationS) + Number(delayS)) * 1000;

        // アニメーション実行関数（Promiseベース）
        const playAnimation = async (remaining: number): Promise<void> => {
            return new Promise((resolve) => {
                let cssProperty = '';
                let toState: Partial<any>;
                const currentItemState = state.getPreviewState()[resolvedTargetId];

                if (animationMode === 'relative') {
                    const fromState = { ...currentItemState, transition: 'none' };
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

                    // 1. まず transition: none で開始状態をセット (リセット)
                    state.setPreviewState({
                        ...state.getPreviewState(),
                        [resolvedTargetId]: fromState,
                    });

                } else {
                    // 絶対値モード
                    const fromState = {
                        ...currentItemState,
                        transition: 'none',
                    };
                    toState = { ...fromState };

                    if (animType === 'opacity') { cssProperty = 'opacity'; toState.opacity = Number(value); }
                    else if (animType === 'moveX') { cssProperty = 'left'; toState.x = Number(value); }
                    else if (animType === 'moveY') { cssProperty = 'top'; toState.y = Number(value); }
                    else if (animType === 'scale') { cssProperty = 'transform'; toState.scale = Number(value); }
                    else if (animType === 'rotate') { cssProperty = 'transform'; toState.rotation = Number(value); }

                    // 1. まず transition: none で開始状態をセット (リセット)
                    state.setPreviewState({
                        ...state.getPreviewState(),
                        [resolvedTargetId]: fromState,
                    });
                }

                if (!cssProperty) {
                    resolve();
                    return;
                }

                // 2. わずかに遅らせて transition を有効にし、目標値をセット
                setTimeout(() => {
                    state.setPreviewState({
                        ...state.getPreviewState(),
                        [resolvedTargetId]: {
                            ...state.getPreviewState()[resolvedTargetId],
                            ...toState,
                            transition: `${cssProperty} ${durationS}s ${easing} ${delayS}s`
                        },
                    });
                }, 10);

                // 3. アニメーション終了後の処理
                setTimeout(() => {
                    if (loopMode === 'count' && remaining > 1) {
                        // ループ継続
                        playAnimation(remaining - 1).then(resolve);
                    } else {
                        // ループ完了
                        resolve();
                    }
                }, durationMs + 20); // 少し余裕を持たせる
            });
        };

        // アニメーションを実行（ループ対応）
        const initialPlays = (loopMode === 'count') ? Number(loopCount) : 1;
        await playAnimation(initialPlays);

        console.log('✅ アニメーション完了', { nodeId: node.id, resolvedTargetId });

        return {
            nextNodes: findNext(node.id, null, state.allEdges)
        };
    }
}
