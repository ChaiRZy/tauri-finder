import { useFileStore } from '../../stores/fileStore';
import { X, Plus } from 'lucide-react';
import './FileTabs.css';

export default function FileTabs() {
  const tabs = useFileStore((s) => s.tabs);
  const activeTabId = useFileStore((s) => s.activeTabId);
  const switchTab = useFileStore((s) => s.switchTab);
  const closeTab = useFileStore((s) => s.closeTab);
  const addTab = useFileStore((s) => s.addTab);
  const currentDir = useFileStore((s) => s.currentDir);

  return (
    <div className="file-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`file-tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => switchTab(tab.id)}
        >
          <span className="file-tab-label">{tab.label}</span>
          {tabs.length > 1 && (
            <button
              className="file-tab-close"
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button
        className="file-tab-add"
        onClick={() => addTab(currentDir)}
        title="New tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
