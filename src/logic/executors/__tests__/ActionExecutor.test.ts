import { describe, it, expect, beforeEach } from 'vitest';
import type { Node } from 'reactflow';
import { ActionExecutor } from '../../../logic/executors/ActionExecutor';
import type { RuntimeState } from '../../../logic/NodeExecutor';
import type { PreviewState } from '../../../types';
import type { LogicRuntimeContext } from '../../../logicEngine';

describe('ActionExecutor', () => {
    let executor: ActionExecutor;
    let mockContext: LogicRuntimeContext;
    let mockState: RuntimeState;
    let previewState: PreviewState;

    beforeEach(() => {
        executor = new ActionExecutor();

        previewState = {
            currentPageId: 'page-1',
            isFinished: false,
            'item-1': { isVisible: true, x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
            'item-2': { isVisible: false, x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
        };

        mockContext = {
            logEvent: async () => { },
            submitLead: async () => true,
            fetchApi: async () => ({}),
        };

        mockState = {
            placedItems: [],
            allNodes: [],
            allEdges: [],
            getPreviewState: () => previewState,
            setPreviewState: (newState) => { previewState = newState; },
            getVariables: () => ({}),
            setVariables: () => { },
            requestPageChange: () => { },
            activeListeners: new Map(),
            triggerItemId: null,
        };
    });

    it('should show hidden item', async () => {
        const node: Node = {
            id: 'action-1',
            type: 'actionNode',
            data: {
                targetItemId: 'item-2',
                mode: 'show'
            },
            position: { x: 0, y: 0 }
        };

        await executor.execute(node, mockContext, mockState);

        expect(previewState['item-2'].isVisible).toBe(true);
    });

    it('should hide visible item', async () => {
        const node: Node = {
            id: 'action-2',
            type: 'actionNode',
            data: {
                targetItemId: 'item-1',
                mode: 'hide'
            },
            position: { x: 0, y: 0 }
        };

        await executor.execute(node, mockContext, mockState);

        expect(previewState['item-1'].isVisible).toBe(false);
    });

    it('should toggle item visibility', async () => {
        const node: Node = {
            id: 'action-3',
            type: 'actionNode',
            data: {
                targetItemId: 'item-1',
                mode: 'toggle'
            },
            position: { x: 0, y: 0 }
        };

        const initialVisibility = previewState['item-1'].isVisible;
        await executor.execute(node, mockContext, mockState);

        expect(previewState['item-1'].isVisible).toBe(!initialVisibility);
    });

    it('should resolve TRIGGER_ITEM placeholder', async () => {
        mockState.triggerItemId = 'item-2';

        const node: Node = {
            id: 'action-4',
            type: 'actionNode',
            data: {
                targetItemId: 'TRIGGER_ITEM',
                mode: 'show'
            },
            position: { x: 0, y: 0 }
        };

        await executor.execute(node, mockContext, mockState);

        expect(previewState['item-2'].isVisible).toBe(true);
    });
});
