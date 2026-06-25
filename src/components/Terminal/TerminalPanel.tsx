import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon, ISearchOptions } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { Command } from '@tauri-apps/plugin-shell';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import type { ShellType } from '../../types/file';
import { Settings, Plus, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

let nextTabId = 1;
function genId() { return `tab-${nextTabId++}`; }

interface TabState {
  id: string;
  shellType: ShellType;
  xterm: XtermTerminal | null;
  fitAddon: FitAddon | null;
  child: any; // Child process
  cmdObj: any; // Command object
}

export default function TerminalPanel() {
  const currentDir = useFileStore((s) => s.currentDir);
  const terminalCommand = useUiStore((s) => s.terminalCommand);
  const clearTerminalCommand = useUiStore((s) => s.clearTerminalCommand);

  const [tabs, setTabs] = useState<TabState[]>(() => [{
    id: genId(),
    shellType: useUiStore.getState().defaultShell as ShellType,
    xterm: null,
    fitAddon: null,
    child: null,
    cmdObj: null,
  }]);
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
  const termContainers = useRef<Record<string, HTMLDivElement | null>>({});
  const tabRefs = useRef<TabState[]>(tabs);
  const xtermRefs = useRef<Record<string, XtermTerminal | null>>({});
  tabRefs.current = tabs;

  const updateTab = useCallback((id: string, patch: Partial<TabState>) => {
    setTabs((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  }, []);

  // Spawn a shell for a given tab
  const spawnShell = useCallback(async (tab: TabState) => {
    const builtinShells: Record<string, { prog: string; args: string[] }> = {
      cmd: { prog: 'cmd', args: [] },
      powershell: { prog: 'powershell', args: [] },
      gitbash: { prog: 'bash', args: ['--login'] },
    };
    const customShells = useUiStore.getState().customShells;
    const cs = customShells.find(s => s.id === tab.shellType);
    let prog: string;
    let args: string[];
    if (cs) {
      prog = cs.program;
      args = cs.args ? cs.args.split(' ').filter(Boolean) : [];
    } else if (builtinShells[tab.shellType]) {
      prog = builtinShells[tab.shellType].prog;
      args = builtinShells[tab.shellType].args;
    } else {
      prog = 'cmd';
      args = [];
    }
    try {
      const cmd = Command.create(prog, args, { cwd: currentDir || undefined, encoding: 'raw' });
      updateTab(tab.id, { cmdObj: cmd });

      cmd.stdout.on('data', (data: Uint8Array) => {
        const x = xtermRefs.current[tab.id];
        if (x) x.write(data);
      });
      cmd.stderr.on('data', (data: Uint8Array) => {
        const x = xtermRefs.current[tab.id];
        if (x) x.write(data);
      });
      cmd.on('close', () => {
        const x = xtermRefs.current[tab.id];
        if (x) x.write('\r\n\x1b[33m[shell exited]\x1b[0m\r\n');
        updateTab(tab.id, { child: null });
      });
      cmd.on('error', (err: string) => {
        const x = xtermRefs.current[tab.id];
        if (x) x.write(`\r\n\x1b[31m[error: ${err}]\x1b[0m\r\n`);
      });

      const child = await cmd.spawn();
      updateTab(tab.id, { child });

      // Flush pending terminal command
      const pending = useUiStore.getState().terminalCommand;
      if (pending) {
        useUiStore.getState().clearTerminalCommand();
        child.write(pending + '\n');
      }
    } catch (e) {
      const t = tabRefs.current.find((t) => t.id === tab.id);
      if (t?.xterm) t.xterm.write(`\r\n\x1b[31m[failed: ${e}]\x1b[0m\r\n`);
    }
  }, [currentDir, updateTab]);

  // Initialize xterm for each tab (when the container is available)
  useEffect(() => {
    for (const tab of tabs) {
      if (tab.xterm) continue; // already initialized
      const container = termContainers.current[tab.id];
      if (!container) continue;

      const term = new XtermTerminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'Consolas, "Cascadia Code", "Fira Code", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selectionBackground: '#264f78',
          black: '#1e1e1e',
          red: '#e5534b',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#bc8cff',
          cyan: '#39c5cf',
          white: '#d4d4d4',
          brightBlack: '#6e7681',
          brightRed: '#ff7b72',
          brightGreen: '#3fb950',
          brightYellow: '#d29922',
          brightBlue: '#58a6ff',
          brightMagenta: '#bc8cff',
          brightCyan: '#39c5cf',
          brightWhite: '#f0f6fc',
        },
        allowProposedApi: true,
        allowTransparency: false,
        cols: 80,
        rows: 10,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(container);
      setTimeout(() => fit.fit(), 50);

      term.onData((data) => {
        const t = tabRefs.current.find((t) => t.id === tab.id);
        if (t?.child) t.child.write(data);
      });

      // Focus terminal for keyboard input
      term.focus();

      const ro = new ResizeObserver(() => {
        try {
          fit.fit();
        } catch {}
      });
      ro.observe(container);

      xtermRefs.current[tab.id] = term;
      updateTab(tab.id, { xterm: term, fitAddon: fit });
      spawnShell(tab);

      // Store cleanup ref
      (container as any).__ro = ro;
    }
  }, [tabs, updateTab, spawnShell]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const tab of tabs) {
        if (tab.child) { try { tab.child.kill(); } catch {} }
        if (tab.cmdObj) { tab.cmdObj.removeAllListeners(); }
        tab.xterm?.dispose();
      }
    };
  }, []);

  // Fit terminal + focus when tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const tab of tabs) {
        try { tab.fitAddon?.fit(); } catch {}
      }
      const active = tabs.find(t => t.id === activeTab);
      if (active?.xterm) {
        active.xterm.focus();
        // Also focus the hidden textarea for keyboard input
        (active.xterm as any).textarea?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [tabs, activeTab]);

  // Send terminal commands
  useEffect(() => {
    if (!terminalCommand) return;
    const active = tabRefs.current.find((t) => t.id === activeTab);
    if (active?.child) {
      active.child.write(terminalCommand + '\n');
      clearTerminalCommand();
    }
  }, [terminalCommand, activeTab, clearTerminalCommand]);

  // Tab management
  const addTab = useCallback(() => {
    const def = useUiStore.getState().defaultShell;
    const newTab: TabState = {
      id: genId(),
      shellType: def as ShellType,
      xterm: null,
      fitAddon: null,
      child: null,
      cmdObj: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const tab = prev[idx];
      if (tab.child) { try { tab.child.kill(); } catch {} }
      if (tab.cmdObj) { tab.cmdObj.removeAllListeners(); }
      tab.xterm?.dispose();
      delete xtermRefs.current[id];
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        // keep at least one tab
        const fresh: TabState = {
          id: genId(),
          shellType: useUiStore.getState().defaultShell as ShellType,
          xterm: null,
          fitAddon: null,
          child: null,
          cmdObj: null,
        };
        setActiveTab(fresh.id);
        return [fresh];
      }
      if (activeTab === id) {
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTab(next[newIdx].id);
      }
      return next;
    });
  }, [activeTab]);

  const [showSettings, setShowSettings] = useState(false);
  const defaultShell = useUiStore((s) => s.defaultShell);
  const setDefaultShell = useUiStore((s) => s.setDefaultShell);
  const customShells = useUiStore((s) => s.customShells);
  const addCustomShell = useUiStore((s) => s.addCustomShell);
  const removeCustomShell = useUiStore((s) => s.removeCustomShell);
  const [newShellName, setNewShellName] = useState('');
  const [newShellProg, setNewShellProg] = useState('');
  const [newShellArgs, setNewShellArgs] = useState('');

  return (
    <div className="terminal-wrapper">
      <div className="terminal-panel">
        <div className="terminal-header">
          <div className="terminal-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`terminal-tab ${tab.id === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="terminal-tab-icon">
                  {tab.shellType === 'powershell' ? 'PS' : tab.shellType === 'gitbash' ? 'BASH' : tab.shellType === 'cmd' ? 'CMD' : 'SH'}
                </span>
                <span className="terminal-tab-name">
                  {tab.shellType === 'powershell' ? 'PowerShell' : tab.shellType === 'gitbash' ? 'Git Bash' : tab.shellType === 'cmd' ? 'cmd' : customShells.find(s => s.id === tab.shellType)?.name || tab.shellType}
                </span>
                {tabs.length > 1 && (
                  <button
                    className="terminal-tab-close"
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button className="terminal-tab-add" onClick={addTab} title="New tab">+</button>
          </div>
          <div className="terminal-header-right">
            <button className="terminal-settings-btn" onClick={() => setShowSettings(!showSettings)} title="Terminal settings">
              <Settings size={13} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="terminal-settings-panel">
            <div className="terminal-settings-row">
              <span className="terminal-settings-label">Default shell:</span>
              <select
                className="toolbar-select"
                value={defaultShell}
                onChange={(e) => setDefaultShell(e.target.value as ShellType)}
                style={{ fontSize: 11, padding: '2px 6px' }}
              >
                <option value="cmd">cmd</option>
                <option value="powershell">PowerShell</option>
                <option value="gitbash">Git Bash</option>
                {customShells.map((cs) => (
                  <option key={cs.id} value={cs.id}>{cs.name}</option>
                ))}
              </select>
            </div>
            <div className="terminal-settings-divider" />
            <div className="terminal-settings-row">
              <span className="terminal-settings-label">Custom shells:</span>
            </div>
            {customShells.map((cs) => (
              <div key={cs.id} className="terminal-settings-row" style={{ paddingLeft: 12 }}>
                <span style={{ flex: 1, fontSize: 12 }}>{cs.name} ({cs.program} {cs.args})</span>
                <button className="terminal-tab-close" onClick={() => removeCustomShell(cs.id)}><X size={11} /></button>
              </div>
            ))}
            <div className="terminal-settings-row" style={{ gap: 4, flexWrap: 'wrap' }}>
              <input className="dialog-input" style={{ width: 80, fontSize: 11, padding: '3px 6px' }} placeholder="Name" value={newShellName} onChange={e => setNewShellName(e.target.value)} />
              <input className="dialog-input" style={{ width: 120, fontSize: 11, padding: '3px 6px' }} placeholder="Program (e.g. wsl)" value={newShellProg} onChange={e => setNewShellProg(e.target.value)} />
              <input className="dialog-input" style={{ width: 100, fontSize: 11, padding: '3px 6px' }} placeholder="Args" value={newShellArgs} onChange={e => setNewShellArgs(e.target.value)} />
              <button className="toolbar-btn" onClick={() => {
                if (newShellProg.trim()) {
                  addCustomShell({ id: `custom-${Date.now()}`, name: newShellName.trim() || newShellProg.trim(), program: newShellProg.trim(), args: newShellArgs.trim() });
                  setNewShellName(''); setNewShellProg(''); setNewShellArgs('');
                }
              }}><Plus size={12} /></button>
            </div>
          </div>
        )}

        <div className="terminal-xterm" style={{ position: 'relative' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => { termContainers.current[tab.id] = el; }}
              className="terminal-xterm-instance"
              style={{ display: tab.id === activeTab ? 'block' : 'none' }}
              onClick={() => xtermRefs.current[tab.id]?.focus()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
