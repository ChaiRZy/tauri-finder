import { useFileStore } from '../../stores/fileStore';
import { useUiStore } from '../../stores/uiStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { Copy, Plus, Terminal } from 'lucide-react';
import type { QuickCommand } from '../../types/file';
import './StatusBar.css';

export default function StatusBar() {
  const currentDir = useFileStore((s) => s.currentDir);
  const entries = useFileStore((s) => s.entries);
  const openDialog = useUiStore((s) => s.openDialog);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const terminalVisible = usePluginStore((s) => s.visible['terminal']);
  const quickCommands = useUiStore((s) => s.quickCommands);
  const runInTerminal = useUiStore((s) => s.runInTerminal);

  const handleCopyPath = async () => {
    if (currentDir) {
      try { await navigator.clipboard.writeText(currentDir); } catch {}
    }
  };

  const handleQuickCmd = (cmd: QuickCommand) => {
    runInTerminal(cmd.command);
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
        <button className={`statusbar-btn ${terminalVisible ? 'active' : ''}`} onClick={() => togglePlugin('terminal')} title="Toggle terminal">
          <Terminal size={13} />
        </button>
      </div>
    </div>
  );
}
