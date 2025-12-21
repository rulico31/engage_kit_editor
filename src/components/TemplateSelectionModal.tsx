import React from 'react';
import './TemplateSelectionModal.css';

interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface TemplateSelectionModalProps {
    onClose: () => void;
    onSelectTemplate: (templateId: string | null) => void;
}

const templates: Template[] = [
    {
        id: 'blank',
        name: '空のプロジェクト',
        description: 'ゼロから作成',
        icon: '📄'
    },
    {
        id: 'diagnostic',
        name: '診断テンプレート',
        description: '質問に答えて結果を表示',
        icon: '🎯'
    },
    {
        id: 'landing-page',
        name: 'ランディングページ',
        description: 'LP・キャンペーンページ',
        icon: '🚀'
    },
    {
        id: 'survey',
        name: 'アンケート',
        description: 'フォーム・アンケート収集',
        icon: '📋'
    }
];

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
    onClose,
    onSelectTemplate
}) => {
    const handleSelectTemplate = (templateId: string | null) => {
        onSelectTemplate(templateId);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="template-modal" onClick={(e) => e.stopPropagation()}>
                <div className="template-modal-header">
                    <h2>テンプレートを選択</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="template-grid">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="template-card"
                            onClick={() => handleSelectTemplate(template.id === 'blank' ? null : template.id)}
                        >
                            <div className="template-icon">{template.icon}</div>
                            <h3>{template.name}</h3>
                            <p>{template.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
