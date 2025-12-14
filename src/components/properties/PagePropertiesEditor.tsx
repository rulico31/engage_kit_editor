import React, { useState, useEffect } from "react";
import { usePageStore } from "../../stores/usePageStore";
import { AccordionSection } from "./SharedComponents";


interface PagePropertiesEditorProps {
    pageId: string;
}

export const PagePropertiesEditor: React.FC<PagePropertiesEditorProps> = ({ pageId }) => {
    const { page, updatePage, updatePageName } = usePageStore(state => ({
        page: state.pages[pageId],
        updatePage: state.updatePage,
        updatePageName: state.updatePageName,
    }));

    const [name, setName] = useState(page?.name || "");

    useEffect(() => {
        setName(page?.name || "");
    }, [page?.name]);

    if (!page) return <div className="properties-panel-content">ページが見つかりません</div>;

    const handleNameBlur = () => {
        if (name !== page.name) {
            updatePageName(pageId, name);
        }
    };

    const handleBgColorChange = (color: string) => {
        updatePage(pageId, { backgroundColor: color });
    };



    return (
        <div className="properties-panel-content" style={{ padding: '16px' }}>
            <div className="prop-group" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>ページ設定</h3>
            </div>

            <AccordionSection title="基本情報" defaultOpen={true}>
                <div className="prop-group">
                    <div className="prop-label">ページ名</div>
                    <input
                        type="text"
                        className="prop-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleNameBlur}
                    />
                </div>
            </AccordionSection>

            <AccordionSection title="外観 (Appearance)" defaultOpen={true}>
                <div className="prop-group">
                    <div className="prop-label">背景色 (Background Color)</div>

                    {/* 透明チェックボックス */}
                    <label className="prop-checkbox-row" style={{ marginBottom: '8px' }}>
                        <input
                            type="checkbox"
                            checked={page.backgroundColor === 'transparent'}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    handleBgColorChange('transparent');
                                } else {
                                    handleBgColorChange('#ffffff');
                                }
                            }}
                        />
                        <span>透明 (Transparent)</span>
                    </label>

                    {/* 色選択（透明でない場合のみ有効） */}
                    <div className="prop-color-picker-wrapper">
                        <input
                            type="color"
                            className="prop-color-picker"
                            value={page.backgroundColor === 'transparent' ? '#ffffff' : (page.backgroundColor || "#ffffff")}
                            onChange={(e) => handleBgColorChange(e.target.value)}
                            disabled={page.backgroundColor === 'transparent'}
                            style={{ opacity: page.backgroundColor === 'transparent' ? 0.5 : 1 }}
                        />
                        <input
                            type="text"
                            className="prop-input"
                            style={{ flexGrow: 1 }}
                            value={page.backgroundColor === 'transparent' ? 'transparent' : (page.backgroundColor || "")}
                            placeholder="#ffffff"
                            onChange={(e) => handleBgColorChange(e.target.value)}
                            disabled={page.backgroundColor === 'transparent'}
                        />
                    </div>
                </div>
            </AccordionSection>

            {/* Placeholder for future Grid settings */}
            <AccordionSection title="グリッド設定" defaultOpen={false}>
                <div className="placeholder-text" style={{ margin: 0, padding: 10 }}>
                    グリッド設定は現在開発中です
                </div>
            </AccordionSection>
        </div>
    );
};
