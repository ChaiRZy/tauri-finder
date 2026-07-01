import { useCallback, useRef, useState, useEffect } from 'react';
import { useAppTabsStore } from '../../stores/appTabsStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { useFileStore } from '../../stores/fileStore';
import { X, Plus, PanelLeft, Terminal, FolderOpen } from 'lucide-react';
import './AppTabsBar.css';

export default function AppTabsBar() {
  const tabs = useAppTabsStore((s) => s.tabs);
  const activeTabId = useAppTabsStore((s) => s.activeTabId);
  const switchTab = useAppTabsStore((s) => s.switchTab);
  const closeTab = useAppTabsStore((s) => s.closeTab);
  const addTab = useAppTabsStore((s) => s.addTab);

  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const visible = usePluginStore((s) => s.visible);
  const currentDir = useFileStore((s) => s.currentDir);

  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  const handleNewFilesTab = useCallback(() => {
    addTab('files', { title: 'Files', currentDir: currentDir || '/' });
    setShowNewMenu(false);
  }, [addTab, currentDir]);

  const handleNewTerminalTab = useCallback(() => {
    addTab('terminal', { title: 'Terminal' });
    setShowNewMenu(false);
  }, [addTab]);

  return (
    <div className="app-tabs-bar">
      {/* Sidebar toggle */}
      <button
        className={`app-tabs-sidebar-btn ${visible['file-explorer'] ? 'active' : ''}`}
        onClick={() => togglePlugin('file-explorer')}
        title="Toggle file explorer"
      >
        <PanelLeft size={15} />
      </button>

      {/* Tab list */}
      <div className="app-tabs-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`app-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
            title={tab.title}
          >
            <span className="app-tab-icon">
              {tab.type === 'terminal' ? <Terminal size={12} /> : <FolderOpen size={12} />}
            </span>
            <span className="app-tab-label">{tab.title}</span>
            {!tab.pinned && (
              <button
                className="app-tab-close"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New tab button with dropdown */}
      <div className="app-tabs-add-wrapper" ref={menuRef}>
        <button
          className="app-tab-add"
          onClick={() => setShowNewMenu((v) => !v)}
          title="New tab"
        >
          <Plus size={15} />
        </button>
        {showNewMenu && (
          <div className="app-tabs-add-menu">
            <div className="app-tabs-add-item" onClick={handleNewFilesTab}>
              <FolderOpen size={13} />
              <span>New Files Tab</span>
            </div>
            <div className="app-tabs-add-item" onClick={handleNewTerminalTab}>
              <Terminal size={13} />
              <span>New Terminal Tab</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
