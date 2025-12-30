import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../ItemTypes';
import './NodePalette.css';

// ノードタイプの定義
interface NodeTypeDefinition {
    type: string;
    label: string;
    icon: string;
    category: 'event' | 'action' | 'control' | 'data' | 'other';
    description?: string;
}

const nodeTypes: NodeTypeDefinition[] = [
    // イベント
    { type: 'eventNode', label: 'イベント', icon: '⚡', category: 'event', description: 'イベントトリガー (クリック等)' },

    // アクション
    { type: 'actionNode', label: '表示切替', icon: '👁️', category: 'action', description: '表示・非表示の切替' },
    { type: 'pageNode', label: 'ページ遷移', icon: '📄', category: 'action', description: 'ページを移動' },
    { type: 'animateNode', label: 'アニメーション', icon: '🎬', category: 'action', description: 'アニメーション実行' },
    { type: 'submitFormNode', label: 'フォーム送信', icon: '📮', category: 'action', description: 'フォームデータ送信' },
    { type: 'confirmationNode', label: '確認画面', icon: '✅', category: 'action', description: '入力内容の確認画面を表示' },
    { type: 'externalApiNode', label: '外部API', icon: '🌐', category: 'action', description: 'API呼び出し' },

    // 制御フロー
    { type: 'ifNode', label: '条件分岐', icon: '🔀', category: 'control', description: 'if文による分岐' },
    { type: 'abTestNode', label: 'A/Bテスト', icon: '🧪', category: 'control', description: 'A/Bテスト分岐' },
    { type: 'delayNode', label: '遅延', icon: '⏱️', category: 'control', description: '一定時間待機' },

    // データ
    { type: 'setVariableNode', label: '変数設定', icon: '💾', category: 'data', description: '変数に値を設定' },
];

const categories = [
    { id: 'event', label: 'イベント', color: '#ff6b6b' },
    { id: 'action', label: 'アクション', color: '#4ecdc4' },
    { id: 'control', label: '制御フロー', color: '#ffe66d' },
    { id: 'data', label: 'データ', color: '#a8dadc' },
    { id: 'other', label: 'その他', color: '#95a5a6' },
];

interface DraggableNodeItemProps {
    nodeType: NodeTypeDefinition;
}

const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({ nodeType }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.NODE_PALETTE_ITEM,
        item: { type: nodeType.type, label: nodeType.label },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const ref = React.useRef<HTMLDivElement>(null);
    drag(ref);

    return (
        <div
            ref={ref}
            className="node-palette-item"
            style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
            title={nodeType.description}
        >
            <span className="node-palette-icon">{nodeType.icon}</span>
            <span className="node-palette-label">{nodeType.label}</span>
        </div>
    );
};

const NodePalette: React.FC = () => {
    return (
        <div className="node-palette">
            <div className="node-palette-content">
                {categories.map((category) => {
                    const categoryNodes = nodeTypes.filter(n => n.category === category.id);
                    if (categoryNodes.length === 0) return null;

                    return (
                        <div key={category.id} className="node-palette-category">
                            <div
                                className="node-palette-category-header"
                                style={{ borderLeftColor: category.color }}
                            >
                                {category.label}
                            </div>
                            <div className="node-palette-category-items">
                                {categoryNodes.map((nodeType) => (
                                    <DraggableNodeItem key={nodeType.type} nodeType={nodeType} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NodePalette;
