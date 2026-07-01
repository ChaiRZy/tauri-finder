import { useFileStore } from '../../stores/fileStore';
import { useUiStore } from '../../stores/uiStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { useAppTabsStore } from '../../stores/appTabsStore';
import { Copy, Plus, Terminal } from 'lucide-react';
import type { QuickCommand } from '../../types/file';
import './StatusBar.css';

export default function StatusBar() {
  const currentDir = useFileStore((s) => s.currentDir);
  const entries = useFileStore((s) => s.entries);
  const openDialog = useUiStore((s) => s.openDialog);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const visible = usePluginStore((s) => s.visible);
  const quickCommands = useUiStore((s) => s.quickCommands);
  const runInTerminal = useUiStore((s) => s.runInTerminal);

  const tabs = useAppTabsStore((s) => s.tabs);
  const activeTabId = useAppTabsStore((s) => s.activeTabId);
  const switchTab = useAppTabsStore((s) => s.switchTab);
  const addTab = useAppTabsStore((s) => s.addTab);
  const closeTab = useAppTabsStore((s) => s.closeTab);
  const findTab = useAppTabsStore((s) => s.findTab);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isTerminalActive = activeTab?.type === 'terminal';

  const handleCopyPath = async () => {
    if (currentDir) {
      try { await navigator.clipboard.writeText(currentDir); } catch {}
    }
  };

  const handleQuickCmd = (cmd: QuickCommand) => {
    runInTerminal(cmd.command);
  };

  const handleTerminalToggle = () => {
    const termTab = findTab('terminal');
    if (termTab) {
      if (isTerminalActive) {
        // Close terminal tab and switch to first files tab
        closeTab(termTab.id);
      } else {
        switchTab(termTab.id);
      }
    } else {
      addTab('terminal', { title: 'Terminal' });
    }
  };

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className="statusbar-path" title={currentDir}>{currentDir || '--'}</span>
      </div>
      <div className="statusbar-center">
        {entries.length > 0 && (
          <span className="statusbar-count">{entries.length} item{entries.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="statusbar-right">
        {quickCommands.map((cmd) => (
          <button key={cmd.id} className="statusbar-btn statusbar-quick" onClick={() => handleQuickCmd(cmd)} title={cmd.command}>
            {cmd.name}
          </button>
        ))}
        <button className="statusbar-btn" onClick={handleCopyPath} title="Copy path">
          <Copy size={13} />
        </button>
        <button className="statusbar-btn" onClick={() => openDialog({ type: 'quickCommand' })} title="Manage quick commands">
          <Plus size={13} />
        </button>
        <button className={`statusbar-btn ${visible['file-explorer'] ? 'active' : ''}`} onClick={() => togglePlugin('file-explorer')} title="Toggle file explorer">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="1" y="3" width="5" height="4" rx="0.5" />
            <rect x="1" y="9" width="5" height="4" rx="0.5" />
            <rect x="8" y="3" width="7" height="4" rx="0.5" />
            <rect x="8" y="9" width="7" height="4" rx="0.5" />
          </svg>
        </button>
        <button className={`statusbar-btn ${isTerminalActive ? 'active' : ''}`} onClick={handleTerminalToggle} title="Toggle terminal">
          <Terminal size={13} />
        </button>
      </div>
    </div>
  );
}
