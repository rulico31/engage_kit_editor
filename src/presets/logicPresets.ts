// src/presets/logicPresets.ts
import type { Node, Edge } from 'reactflow';

export interface LogicPreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    nodes: Partial<Node>[];
    edges: Partial<Edge>[];
}

export const logicPresets: LogicPreset[] = [
    {
        id: 'button-to-page',
        name: 'ボタン→ページ遷移',
        description: 'クリックで次のページへ',
        icon: '🔗',
        nodes: [
            {
                id: 'preset-event',
                type: 'eventNode',
                position: { x: 100, y: 100 },
                data: { eventType: 'click', targetItemIds: [] }
            },
            {
                id: 'preset-page',
                type: 'pageNode',
                position: { x: 300, y: 100 },
                data: { targetPageId: '' }
            }
        ],
        edges: [
            {
                id: 'preset-edge-1',
                source: 'preset-event',
                target: 'preset-page'
            }
        ]
    },
    {
        id: 'conditional-display',
        name: '条件分岐→表示',
        description: '条件に応じてアイテム表示',
        icon: '↔️',
        nodes: [
            {
                id: 'preset-event',
                type: 'eventNode',
                position: { x: 100, y: 100 },
                data: { eventType: 'click', targetItemIds: [] }
            },
            {
                id: 'preset-if',
                type: 'ifNode',
                position: { x: 300, y: 100 },
                data: {
                    condition: { type: 'variable', variableName: '', operator: 'equals', value: '' }
                }
            },
            {
                id: 'preset-show-true',
                type: 'actionNode',
                position: { x: 500, y: 50 },
                data: { action: 'show', targetItemIds: [] }
            },
            {
                id: 'preset-show-false',
                type: 'actionNode',
                position: { x: 500, y: 150 },
                data: { action: 'hide', targetItemIds: [] }
            }
        ],
        edges: [
            {
                id: 'preset-edge-1',
                source: 'preset-event',
                target: 'preset-if'
            },
            {
                id: 'preset-edge-2',
                source: 'preset-if',
                sourceHandle: 'true',
                target: 'preset-show-true'
            },
            {
                id: 'preset-edge-3',
                source: 'preset-if',
                sourceHandle: 'false',
                target: 'preset-show-false'
            }
        ]
    },
    {
        id: 'form-submit',
        name: 'フォーム送信→結果',
        description: '入力値を保存して結果表示',
        icon: '📝',
        nodes: [
            {
                id: 'preset-event',
                type: 'eventNode',
                position: { x: 100, y: 100 },
                data: { eventType: 'click', targetItemIds: [] }
            },
            {
                id: 'preset-variable',
                type: 'variableNode',
                position: { x: 300, y: 100 },
                data: { variableName: 'answer', value: '' }
            },
            {
                id: 'preset-page',
                type: 'pageNode',
                position: { x: 500, y: 100 },
                data: { targetPageId: '' }
            }
        ],
        edges: [
            {
                id: 'preset-edge-1',
                source: 'preset-event',
                target: 'preset-variable'
            },
            {
                id: 'preset-edge-2',
                source: 'preset-variable',
                target: 'preset-page'
            }
        ]
    },
    {
        id: 'animation-loop',
        name: 'ループアニメーション',
        description: 'アニメーションを繰り返し実行',
        icon: '🔄',
        nodes: [
            {
                id: 'preset-event',
                type: 'eventNode',
                position: { x: 100, y: 100 },
                data: { eventType: 'click', targetItemIds: [] }
            },
            {
                id: 'preset-animation',
                type: 'animationNode',
                position: { x: 300, y: 100 },
                data: {
                    targetItemIds: [],
                    animationType: 'fadeIn',
                    duration: 500,
                    loopMode: 'count',
                    loopCount: 3
                }
            }
        ],
        edges: [
            {
                id: 'preset-edge-1',
                source: 'preset-event',
                target: 'preset-animation'
            }
        ]
    }
];
