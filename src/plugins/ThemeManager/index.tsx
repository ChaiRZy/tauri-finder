import { useState } from 'react';
import { useThemeStore, DEFAULT_THEME, DARK_THEME } from '../../stores/themeStore';
import type { ThemeConfig } from '../../stores/themeStore';

const COLOR_LABELS: Record<keyof ThemeConfig['colors'], string> = {
  mainBg: 'Main Background',
  mainText: 'Main Text',
  sidebarBg: 'Sidebar Background',
  sidebarText: 'Sidebar Text',
  terminalBg: 'Terminal Background',
  terminalText: 'Terminal Text',
  previewBg: 'Preview Background',
  previewText: 'Preview Text',
  statusbarBg: 'Status Bar Background',
  statusbarText: 'Status Bar Text',
  toolbarBg: 'Toolbar Background',
  toolbarText: 'Toolbar Text',
  activityBarBg: 'Activity Bar Background',
  activityBarText: 'Activity Bar Text',
  activityBarActiveBg: 'Activity Bar Active',
  border: 'Border Color',
  accent: 'Accent Color',
  selection: 'Selection Color',
  hover: 'Hover Color',
};

export default function ThemeManager() {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const savedThemes = useThemeStore((s) => s.savedThemes);
  const setTheme = useThemeStore((s) => s.setTheme);
  const updateTheme = useThemeStore((s) => s.updateTheme);
  const updateColors = useThemeStore((s) => s.updateColors);
  const saveThemeAs = useThemeStore((s) => s.saveThemeAs);
  const deleteTheme = useThemeStore((s) => s.deleteTheme);
  const resetTheme = useThemeStore((s) => s.resetTheme);

  const [customName, setCustomName] = useState('');

  return (
    <div style={{ padding: 12, fontSize: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>Theme Manager</div>

      {/* Quick presets */}
      <div>
        <div style={{ color: '#888', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>Presets</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setTheme(DEFAULT_THEME)} style={btnStyle(currentTheme.id === 'default-dark')}>
            Light
          </button>
          <button onClick={() => setTheme(DARK_THEME)} style={btnStyle(currentTheme.id === 'dark')}>
            Dark
          </button>
        </div>
      </div>

      {/* Saved themes */}
      {savedThemes.length > 0 && (
        <div>
          <div style={{ color: '#888', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>Custom</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {savedThemes.map((t) => (
              <div key={t.id} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <button onClick={() => setTheme(t)} style={btnStyle(currentTheme.id === t.id)}>
                  {t.name}
                </button>
                <button onClick={() => deleteTheme(t.id)} style={{ ...btnStyle(false), color: '#da3633', padding: '2px 6px' }} title="Delete">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Font settings */}
      <div>
        <div style={{ color: '#888', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>Font</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 90, flexShrink: 0 }}>Family:</span>
            <input
              value={currentTheme.fontFamily}
              onChange={(e) => updateTheme({ fontFamily: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 90, flexShrink: 0 }}>Monospace:</span>
            <input
              value={currentTheme.monospaceFont}
              onChange={(e) => updateTheme({ monospaceFont: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 90, flexShrink: 0 }}>Font Size:</span>
            <input
              type="number"
              min={10}
              max={24}
              value={currentTheme.fontSize}
              onChange={(e) => updateTheme({ fontSize: Number(e.target.value) })}
              style={{ ...inputStyle, width: 60 }}
            />
            <span>px</span>
          </label>
        </div>
      </div>

      {/* Color settings */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ color: '#888', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>Colors</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {(Object.keys(COLOR_LABELS) as (keyof ThemeConfig['colors'])[]).map((key) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="color"
                value={currentTheme.colors[key]}
                onChange={(e) => updateColors({ [key]: e.target.value })}
                style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
              />
              <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {COLOR_LABELS[key]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Theme name..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 100 }}
        />
        <button
          onClick={() => { if (customName) { saveThemeAs(customName.toLowerCase().replace(/\s+/g, '-'), customName); setCustomName(''); } }}
          style={btnStyle(false)}
          disabled={!customName}
        >
          Save
        </button>
        <button onClick={resetTheme} style={{ ...btnStyle(false), color: '#da3633' }}>
          Reset
        </button>
      </div>
    </div>
  );
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    fontSize: 11,
    border: active ? '1px solid var(--accent, #007aff)' : '1px solid var(--border, #ccc)',
    borderRadius: 3,
    background: active ? 'var(--accent, #007aff)' : 'transparent',
    color: active ? '#fff' : 'var(--text-main, #333)',
    cursor: 'pointer',
  };
}

const inputStyle: React.CSSProperties = {
  padding: '2px 6px',
  fontSize: 11,
  border: '1px solid var(--border, #ccc)',
  borderRadius: 3,
  background: 'var(--bg-main, #fff)',
  color: 'var(--text-main, #333)',
  outline: 'none',
};
