import { create } from 'zustand';

const THEME_KEY = 'finder-theme-config';

export interface ThemeConfig {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  monospaceFont: string;
  colors: {
    mainBg: string;
    mainText: string;
    sidebarBg: string;
    sidebarText: string;
    terminalBg: string;
    terminalText: string;
    previewBg: string;
    previewText: string;
    statusbarBg: string;
    statusbarText: string;
    toolbarBg: string;
    toolbarText: string;
    activityBarBg: string;
    activityBarText: string;
    activityBarActiveBg: string;
    border: string;
    accent: string;
    selection: string;
    hover: string;
  };
}

export const DEFAULT_THEME: ThemeConfig = {
  id: 'default-dark',
  name: 'Default Dark',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 13,
  monospaceFont: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
  colors: {
    mainBg: '#fff',
    mainText: '#1d1d1f',
    sidebarBg: '#f5f5f7',
    sidebarText: '#1d1d1f',
    terminalBg: '#1e1e1e',
    terminalText: '#d4d4d4',
    previewBg: '#fafafa',
    previewText: '#1d1d1f',
    statusbarBg: '#007aff',
    statusbarText: '#fff',
    toolbarBg: '#f5f5f7',
    toolbarText: '#1d1d1f',
    activityBarBg: '#2c2c2c',
    activityBarText: '#858585',
    activityBarActiveBg: '#3c3c3c',
    border: '#e5e5e5',
    accent: '#007aff',
    selection: '#d4e4f7',
    hover: '#f0f0f2',
  },
};

export const DARK_THEME: ThemeConfig = {
  id: 'dark',
  name: 'Dark',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 13,
  monospaceFont: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
  colors: {
    mainBg: '#1e1e1e',
    mainText: '#d4d4d4',
    sidebarBg: '#252526',
    sidebarText: '#cccccc',
    terminalBg: '#0d1117',
    terminalText: '#d4d4d4',
    previewBg: '#1e1e1e',
    previewText: '#d4d4d4',
    statusbarBg: '#007acc',
    statusbarText: '#fff',
    toolbarBg: '#333333',
    toolbarText: '#cccccc',
    activityBarBg: '#333333',
    activityBarText: '#858585',
    activityBarActiveBg: '#2c2c2c',
    border: '#3c3c3c',
    accent: '#007acc',
    selection: '#264f78',
    hover: '#2a2d2e',
  },
};

function loadTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_THEME;
}

function saveTheme(theme: ThemeConfig) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

interface ThemeStore {
  currentTheme: ThemeConfig;
  savedThemes: ThemeConfig[];
  setTheme: (theme: ThemeConfig) => void;
  updateTheme: (patch: Partial<ThemeConfig>) => void;
  updateColors: (colors: Partial<ThemeConfig['colors']>) => void;
  saveThemeAs: (id: string, name: string) => void;
  deleteTheme: (id: string) => void;
  resetTheme: () => void;
}

function loadSavedThemes(): ThemeConfig[] {
  try {
    const raw = localStorage.getItem('finder-saved-themes');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveSavedThemes(themes: ThemeConfig[]) {
  localStorage.setItem('finder-saved-themes', JSON.stringify(themes));
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: loadTheme(),
  savedThemes: loadSavedThemes(),

  setTheme: (theme) => {
    saveTheme(theme);
    set({ currentTheme: theme });
  },

  updateTheme: (patch) => {
    const next = { ...get().currentTheme, ...patch };
    saveTheme(next);
    set({ currentTheme: next });
  },

  updateColors: (colors) => {
    const next = {
      ...get().currentTheme,
      colors: { ...get().currentTheme.colors, ...colors },
    };
    saveTheme(next);
    set({ currentTheme: next });
  },

  saveThemeAs: (id, name) => {
    const newTheme = { ...get().currentTheme, id: `custom-${id}`, name };
    const saved = [...get().savedThemes, newTheme];
    saveSavedThemes(saved);
    set({ savedThemes: saved });
  },

  deleteTheme: (id) => {
    const saved = get().savedThemes.filter((t) => t.id !== id);
    saveSavedThemes(saved);
    set({ savedThemes: saved });
  },

  resetTheme: () => {
    saveTheme(DEFAULT_THEME);
    set({ currentTheme: DEFAULT_THEME });
  },
}));
