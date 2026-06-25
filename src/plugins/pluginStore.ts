import { create } from 'zustand';
import { getAllPlugins, getPlugin } from './registry';
import type { PluginPosition } from './types';

const SIZES_KEY = 'finder-plugin-sizes';
const VISIBLE_KEY = 'finder-plugin-visible';
const ACTIVE_TAB_KEY = 'finder-plugin-active-tab';
const DISABLED_KEY = 'finder-plugin-disabled';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function loadSizes(): Record<string, number> { return loadJson(SIZES_KEY, {}); }
function saveSizes(sizes: Record<string, number>) { localStorage.setItem(SIZES_KEY, JSON.stringify(sizes)); }

function loadVisible(): Record<string, boolean> { return loadJson(VISIBLE_KEY, {}); }
function saveVisible(visible: Record<string, boolean>) { localStorage.setItem(VISIBLE_KEY, JSON.stringify(visible)); }

function loadActiveTab(): Record<PluginPosition, string> {
  return loadJson(ACTIVE_TAB_KEY, {} as Record<PluginPosition, string>);
}
function saveActiveTab(tab: Record<PluginPosition, string>) {
  localStorage.setItem(ACTIVE_TAB_KEY, JSON.stringify(tab));
}

function loadDisabled(): Set<string> {
  return new Set(loadJson<string[]>(DISABLED_KEY, []));
}
function saveDisabled(disabled: Set<string>) {
  localStorage.setItem(DISABLED_KEY, JSON.stringify(Array.from(disabled)));
}

function buildDefaults() {
  const storedSizes = loadSizes();
  const storedVisible = loadVisible();
  const storedActiveTab = loadActiveTab();
  const plugins = getAllPlugins();
  const sizes: Record<string, number> = { ...storedSizes };
  const visible: Record<string, boolean> = { ...storedVisible };
  const activeTab: Record<PluginPosition, string> = { ...storedActiveTab };
  for (const p of plugins) {
    if (!(p.id in sizes) && p.defaultSize != null) {
      sizes[p.id] = p.defaultSize;
    }
    if (!(p.id in visible)) {
      visible[p.id] = p.defaultVisible ?? false;
    }
  }
  for (const p of plugins) {
    if (!activeTab[p.position]) {
      activeTab[p.position] = p.id;
    }
  }
  return { sizes, visible, activeTab };
}

interface PluginLayoutState {
  sizes: Record<string, number>;
  visible: Record<string, boolean>;
  /** 每个位置当前激活的插件 ID */
  activeTab: Record<PluginPosition, string>;
  /** 被禁用的插件 ID 集合 */
  disabled: Set<string>;

  togglePlugin: (id: string) => void;
  setPluginSize: (id: string, size: number) => void;
  hidePlugin: (id: string) => void;
  showPlugin: (id: string) => void;
  /** 切换某个位置的激活标签 */
  setActiveTab: (position: PluginPosition, pluginId: string) => void;
  /** 获取某个位置所有可见插件（用于多标签渲染） */
  getActivePluginsByPosition: (position: PluginPosition) => string[];
  /** 刷新当前插件列表（当注册表变化时调用） */
  refreshDefaults: () => void;
  /** 启用/禁用某个插件 */
  setPluginDisabled: (id: string, disabled: boolean) => void;
  /** 检查插件是否可用 */
  isPluginEnabled: (id: string) => boolean;
  /** 获取启用状态的插件列表 */
  getEnabledPlugins: () => string[];
}

export const usePluginStore = create<PluginLayoutState>((set, get) => {
  const defaults = buildDefaults();
  return {
    sizes: defaults.sizes,
    visible: defaults.visible,
    activeTab: defaults.activeTab,
    disabled: loadDisabled(),

    togglePlugin: (id) =>
      set((state) => {
        const def = getPlugin(id);
        const nextVisible = { ...state.visible, [id]: !state.visible[id] };
        const nextActiveTab = { ...state.activeTab };
        if (nextVisible[id] && def) {
          nextActiveTab[def.position] = id;
          def.onActivate?.();
        } else if (def) {
          def.onDeactivate?.();
        }
        saveVisible(nextVisible);
        saveActiveTab(nextActiveTab);
        return { visible: nextVisible, activeTab: nextActiveTab };
      }),

    setPluginSize: (id, size) =>
      set((state) => {
        const next = { ...state.sizes, [id]: size };
        saveSizes(next);
        const def = getPlugin(id);
        def?.onResize?.(size);
        return { sizes: next };
      }),

    hidePlugin: (id) =>
      set((state) => {
        const def = getPlugin(id);
        def?.onDeactivate?.();
        const next = { ...state.visible, [id]: false };
        saveVisible(next);
        return { visible: next };
      }),

    showPlugin: (id) =>
      set((state) => {
        const def = getPlugin(id);
        const nextVisible = { ...state.visible, [id]: true };
        const nextActiveTab = { ...state.activeTab };
        if (def) {
          nextActiveTab[def.position] = id;
          def.onActivate?.();
        }
        saveVisible(nextVisible);
        saveActiveTab(nextActiveTab);
        return { visible: nextVisible, activeTab: nextActiveTab };
      }),

    setActiveTab: (position, pluginId) =>
      set((state) => {
        const prevId = state.activeTab[position];
        const prevDef = prevId ? getPlugin(prevId) : undefined;
        const nextDef = getPlugin(pluginId);
        prevDef?.onDeactivate?.();
        nextDef?.onActivate?.();
        const next = { ...state.activeTab, [position]: pluginId };
        saveActiveTab(next);
        return { activeTab: next };
      }),

    getActivePluginsByPosition: (position) => {
      const state = get();
      const plugins = getAllPlugins().filter((p) => p.position === position && !state.disabled.has(p.id));
      const activeId = state.activeTab[position];
      if (activeId && state.visible[activeId] && plugins.some((p) => p.id === activeId)) {
        return [activeId];
      }
      const visiblePlugin = plugins.find((p) => state.visible[p.id]);
      return visiblePlugin ? [visiblePlugin.id] : [];
    },

    refreshDefaults: () => {
      const fresh = buildDefaults();
      set({ sizes: fresh.sizes, visible: fresh.visible, activeTab: fresh.activeTab });
    },

    setPluginDisabled: (id, disabled) =>
      set((state) => {
        const next = new Set(state.disabled);
        if (disabled) {
          next.add(id);
          // 禁用时自动隐藏
          const visible = { ...state.visible, [id]: false };
          saveVisible(visible);
          const def = getPlugin(id);
          def?.onDeactivate?.();
          saveDisabled(next);
          return { disabled: next, visible };
        }
        next.delete(id);
        saveDisabled(next);
        return { disabled: next };
      }),

    isPluginEnabled: (id) => {
      return !get().disabled.has(id);
    },

    getEnabledPlugins: () => {
      const state = get();
      return getAllPlugins().filter((p) => !state.disabled.has(p.id)).map((p) => p.id);
    },
  };
});
