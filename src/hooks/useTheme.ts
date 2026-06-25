import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export function useTheme() {
  const theme = useThemeStore((s) => s.currentTheme);

  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--font-size', `${theme.fontSize}px`);
    root.style.setProperty('--monospace-font', theme.monospaceFont);
    root.style.setProperty('--bg-main', c.mainBg);
    root.style.setProperty('--text-main', c.mainText);
    root.style.setProperty('--bg-sidebar', c.sidebarBg);
    root.style.setProperty('--text-sidebar', c.sidebarText);
    root.style.setProperty('--bg-terminal', c.terminalBg);
    root.style.setProperty('--text-terminal', c.terminalText);
    root.style.setProperty('--bg-preview', c.previewBg);
    root.style.setProperty('--text-preview', c.previewText);
    root.style.setProperty('--bg-statusbar', c.statusbarBg);
    root.style.setProperty('--text-statusbar', c.statusbarText);
    root.style.setProperty('--bg-toolbar', c.toolbarBg);
    root.style.setProperty('--text-toolbar', c.toolbarText);
    root.style.setProperty('--bg-activitybar', c.activityBarBg);
    root.style.setProperty('--text-activitybar', c.activityBarText);
    root.style.setProperty('--bg-activitybar-active', c.activityBarActiveBg);
    root.style.setProperty('--border', c.border);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--selection', c.selection);
    root.style.setProperty('--hover', c.hover);
  }, [theme]);
}
