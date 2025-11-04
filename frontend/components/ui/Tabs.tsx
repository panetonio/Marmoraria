import React from 'react';

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onTabClick: (tabId: T) => void;
  className?: string;
}

const Tabs = <T extends string>({ tabs, activeTab, onTabClick, className = '' }: TabsProps<T>) => {
  return (
    <div className={`mb-6 flex space-x-2 border-b border-border dark:border-slate-700 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`capitalize px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${
            activeTab === tab.id
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200'
          }`}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;