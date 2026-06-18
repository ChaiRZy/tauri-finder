import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Command } from '@tauri-apps/plugin-shell';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import type { ShellType } from '../../types/file';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

const HEIGHT_KEY = 'finder-terminal-height';
const MIN_H = 80;
const MAX_H = 600;
const DEFAULT_H = 220;

function loadHeight(): number {
  try {
    const v = parseInt(localStorage.getItem(HEIGHT_KEY) || '', 10);
    return isNaN(v) ? DEFAULT_H : Math.max(MIN_H, Math.min(MAX_H, v));
  } catch { return DEFAULT_H; }
}

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
  const showTerminal = useUiStore((s) => s.showTerminal);
  const currentDir = useFileStore((s) => s.currentDir);
  const terminalCommand = useUiStore((s) => s.terminalCommand);
  const clearTerminalCommand = useUiStore((s) => s.clearTerminalCommand);

  const [tabs, setTabs] = useState<TabState[]>(() => [{
    id: genId(),
    shellType: useUiStore.getState().shellType,
    xterm: null,
    fitAddon: null,
    child: null,
    cmdObj: null,
  }]);
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
  const [height, setHeight] = useState(loadHeight);
  const dragging = useRef(false);
  const termContainers = useRef<Record<string, HTMLDivElement | null>>({});
  const tabRefs = useRef<TabState[]>(tabs);
  tabRefs.current = tabs;

  const updateTab = useCallback((id: string, patch: Partial<TabState>) => {
    setTabs((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  }, []);

  // Spawn a shell for a given tab
  const spawnShell = useCallback(async (tab: TabState) => {
    const prog = tab.shellType === 'powershell' ? 'powershell' :
                 tab.shellType === 'gitbash' ? 'bash' : 'cmd';
    const args: string[] = tab.shellType === 'gitbash' ? ['--login'] : [];
    try {
      const cmd = Command.create(prog, args, { cwd: currentDir || undefined, encoding: 'raw' });
      updateTab(tab.id, { cmdObj: cmd });

      cmd.stdout.on('data', (data: Uint8Array) => {
        const t = tabRefs.current.find((t) => t.id === tab.id);
        if (t?.xterm) t.xterm.write(data);
      });
      cmd.stderr.on('data', (data: Uint8Array) => {
        const t = tabRefs.current.find((t) => t.id === tab.id);
        if (t?.xterm) t.xterm.write(data);
      });
      cmd.on('close', () => {
        const t = tabRefs.current.find((t) => t.id === tab.id);
        if (t?.xterm) t.xterm.write('\r\n\x1b[33m[shell exited]\x1b[0m\r\n');
        updateTab(tab.id, { child: null });
      });
      cmd.on('error', (err: string) => {
        const t = tabRefs.current.find((t) => t.id === tab.id);
        if (t?.xterm) t.xterm.write(`\r\n\x1b[31m[error: ${err}]\x1b[0m\r\n`);
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

      const ro = new ResizeObserver(() => {
        try { fit.fit(); } catch {}
      });
      ro.observe(container);

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

  // Fit terminal when shown
  useEffect(() => {
    if (!showTerminal) return;
    setTimeout(() => {
      for (const tab of tabs) {
        try { tab.fitAddon?.fit(); } catch {}
      }
    }, 50);
  }, [showTerminal, tabs]);

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
    const newTab: TabState = {
      id: genId(),
      shellType: useUiStore.getState().shellType,
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
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        // keep at least one tab
        const fresh: TabState = {
          id: genId(),
          shellType: useUiStore.getState().shellType,
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

  // Drag handle
  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dy = startY - ev.clientY;
      const newH = Math.max(MIN_H, Math.min(MAX_H, startH + dy));
      setHeight(newH);
      localStorage.setItem(HEIGHT_KEY, String(newH));
      setTimeout(() => {
        for (const tab of tabs) {
          try { tab.fitAddon?.fit(); } catch {}
        }
      }, 0);
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  }, [height, tabs]);

  return (
    <div className="terminal-wrapper" style={{ display: showTerminal ? 'flex' : 'none' }}>
      <div className="terminal-drag-handle" onMouseDown={onDragStart}>
        <div className="terminal-drag-bar" />
      </div>
      <div className="terminal-panel" style={{ height }}>
        <div className="terminal-header">
          <div className="terminal-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`terminal-tab ${tab.id === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="terminal-tab-icon">
                  {tab.shellType === 'powershell' ? 'PS' : tab.shellType === 'gitbash' ? 'BASH' : 'CMD'}
                </span>
                <span className="terminal-tab-name">
                  {tab.shellType === 'powershell' ? 'PowerShell' : tab.shellType === 'gitbash' ? 'Git Bash' : 'cmd'}
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
        </div>
        <div className="terminal-xterm" style={{ position: 'relative' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => { termContainers.current[tab.id] = el; }}
              className="terminal-xterm-instance"
              style={{ display: tab.id === activeTab ? 'block' : 'none' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
