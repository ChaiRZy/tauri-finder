import { create } from 'zustand';

export interface AppTab {
  id: string;
  type: 'files' | 'terminal';
  title: string;
  icon?: string;
  /** For files type - the current directory path */
  currentDir?: string;
  /** For plugins tab */
  pluginId?: string;
  /** Prevent closing */
  pinned?: boolean;
}

let _tabId = 1;
function nextTabId() { return `app-tab-${_tabId++}`; }

interface AppTabsState {
  tabs: AppTab[];
  activeTabId: string;
  addTab: (type: AppTab['type'], config?: { title?: string; currentDir?: string; pluginId?: string }) => string;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabDir: (id: string, dir: string) => void;
  updateTab: (id: string, patch: Partial<AppTab>) => void;
  /** Find the first tab of a given type */
  findTab: (type: AppTab['type']) => AppTab | undefined;
}

export const useAppTabsStore = create<AppTabsState>((set, get) => {
  const homeTab: AppTab = {
    id: nextTabId(),
    type: 'files',
    title: 'Home',
    currentDir: '',
    pinned: true,
  };

  return {
    tabs: [homeTab],
    activeTabId: homeTab.id,

    addTab: (type, config) => {
      const id = nextTabId();
      const title = config?.title || (type === 'terminal' ? 'Terminal' : 'Files');
      const tab: AppTab = {
        id,
        type,
        title,
        currentDir: type === 'files' ? (config?.currentDir || '') : undefined,
        pluginId: config?.pluginId,
      };
      set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }));
      return id;
    },

    closeTab: (id) => {
      const { tabs, activeTabId } = get();
      const tab = tabs.find((t) => t.id === id);
      if (!tab || tab.pinned) return;
      if (tabs.length <= 1) return;
      const idx = tabs.findIndex((t) => t.id === id);
      const next = tabs.filter((t) => t.id !== id);
      let newActiveId = activeTabId;
      if (activeTabId === id) {
        const newIdx = Math.min(idx, next.length - 1);
        newActiveId = next[newIdx].id;
      }
      set({ tabs: next, activeTabId: newActiveId });
    },

    switchTab: (id) => {
      set({ activeTabId: id });
    },

    setTabTitle: (id, title) => {
      set((s) => ({
        tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
      }));
    },

    setTabDir: (id, dir) => {
      set((s) => ({
        tabs: s.tabs.map((t) => (t.id === id ? { ...t, currentDir: dir, title: dir.split(/[/\\]/).filter(Boolean).pop() || dir } : t)),
      }));
    },

    updateTab: (id, patch) => {
      set((s) => ({
        tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
    },

    findTab: (type) => {
      return get().tabs.find((t) => t.type === type);
    },
  };
});
