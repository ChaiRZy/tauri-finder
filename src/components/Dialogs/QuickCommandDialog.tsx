import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { Trash2 } from 'lucide-react';
import './Dialog.css';

let cmdIdCounter = Date.now();

export default function QuickCommandDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const quickCommands = useUiStore((s) => s.quickCommands);
  const addQuickCommand = useUiStore((s) => s.addQuickCommand);
  const removeQuickCommand = useUiStore((s) => s.removeQuickCommand);

  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [mode, setMode] = useState<'current' | 'fixed'>('current');
  const [fixedPath, setFixedPath] = useState('');

  if (!dialog || dialog.type !== 'quickCommand') return null;

  const handleAdd = () => {
    if (!name.trim() || !command.trim()) return;
    addQuickCommand({
      id: `cmd_${++cmdIdCounter}`,
      name: name.trim(),
      command: command.trim(),
      mode,
      fixedPath: mode === 'fixed' ? fixedPath.trim() : undefined,
    });
    setName('');
    setCommand('');
    setMode('current');
    setFixedPath('');
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className="dialog-header">Quick Commands</div>
        <div className="dialog-body">
          {quickCommands.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label className="dialog-label">Saved commands:</label>
              {quickCommands.map((cmd) => (
                <div key={cmd.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{cmd.name} <span style={{ color: '#999' }}>({cmd.command})</span></span>
                  <button className="dialog-btn" onClick={() => removeQuickCommand(cmd.id)} style={{ padding: '2px 6px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="dialog-label">Add new command:</label>
          <input
            className="dialog-input"
            placeholder="Command name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: 6 }}
          />
          <input
            className="dialog-input"
            placeholder="Command (e.g. git status)"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            style={{ marginBottom: 6 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <select
              className="toolbar-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'current' | 'fixed')}
              style={{ flex: 1 }}
            >
              <option value="current">Run in current dir</option>
              <option value="fixed">Run in fixed path</option>
            </select>
            {mode === 'fixed' && (
              <input
                className="dialog-input"
                placeholder="Fixed path"
                value={fixedPath}
                onChange={(e) => setFixedPath(e.target.value)}
                style={{ flex: 2 }}
              />
            )}
            <button className="dialog-btn dialog-btn-primary" onClick={handleAdd} style={{ whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn dialog-btn-primary" onClick={closeDialog}>Done</button>
        </div>
      </div>
    </div>
  );
}
