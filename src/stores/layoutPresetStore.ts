import { create } from 'zustand';
import { usePluginStore } from '../plugins/pluginStore';

const PRESETS_KEY = 'finder-layout-presets';
const ACTIVE_PRESET_KEY = 'finder-active-preset';

export interface LayoutPreset {
  id: string;
  name: string;
  visible: Record<string, boolean>;
  sizes: Record<string, number>;
}

function loadPresets(): LayoutPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function savePresets(presets: LayoutPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function loadActivePreset(): string | null {
  return localStorage.getItem(ACTIVE_PRESET_KEY);
}

function saveActivePreset(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_PRESET_KEY, id);
  else localStorage.removeItem(ACTIVE_PRESET_KEY);
}

interface LayoutPresetStore {
  presets: LayoutPreset[];
  activePresetId: string | null;
  saveCurrentAsPreset: (name: string) => void;
  applyPreset: (id: string) => void;
  deletePreset: (id: string) => void;
}

export const useLayoutPresetStore = create<LayoutPresetStore>((set, get) => ({
  presets: loadPresets(),
  activePresetId: loadActivePreset(),

  saveCurrentAsPreset: (name) => {
    const { visible, sizes } = usePluginStore.getState();
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const newPreset: LayoutPreset = { id, name, visible: { ...visible }, sizes: { ...sizes } };
    const presets = [...get().presets.filter((p) => p.id !== id), newPreset];
    savePresets(presets);
    set({ presets, activePresetId: id });
    saveActivePreset(id);
  },

  applyPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (!preset) return;
    const { showPlugin, hidePlugin, setPluginSize } = usePluginStore.getState();

    // Apply visibility
    for (const [pluginId, isVisible] of Object.entries(preset.visible)) {
      if (isVisible) showPlugin(pluginId);
      else hidePlugin(pluginId);
    }

    // Apply sizes
    for (const [pluginId, size] of Object.entries(preset.sizes)) {
      setPluginSize(pluginId, size);
    }

    set({ activePresetId: id });
    saveActivePreset(id);
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((p) => p.id !== id);
    savePresets(presets);
    const activePresetId = get().activePresetId === id ? null : get().activePresetId;
    if (get().activePresetId === id) saveActivePreset(null);
    set({ presets, activePresetId });
  },
}));
