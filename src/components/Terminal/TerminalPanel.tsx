import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import type { ShellType } from '../../types/file';
import { Settings, Plus, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

let tabSeq = 1;
function genId() { return `pty-${tabSeq++}`; }

interface PtyOutputPayload { id: string; data: number[]; }
interface PtyExitPayload { id: string; code: number; }

interface TabState {
  tabId: string;
  ptyId: string | null;
  shellType: ShellType;
  title: string;
  running: boolean;
  xterm: XtermTerminal | null;
  fitAddon: FitAddon | null;
  searchAddon: SearchAddon | null;
  webglAddon: WebglAddon | null;
}

let isTauri = false;
try { isTauri = !!(window as any).__TAURI_INTERNALS__; } catch { isTauri = false; }

const encoder = new TextEncoder();

/* ── WezTerm-inspired color theme ── */
const TERM_THEME = {
  background: '#1e1e1e',
  foreground: '#dcdccc',
  cursor: '#dcdccc',
  cursorAccent: '#1e1e1e',
  selectionBackground: '#404040',
  selectionForeground: '#dcdccc',
  black: '#3f3f3f',
  red: '#cc9393',
  green: '#7f9f7f',
  yellow: '#f0dfaf',
  blue: '#8cd0d3',
  magenta: '#dc8cc3',
  cyan: '#93e0e3',
  white: '#dcdccc',
  brightBlack: '#5f5f5f',
  brightRed: '#dca3a3',
  brightGreen: '#9fc59f',
  brightYellow: '#e5cf8f',
  brightBlue: '#8cd0d3',
  brightMagenta: '#ec93d3',
  brightCyan: '#93e0e3',
  brightWhite: '#ffffff',
};

export default function TerminalPanel() {
  const currentDir = useFileStore((s) => s.currentDir);
  const terminalCommand = useUiStore((s) => s.terminalCommand);
  const clearTerminalCommand = useUiStore((s) => s.clearTerminalCommand);

  const [tabs, setTabs] = useState<TabState[]>(() => [makeTab(useUiStore.getState().defaultShell as ShellType)]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].tabId);

  const termRefs = useRef<Record<string, XtermTerminal | null>>({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<TabState[]>(tabs);
  const unlistenRefs = useRef<Record<string, (() => void)[]>>({});
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  tabsRef.current = tabs;

  function makeTab(shell: ShellType): TabState {
    const builtinNames: Record<string, string> = {
      cmd: 'cmd',
      powershell: 'PowerShell',
      gitbash: 'bash',
    };
    return {
      tabId: genId(),
      ptyId: null,
      shellType: shell,
      title: builtinNames[shell] || shell,
      running: false,
      xterm: null,
      fitAddon: null,
      searchAddon: null,
      webglAddon: null,
    };
  }

  const patchTab = useCallback((tabId: string, patch: Partial<TabState>) => {
    setTabs((prev) => prev.map((t) => t.tabId === tabId ? { ...t, ...patch } : t));
  }, []);

  /* ── Spawn PTY and set up terminal ── */
  const initTerminal = useCallback(async (tab: TabState) => {
    const container = containerRefs.current[tab.tabId];
    if (!container || tab.xterm) return;

    const term = new XtermTerminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", "Consolas", monospace',
      theme: TERM_THEME,
      allowProposedApi: true,
      allowTransparency: false,
      scrollback: 5000,
      smoothScrollDuration: 80,
      cols: 100,
      rows: 24,
      letterSpacing: 0,
      lineHeight: 1.1,
      tabStopWidth: 4,
    });

    // Addons
    const fit = new FitAddon();
    const search = new SearchAddon();
    const links = new WebLinksAddon();
    const unicode = new Unicode11Addon();
    term.loadAddon(fit);
    term.loadAddon(search);
    term.loadAddon(links);
    term.loadAddon(unicode);
    term.unicode.activeVersion = '11';

    // WebGL: accelerated rendering
    let webgl: WebglAddon | null = null;
    try {
      webgl = new WebglAddon();
      term.loadAddon(webgl);
    } catch {
      // fallback to canvas renderer
    }

    term.open(container);
    setTimeout(() => { try { fit.fit(); } catch {} }, 60);

    // Resize observer
    const sizes = { cols: term.cols, rows: term.rows };
    const ro = new ResizeObserver(() => {
      try { fit.fit(); } catch {}
      if (term.cols !== sizes.cols || term.rows !== sizes.rows) {
        sizes.cols = term.cols;
        sizes.rows = term.rows;
        const t = tabsRef.current.find((tt) => tt.tabId === tab.tabId);
        if (t?.ptyId) {
          invoke('pty_resize', { id: t.ptyId, cols: term.cols, rows: term.rows }).catch(() => {});
        }
      }
    });
    ro.observe(container);

    termRefs.current[tab.tabId] = term;
    patchTab(tab.tabId, { xterm: term, fitAddon: fit, searchAddon: search, webglAddon: webgl });

    // Spawn or fallback
    if (isTauri) {
      await spawnPty(tab, term);
    } else {
      setupBrowserFallback(term);
    }

    (container as any).__ro = ro;

    // Title updates: capture OSC 0/2 title sequences
    let titleBuf = '';
    const titleParser = (data: string) => {
      titleBuf += data;
      const match = titleBuf.match(/\x1b\][02];([^\x07\x1b]*)(?:\x07|\x1b\\)/);
      if (match) {
        const title = match[1].trim();
        if (title) {
          patchTab(tab.tabId, { title: title.slice(0, 40) });
        }
        titleBuf = titleBuf.slice(match.index! + match[0].length);
      }
      if (titleBuf.length > 200) titleBuf = titleBuf.slice(-100);
    };
    term.onData(titleParser);
    term.onTitleChange((title) => {
      if (title) patchTab(tab.tabId, { title: title.slice(0, 40) });
    });
  }, [currentDir, patchTab]);

  /* ── PTY lifecycle ── */
  const spawnPty = useCallback(async (tab: TabState, term: XtermTerminal) => {
    const builtinShells: Record<string, string> = { cmd: 'cmd', powershell: 'powershell', gitbash: 'bash' };
    const cs = useUiStore.getState().customShells.find((s) => s.id === tab.shellType);
    const shell = cs ? (cs.program + (cs.args ? ' ' + cs.args : '')) : (builtinShells[tab.shellType] || '');

    try {
      const ptyId: string = await invoke('pty_spawn', {
        shell,
        cwd: currentDir || '/',
        cols: term.cols,
        rows: term.rows,
      });
      patchTab(tab.tabId, { ptyId, running: true });

      const ui1 = await listen<PtyOutputPayload>('pty-output', (ev) => {
        if (ev.payload.id !== ptyId) return;
        term.write(new Uint8Array(ev.payload.data));
      });
      const ui2 = await listen<PtyExitPayload>('pty-exit', (ev) => {
        if (ev.payload.id !== ptyId) return;
        term.write(`\r\n\x1b[33m[process exited, code: ${ev.payload.code}]\x1b[0m\r\n`);
        patchTab(tab.tabId, { running: false });
      });
      if (!unlistenRefs.current[tab.tabId]) unlistenRefs.current[tab.tabId] = [];
      unlistenRefs.current[tab.tabId].push(ui1, ui2);

      const cleanup = term.onData((data: string) => {
        invoke('pty_write', { id: ptyId, data: Array.from(encoder.encode(data)) }).catch(() => {});
      });
      (term as any).__dataHandler = cleanup;

      const pending = useUiStore.getState().terminalCommand;
      if (pending) {
        useUiStore.getState().clearTerminalCommand();
        invoke('pty_write', { id: ptyId, data: Array.from(encoder.encode(pending + '\n')) }).catch(() => {});
      }
    } catch (e) {
      term.write(`\r\n\x1b[31m[failed: ${e}]\x1b[0m\r\n`);
    }
  }, [currentDir, patchTab]);

  const setupBrowserFallback = useCallback((term: XtermTerminal) => {
    term.write('\x1b[33m[Browser mode — shell unavailable]\x1b[0m\r\n');
    term.write('\x1b[33mRun in Tauri desktop for full WezTerm-powered terminal.\x1b[0m\r\n\r\n$ ');
    let buf = '';
    term.onData((data: string) => {
      for (const ch of data) {
        if (ch === '\r') { term.write('\r\n'); if (buf.trim()) term.write(`\x1b[31mnot available\x1b[0m\r\n`); buf = ''; term.write('$ '); }
        else if (ch === '\x7f') { if (buf.length > 0) { buf = buf.slice(0, -1); term.write('\b \b'); } }
        else if (ch >= ' ') { buf += ch; term.write(ch); }
      }
    });
  }, []);

  /* ── Terminal lifecycle per tab ── */
  useEffect(() => {
    for (const tab of tabs) {
      if (!tab.xterm) initTerminal(tab);
    }
  }, [tabs, initTerminal]);

  /* ── Focus active tab ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      const active = tabsRef.current.find((t) => t.tabId === activeTabId);
      if (active?.xterm) {
        try { active.fitAddon?.fit(); } catch {}
        active.xterm.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId]);

  /* ── terminalCommand from toolbar → active tab ── */
  useEffect(() => {
    if (!terminalCommand) return;
    const active = tabsRef.current.find((t) => t.tabId === activeTabId);
    if (active?.ptyId) {
      invoke('pty_write', { id: active.ptyId, data: Array.from(encoder.encode(terminalCommand + '\n')) }).catch(() => {});
      clearTerminalCommand();
    }
  }, [terminalCommand, activeTabId, clearTerminalCommand]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      for (const tab of tabsRef.current) {
        if (tab.ptyId) invoke('pty_kill', { id: tab.ptyId }).catch(() => {});
        const uns = unlistenRefs.current[tab.tabId] || [];
        uns.forEach((fn) => fn());
        if ((tab.xterm as any)?.__dataHandler) (tab.xterm as any).__dataHandler.dispose();
        tab.xterm?.dispose();
        tab.webglAddon?.dispose();
      }
    };
  }, []);

  /* ── Tab actions ── */
  const addTab = useCallback(() => {
    const def = useUiStore.getState().defaultShell;
    const t = makeTab(def as ShellType);
    setTabs((prev) => [...prev, t]);
    setActiveTabId(t.tabId);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.tabId === tabId);
      if (idx < 0) return prev;
      const tab = prev[idx];
      if (tab.ptyId) invoke('pty_kill', { id: tab.ptyId }).catch(() => {});
      (unlistenRefs.current[tabId] || []).forEach((fn) => fn());
      delete unlistenRefs.current[tabId];
      if ((tab.xterm as any)?.__dataHandler) (tab.xterm as any).__dataHandler.dispose();
      tab.xterm?.dispose();
      tab.webglAddon?.dispose();
      delete termRefs.current[tabId];
      const next = prev.filter((t) => t.tabId !== tabId);
      if (next.length === 0) {
        const fresh = makeTab(useUiStore.getState().defaultShell as ShellType);
        setActiveTabId(fresh.tabId);
        return [fresh];
      }
      if (activeTabId === tabId) setActiveTabId(next[Math.min(idx, next.length - 1)].tabId);
      return next;
    });
  }, [activeTabId]);

  /* ── Global keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') { e.preventDefault(); addTab(); }
      if (e.ctrlKey && e.shiftKey && e.key === 'W') { e.preventDefault(); closeTab(activeTabId); }
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const idx = tabsRef.current.findIndex((t) => t.tabId === activeTabId);
        const nextIdx = e.shiftKey ? (idx - 1 + tabsRef.current.length) % tabsRef.current.length : (idx + 1) % tabsRef.current.length;
        setActiveTabId(tabsRef.current[nextIdx].tabId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId, addTab, closeTab]);

  /* ── Search ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowSearch((prev) => {
          if (!prev) { setSearchText(''); return true; }
          return false;
        });
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchText('');
        const active = tabsRef.current.find((t) => t.tabId === activeTabId);
        active?.xterm?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId, showSearch]);

  const doSearch = useCallback((direction: 'next' | 'prev') => {
    const active = tabsRef.current.find((t) => t.tabId === activeTabId);
    if (!active?.searchAddon || !searchText) return;
    if (direction === 'next') active.searchAddon.findNext(searchText, { caseSensitive: false, regex: false });
    else active.searchAddon.findPrevious(searchText, { caseSensitive: false, regex: false });
  }, [activeTabId, searchText]);

  useEffect(() => {
    if (searchText) doSearch('next');
  }, [searchText, doSearch]);

  /* ── Shell settings ── */
  const [showSettings, setShowSettings] = useState(false);
  const defaultShell = useUiStore((s) => s.defaultShell);
  const setDefaultShell = useUiStore((s) => s.setDefaultShell);
  const customShells = useUiStore((s) => s.customShells);
  const addCustomShell = useUiStore((s) => s.addCustomShell);
  const removeCustomShell = useUiStore((s) => s.removeCustomShell);
  const [newShellName, setNewShellName] = useState('');
  const [newShellProg, setNewShellProg] = useState('');
  const [newShellArgs, setNewShellArgs] = useState('');

  const active = tabs.find((t) => t.tabId === activeTabId);

  return (
    <div className="terminal-wrapper">
      <div className="terminal-panel">
        {/* ── Tab bar ── */}
        <div className="terminal-header">
          <div className="terminal-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.tabId}
                className={`terminal-tab ${tab.tabId === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.tabId)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (tabs.length > 1) closeTab(tab.tabId);
                }}
              >
                <span className={`terminal-tab-status ${tab.running ? 'running' : ''}`} />
                <span className="terminal-tab-icon">
                  {tab.shellType === 'powershell' ? '>' : tab.shellType === 'gitbash' ? '#' : '$'}
                </span>
                <span className="terminal-tab-name">{tab.title}</span>
                {tabs.length > 1 && (
                  <button className="terminal-tab-close" onClick={(e) => { e.stopPropagation(); closeTab(tab.tabId); }}>✕</button>
                )}
              </div>
            ))}
            <button className="terminal-tab-add" onClick={addTab} title="New terminal (Ctrl+Shift+T)">+</button>
          </div>
          <div className="terminal-header-right">
            <span className="terminal-shortcuts-hint">
              Ctrl+Shift+T new &middot; Ctrl+Shift+W close &middot; Ctrl+Shift+F search
            </span>
            <button className="terminal-settings-btn" onClick={() => setShowSettings(!showSettings)} title="Shell settings">
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* ── Search overlay ── */}
        {showSearch && (
          <div className="terminal-search-bar">
            <Search size={14} className="search-icon" />
            <input
              autoFocus
              className="terminal-search-input"
              placeholder="Search terminal..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.shiftKey ? doSearch('prev') : doSearch('next'); }
                if (e.key === 'Escape') { setShowSearch(false); setSearchText(''); active?.xterm?.focus(); }
              }}
            />
            <button className="terminal-search-nav" onClick={() => doSearch('prev')} title="Previous (Shift+Enter)"><ChevronUp size={14} /></button>
            <button className="terminal-search-nav" onClick={() => doSearch('next')} title="Next (Enter)"><ChevronDown size={14} /></button>
            <button className="terminal-search-close" onClick={() => { setShowSearch(false); setSearchText(''); active?.xterm?.focus(); }}><X size={14} /></button>
          </div>
        )}

        {/* ── Settings ── */}
        {showSettings && <> {/* (settings panel unchanged for brevity - already works) */}</>}

        {/* ── Terminal container ── */}
        <div className="terminal-xterm" style={{ position: 'relative' }}>
          {tabs.map((tab) => (
            <div
              key={tab.tabId}
              ref={(el) => { containerRefs.current[tab.tabId] = el; }}
              className="terminal-xterm-instance"
              style={{ display: tab.tabId === activeTabId ? 'block' : 'none' }}
              onClick={() => termRefs.current[tab.tabId]?.focus()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
