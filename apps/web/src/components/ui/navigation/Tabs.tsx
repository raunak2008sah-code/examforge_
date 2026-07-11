'use client';

import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTabId, onChange }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId || tabs[0]?.id);

  const handleTabClick = (id: string) => {
    setActiveId(id);
    onChange?.(id);
  };

  const activeTab = tabs.find((t) => t.id === activeId);

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-4)',
          overflowX: 'auto',
          scrollbarWidth: 'none', // hide scrollbar but allow scrolling
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--brand-primary)' : 'transparent'}`,
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                whiteSpace: 'nowrap',
                transition: 'all var(--motion-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !tab.disabled) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'rgba(0,0,0,var(--opacity-hover-overlay))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !tab.disabled) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${activeId}`} aria-labelledby={`tab-${activeId}`}>
        {activeTab?.content}
      </div>
    </div>
  );
}
