import { describe, it, expect, beforeEach } from 'vitest';
import type { Node } from 'reactflow';
import { IfExecutor } from '../../../logic/executors/IfExecutor';
import type { RuntimeState } from '../../../logic/NodeExecutor';
import type { PreviewState, VariableState } from '../../../types';
import type { LogicRuntimeContext } from '../../../logicEngine';

describe('IfExecutor', () => {
    let executor: IfExecutor;
    let mockContext: LogicRuntimeContext;
    let mockState: RuntimeState;
    let previewState: PreviewState;
    let variables: VariableState;

    beforeEach(() => {
        executor = new IfExecutor();

        previewState = {
            currentPageId: 'page-1',
            isFinished: false,
            'item-1': { isVisible: true, x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
            'item-2': { isVisible: false, x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
        };

        variables = {
            'score': 50,
            'name': 'Test User',
            'email': 'test@example.com'
        };

        mockContext = {
            logEvent: async () => { },
            submitLead: async () => true,
            fetchApi: async () => ({}),
        };

        mockState = {
            placedItems: [],
            allNodes: [],
            allEdges: [
                { id: 'edge-1', source: 'if-1', sourceHandle: 'true', target: 'next-1' },
                { id: 'edge-2', source: 'if-1', sourceHandle: 'false', target: 'next-2' },
            ],
            getPreviewState: () => previewState,
            setPreviewState: (newState) => { previewState = newState; },
            getVariables: () => variables,
            setVariables: (newVars) => { variables = newVars; },
            requestPageChange: () => { },
            activeListeners: new Map(),
            triggerItemId: null,
        };
    });

    describe('Item conditions', () => {
        it('should branch true when item is visible', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'item',
                    conditionTargetId: 'item-1',
                    conditionType: 'isVisible'
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
            expect(result.nextNodes).not.toContain('next-2');
        });

        it('should branch false when item is hidden', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'item',
                    conditionTargetId: 'item-1',
                    conditionType: 'isHidden'
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-2');
        });
    });

    describe('Variable conditions - Number comparison', () => {
        it('should correctly compare numbers with ==', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'variable',
                    variableName: 'score',
                    comparisonType: 'number',
                    comparison: '==',
                    comparisonValue: 50
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
        });

        it('should correctly compare numbers with >', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'variable',
                    variableName: 'score',
                    comparisonType: 'number',
                    comparison: '>',
                    comparisonValue: 40
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
        });

        it('should correctly compare numbers with <=', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'variable',
                    variableName: 'score',
                    comparisonType: 'number',
                    comparison: '<=',
                    comparisonValue: 60
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
        });
    });

    describe('Variable conditions - String comparison', () => {
        it('should correctly compare strings with ==', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'variable',
                    variableName: 'name',
                    comparisonType: 'string',
                    comparison: '==',
                    comparisonValue: 'Test User'
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
        });

        it('should correctly handle contains operator', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'variable',
                    variableName: 'email',
                    comparisonType: 'string',
                    comparison: 'contains',
                    comparisonValue: '@example.com'
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
        });

        it('should correctly handle not_contains operator', async () => {
            const node: Node = {
                id: 'if-1',
                type: 'ifNode',
                data: {
                    conditionSource: 'variable',
                    variableName: 'email',
                    comparisonType: 'string',
                    comparison: 'not_contains',
                    comparisonValue: '@invalid.com'
                },
                position: { x: 0, y: 0 }
            };

            const result = await executor.execute(node, mockContext, mockState);

            expect(result.nextNodes).toContain('next-1');
        });
    });
});
