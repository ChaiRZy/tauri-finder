import { create } from 'zustand';
import type { ViewMode, ClipboardState, ContextMenuState, DialogState, FileEntry, ContextMenuConfig, ContextMenuItemId, ShellType, QuickCommand } from '../types/file';
import { DEFAULT_CONTEXT_MENU_CONFIG, DEFAULT_SHELL } from '../types/file';

const MENU_CONFIG_KEY = 'finder-context-menu-config';
const QUICK_COMMANDS_KEY = 'finder-quick-commands';
const SHELL_TYPE_KEY = 'finder-shell-type';

function loadMenuConfig(): ContextMenuConfig {
  try {
    const raw = localStorage.getItem(MENU_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CONTEXT_MENU_CONFIG;
}

function saveMenuConfig(config: ContextMenuConfig) {
  localStorage.setItem(MENU_CONFIG_KEY, JSON.stringify(config));
}

function loadQuickCommands(): QuickCommand[] {
  try {
    const raw = localStorage.getItem(QUICK_COMMANDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveQuickCommands(commands: QuickCommand[]) {
  localStorage.setItem(QUICK_COMMANDS_KEY, JSON.stringify(commands));
}

function loadShellType(): ShellType {
  try {
    const raw = localStorage.getItem(SHELL_TYPE_KEY);
    if (raw) return raw as ShellType;
  } catch {}
  return DEFAULT_SHELL;
}

function saveShellType(type: ShellType) {
  localStorage.setItem(SHELL_TYPE_KEY, type);
}

interface UiStore {
  viewMode: ViewMode;
  selectedPaths: Set<string>;
  clipboard: ClipboardState;
  contextMenu: ContextMenuState | null;
  dialog: DialogState | null;
  searchQuery: string;
  showSearchBar: boolean;
  showPreview: boolean;
  contextMenuConfig: ContextMenuConfig;

  setViewMode: (mode: ViewMode) => void;
  toggleSelection: (path: string) => void;
  selectRange: (paths: string[]) => void;
  clearSelection: () => void;
  selectAll: (entries: FileEntry[]) => void;
  setClipboard: (mode: 'copy' | 'cut', sources: string[]) => void;
  clearClipboard: () => void;
  showContextMenu: (x: number, y: number, entries: FileEntry[]) => void;
  hideContextMenu: () => void;
  openDialog: (dialog: DialogState) => void;
  closeDialog: () => void;
  setSearchQuery: (query: string) => void;
  toggleSearchBar: () => void;
  togglePreview: () => void;
  toggleContextMenuItem: (id: ContextMenuItemId) => void;
  showTerminal: boolean;
  toggleTerminal: () => void;
  shellType: ShellType;
  setShellType: (type: ShellType) => void;
  quickCommands: QuickCommand[];
  addQuickCommand: (cmd: QuickCommand) => void;
  removeQuickCommand: (id: string) => void;
  terminalCommand: string | null;
  runInTerminal: (cmd: string) => void;
  clearTerminalCommand: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  viewMode: 'list',
  selectedPaths: new Set(),
  clipboard: { mode: null, sources: [] },
  contextMenu: null,
  dialog: null,
  searchQuery: '',
  showSearchBar: true,
  showPreview: false,
  contextMenuConfig: loadMenuConfig(),
  showTerminal: false,
  shellType: loadShellType(),
  quickCommands: loadQuickCommands(),
  terminalCommand: null,

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleSelection: (path) =>
    set((state) => {
      const next = new Set(state.selectedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { selectedPaths: next };
    }),

  selectRange: (paths) => set({ selectedPaths: new Set(paths) }),

  clearSelection: () => set({ selectedPaths: new Set() }),

  selectAll: (entries) => set({ selectedPaths: new Set(entries.map(e => e.path)) }),

  setClipboard: (mode, sources) => set({ clipboard: { mode, sources } }),

  clearClipboard: () => set({ clipboard: { mode: null, sources: [] } }),

  showContextMenu: (x, y, entries) => set({ contextMenu: { x, y, entries } }),

  hideContextMenu: () => set({ contextMenu: null }),

  openDialog: (dialog) => set({ dialog }),

  closeDialog: () => set({ dialog: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSearchBar: () => set((state) => ({ showSearchBar: !state.showSearchBar })),

  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),

  toggleContextMenuItem: (id) => set((state) => {
    const next = {
      items: { ...state.contextMenuConfig.items, [id]: !state.contextMenuConfig.items[id] },
    };
    saveMenuConfig(next);
    return { contextMenuConfig: next };
  }),

  toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),

  setShellType: (type) => {
    saveShellType(type);
    set({ shellType: type });
  },

  addQuickCommand: (cmd) => set((state) => {
    const next = [...state.quickCommands, cmd];
    saveQuickCommands(next);
    return { quickCommands: next };
  }),

  removeQuickCommand: (id) => set((state) => {
    const next = state.quickCommands.filter(c => c.id !== id);
    saveQuickCommands(next);
    return { quickCommands: next };
  }),

  runInTerminal: (cmd) => set({ terminalCommand: cmd, showTerminal: true }),

  clearTerminalCommand: () => set({ terminalCommand: null }),
}));
