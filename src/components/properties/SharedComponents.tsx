import React, { useState, useRef, useEffect } from "react";
import { useSelectionStore } from "../../stores/useSelectionStore";

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
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);
  
  if (tabs.length === 0) return null;

  return (
    <div className="inspector-tabs-container" ref={tabsContainerRef}>
      {tabs.map((entry) => (
        <div
          key={entry.id}
          className={`inspector-tab ${entry.id === activeTabId ? "is-active" : ""}`}
          onClick={() => handleTabSelect(entry.id)}
        >
          <span className="tab-label">{entry.label}</span>
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
      ))}
    </div>
  );
};