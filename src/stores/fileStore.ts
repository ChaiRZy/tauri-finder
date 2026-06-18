import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { FileEntry, SortBy, SortOrder } from '../types/file';

export interface ColumnData {
  path: string;
  entries: FileEntry[];
}

export type GroupBy = 'none' | 'type';

export interface BrowserTab {
  id: string;
  label: string;
  currentDir: string;
  entries: FileEntry[];
  history: string[];
  historyIndex: number;
  columns: ColumnData[];
}

let _tabId = 1;
function nextTabId() { return `b-tab-${_tabId++}`; }

function makeTab(): BrowserTab {
  return {
    id: nextTabId(),
    label: 'Home',
    currentDir: '',
    entries: [],
    history: [],
    historyIndex: -1,
    columns: [],
  };
}

interface FileStore {
  /* ── Active tab data (flat fields for backward compatibility) ── */
  currentDir: string;
  entries: FileEntry[];
  history: string[];
  historyIndex: number;
  columns: ColumnData[];
  loading: boolean;
  error: string | null;

  /* ── Tab system ── */
  tabs: BrowserTab[];
  activeTabId: string;
  addTab: (path: string) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;

  /* ── Sort / group ── */
  sortBy: SortBy;
  sortOrder: SortOrder;
  groupBy: GroupBy;

  /* ── Navigation ── */
  navigateTo: (path: string) => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  goUp: () => void;
  refresh: () => Promise<void>;
  setSortBy: (field: SortBy) => void;
  toggleSortOrder: () => void;
  toggleGroupBy: () => void;
  navigateColumn: (path: string, fromIndex?: number) => Promise<void>;
  goBackColumn: () => void;
  resetColumns: (path: string, entries: FileEntry[]) => void;
}

function updateTabInList(tabs: BrowserTab[], id: string, patch: Partial<BrowserTab>): BrowserTab[] {
  return tabs.map(t => t.id === id ? { ...t, ...patch } : t);
}

function mergeTabData(tab: BrowserTab) {
  return {
    currentDir: tab.currentDir,
    entries: tab.entries,
    history: tab.history,
    historyIndex: tab.historyIndex,
    columns: tab.columns,
  };
}

export const useFileStore = create<FileStore>((set, get) => {
  const initialTab = makeTab();

  return {
    currentDir: initialTab.currentDir,
    entries: initialTab.entries,
    history: initialTab.history,
    historyIndex: initialTab.historyIndex,
    columns: initialTab.columns,
    tabs: [initialTab],
    activeTabId: initialTab.id,
    sortBy: 'name' as SortBy,
    sortOrder: 'asc' as SortOrder,
    groupBy: 'none' as GroupBy,
    loading: false,
    error: null,

    addTab: (path: string) => {
      const { tabs } = get();
      const id = nextTabId();
      const label = path.split(/[/\\]/).filter(Boolean).pop() || path;
      const newTab = { ...makeTab(), id, label, currentDir: path };
      set({ tabs: [...tabs, newTab], activeTabId: id });
      // load the new tab's data
      get().navigateTo(path);
    },

    closeTab: (id: string) => {
      const { tabs, activeTabId } = get();
      if (tabs.length <= 1) return;
      const idx = tabs.findIndex(t => t.id === id);
      const next = tabs.filter(t => t.id !== id);
      let newActiveId = activeTabId;
      if (activeTabId === id) {
        const newIdx = Math.min(idx, next.length - 1);
        newActiveId = next[newIdx].id;
      }
      const newActive = next.find(t => t.id === newActiveId) || next[0];
      set({
        tabs: next,
        activeTabId: newActiveId,
        ...mergeTabData(newActive),
      });
    },

    switchTab: (id: string) => {
      const { tabs } = get();
      // Save current tab state
      const currentTab = tabs.find(t => t.id === get().activeTabId);
      const updatedTabs = currentTab ? updateTabInList(tabs, currentTab.id, {
        currentDir: get().currentDir,
        entries: get().entries,
        history: get().history,
        historyIndex: get().historyIndex,
        columns: get().columns,
      }) : tabs;
      const target = updatedTabs.find(t => t.id === id);
      if (!target) return;
      set({
        tabs: updatedTabs,
        activeTabId: id,
        ...mergeTabData(target),
      });
    },

    navigateTo: async (path: string) => {
      set({ loading: true, error: null });
      try {
        const entries: FileEntry[] = await invoke('list_directory', { path });
        const { tabs, activeTabId, sortBy, sortOrder } = get();
        const tab = tabs.find(t => t.id === activeTabId);
        if (!tab) { set({ loading: false }); return; }
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(path);
        const sorted = sortEntries(entries, sortBy, sortOrder);
        const label = path.split(/[/\\]/).filter(Boolean).pop() || path;
        const updated = updateTabInList(tabs, activeTabId, {
          currentDir: path,
          entries: sorted,
          columns: [{ path, entries: sorted }],
          history: newHistory,
          historyIndex: newHistory.length - 1,
          label,
        });
        set({
          tabs: updated,
          currentDir: path,
          entries: sorted,
          columns: [{ path, entries: sorted }],
          history: newHistory,
          historyIndex: newHistory.length - 1,
          loading: false,
        });
      } catch (e) {
        set({ loading: false, error: String(e) });
      }
    },

    goBack: () => {
      const { historyIndex, history } = get();
      if (historyIndex > 0) {
        get().navigateTo(history[historyIndex - 1]);
      }
    },

    goForward: () => {
      const { historyIndex, history } = get();
      if (historyIndex < history.length - 1) {
        get().navigateTo(history[historyIndex + 1]);
      }
    },

    goUp: () => {
      const { currentDir } = get();
      if (!currentDir) return;
      const parts = currentDir.replace(/\\/g, '/').replace(/\/$/, '').split('/');
      if (parts.length <= 2) return;
      parts.pop();
      get().navigateTo(parts.join('/'));
    },

    refresh: async () => {
      const { currentDir, columns, sortBy, sortOrder, tabs, activeTabId } = get();
      if (!currentDir) return;
      if (columns.length > 1) {
        const refreshed = await Promise.all(
          columns.map(async (col) => {
            try {
              const entries: FileEntry[] = await invoke('list_directory', { path: col.path });
              return { path: col.path, entries: sortEntries(entries, sortBy, sortOrder) };
            } catch { return col; }
          })
        );
        const last = refreshed[refreshed.length - 1];
        const updated = updateTabInList(tabs, activeTabId, {
          columns: refreshed, currentDir: last.path, entries: last.entries,
        });
        set({ tabs: updated, columns: refreshed, currentDir: last.path, entries: last.entries });
      } else {
        await get().navigateTo(currentDir);
      }
    },

    setSortBy: (field: SortBy) => {
      const { entries, sortBy, sortOrder, columns, tabs, activeTabId } = get();
      const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
      const sorted = sortEntries(entries, field, newOrder);
      const newColumns = columns.map(c => ({ ...c, entries: sortEntries(c.entries, field, newOrder) }));
      const updated = updateTabInList(tabs, activeTabId, { entries: sorted, columns: newColumns });
      set({ sortBy: field, sortOrder: newOrder, entries: sorted, columns: newColumns, tabs: updated });
    },

    toggleSortOrder: () => {
      const { entries, sortBy, sortOrder, columns, tabs, activeTabId } = get();
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      const sorted = sortEntries(entries, sortBy, newOrder);
      const newColumns = columns.map(c => ({ ...c, entries: sortEntries(c.entries, sortBy, newOrder) }));
      const updated = updateTabInList(tabs, activeTabId, { entries: sorted, columns: newColumns });
      set({ sortOrder: newOrder, entries: sorted, columns: newColumns, tabs: updated });
    },

    toggleGroupBy: () => set((state) => ({ groupBy: state.groupBy === 'none' ? 'type' : 'none' })),

    navigateColumn: async (path: string, fromIndex?: number) => {
      const { sortBy, sortOrder, columns, tabs, activeTabId } = get();
      try {
        const entries: FileEntry[] = await invoke('list_directory', { path });
        const sorted = sortEntries(entries, sortBy, sortOrder);
        const base = fromIndex !== undefined ? columns.slice(0, fromIndex + 1) : columns;
        const next = [...base, { path, entries: sorted }];
        const updated = updateTabInList(tabs, activeTabId, { currentDir: path, entries: sorted, columns: next });
        set({ currentDir: path, entries: sorted, columns: next, tabs: updated });
      } catch {}
    },

    goBackColumn: () => {
      const { columns, tabs, activeTabId } = get();
      if (columns.length <= 1) { get().goBack(); return; }
      const prev = columns[columns.length - 2];
      const updated = updateTabInList(tabs, activeTabId, {
        columns: columns.slice(0, -1), currentDir: prev.path, entries: prev.entries,
      });
      set({ columns: columns.slice(0, -1), currentDir: prev.path, entries: prev.entries, tabs: updated });
    },

    resetColumns: (path, entries) => {
      const { tabs, activeTabId } = get();
      const updated = updateTabInList(tabs, activeTabId, { columns: [{ path, entries }] });
      set({ columns: [{ path, entries }], tabs: updated });
    },
  };
});

function sortEntries(entries: FileEntry[], by: SortBy, order: SortOrder): FileEntry[] {
  const dirs = entries.filter(e => e.is_dir);
  const files = entries.filter(e => !e.is_dir);
  const sortList = (list: FileEntry[]) => {
    list.sort((a, b) => {
      let cmp = 0;
      if (by === 'name') cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      else if (by === 'size') cmp = a.size - b.size;
      else if (by === 'modified_at') cmp = a.modified_at.localeCompare(b.modified_at);
      return order === 'asc' ? cmp : -cmp;
    });
  };
  sortList(dirs);
  sortList(files);
  return [...dirs, ...files];
}
