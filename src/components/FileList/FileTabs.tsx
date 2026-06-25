import { useState, useEffect, useRef, useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { useUiStore } from '../../stores/uiStore';
import { X, Plus, PanelLeft } from 'lucide-react';
import './FileTabs.css';

interface ContextMenu {
  x: number;
  y: number;
  tabId: string;
  tabDir: string;
}

export default function FileTabs() {
  const tabs = useFileStore((s) => s.tabs);
  const activeTabId = useFileStore((s) => s.activeTabId);
  const switchTab = useFileStore((s) => s.switchTab);
  const closeTab = useFileStore((s) => s.closeTab);
  const addTab = useFileStore((s) => s.addTab);
  const navigateTo = useFileStore((s) => s.navigateTo);
  const currentDir = useFileStore((s) => s.currentDir);

  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const visible = usePluginStore((s) => s.visible);

  const runInTerminal = useUiStore((s) => s.runInTerminal);

  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ctxMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string, tabDir: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, tabId, tabDir });
  }, []);

  const closeMenu = useCallback(() => setCtxMenu(null), []);

  const handleOpenInLeft = useCallback(() => {
    if (!ctxMenu) return;
    navigateTo(ctxMenu.tabDir);
    togglePlugin('file-explorer');
    closeMenu();
  }, [ctxMenu, navigateTo, togglePlugin, closeMenu]);

  const handleOpenInTerminal = useCallback(() => {
    if (!ctxMenu) return;
    runInTerminal(`cd "${ctxMenu.tabDir}"`);
    closeMenu();
  }, [ctxMenu, runInTerminal, closeMenu]);

  const handleCloseTab = useCallback(() => {
    if (!ctxMenu) return;
    closeTab(ctxMenu.tabId);
    closeMenu();
  }, [ctxMenu, closeTab, closeMenu]);

  const handleCloseOthers = useCallback(() => {
    if (!ctxMenu) return;
    tabs.forEach((t) => {
      if (t.id !== ctxMenu!.tabId) closeTab(t.id);
    });
    closeMenu();
  }, [ctxMenu, tabs, closeTab, closeMenu]);

  const handleCloseRight = useCallback(() => {
    if (!ctxMenu) return;
    const idx = tabs.findIndex((t) => t.id === ctxMenu!.tabId);
    tabs.slice(idx + 1).forEach((t) => closeTab(t.id));
    closeMenu();
  }, [ctxMenu, tabs, closeTab, closeMenu]);

  return (
    <div className="file-tabs">
      {/* Left: file explorer toggle */}
      <button
        className={`file-tabs-fs-btn ${visible['file-explorer'] ? 'active' : ''}`}
        onClick={() => togglePlugin('file-explorer')}
        title="Toggle file explorer"
      >
        <PanelLeft size={14} />
      </button>

      {/* Tab list */}
      <div className="file-tabs-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`file-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id, tab.currentDir)}
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
      </div>

      {/* New tab button */}
      <button
        className="file-tab-add"
        onClick={() => addTab(currentDir)}
        title="New tab"
      >
        <Plus size={14} />
      </button>

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          ref={menuRef}
          className="file-tabs-ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <div className="file-tabs-ctx-item" onClick={handleOpenInLeft}>
            Open in Left Panel
          </div>
          <div className="file-tabs-ctx-item" onClick={handleOpenInTerminal}>
            Open in Terminal
          </div>
          <div className="file-tabs-ctx-sep" />
          <div className="file-tabs-ctx-item" onClick={handleCloseTab}>
            Close Tab
          </div>
          <div className="file-tabs-ctx-item" onClick={handleCloseOthers}>
            Close Others
          </div>
          <div className="file-tabs-ctx-item" onClick={handleCloseRight}>
            Close Tabs to the Right
          </div>
        </div>
      )}
    </div>
  );
}
