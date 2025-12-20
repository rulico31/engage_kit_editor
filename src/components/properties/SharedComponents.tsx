import React, { useState, useRef, useEffect } from "react";
import { useSelectionStore } from "../../stores/useSelectionStore";
import { usePageStore } from "../../stores/usePageStore";
import { ExternalLink } from "lucide-react";

// --- アコーディオン ---
interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const AccordionSection: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="accordion-section">
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className={`accordion-icon ${isOpen ? "is-open" : ""}`}>▼</span>
        <span className="accordion-title">{title}</span>
      </div>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

// --- タブUI ---
export const InspectorTabs: React.FC = () => {
  const { tabs, activeTabId, handleTabSelect, handleTabClose } = useSelectionStore(
    (s) => ({
      tabs: s.tabs,
      activeTabId: s.activeTabId,
      handleTabSelect: s.handleTabSelect,
      handleTabClose: s.handleTabClose,
    })
  );

  const { pages, selectedPageId } = usePageStore(s => ({
    pages: s.pages,
    selectedPageId: s.selectedPageId
  }));

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Ensure active tab is visible
  useEffect(() => {
    if (activeTabId && tabsContainerRef.current) {
      // Auto-scroll to active tab if needed
      const activeTab = tabsContainerRef.current.querySelector('.inspector-tab.is-active');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  return (
    <div className="inspector-tabs-container" ref={tabsContainerRef}>
      {tabs.map((entry) => {
        const isOtherPage = entry.pageId && entry.pageId !== selectedPageId;
        const pageName = entry.pageId && pages[entry.pageId] ? pages[entry.pageId].name : 'Unknown';
        const tooltip = isOtherPage
          ? `${entry.label} (in ${pageName}) - Click to jump`
          : entry.label;

        return (
          <div
            key={entry.id}
            className={`inspector-tab ${entry.id === activeTabId ? "is-active" : ""}`}
            onClick={() => handleTabSelect(entry.id)}
            title={tooltip}
          >
            <span className="tab-label" style={{ display: 'flex', alignItems: 'center' }}>
              {isOtherPage && (
                <ExternalLink size={11} style={{ marginRight: 4, opacity: 0.7, minWidth: 11 }} />
              )}
              {entry.label}
            </span>
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleTabClose(entry.id);
              }}
            >
              ×
            </span>
          </div>
        );
      })}
    </div>
  );
};