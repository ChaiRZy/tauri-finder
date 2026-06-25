import { useRef, useState, useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { getAllPlugins } from '../../plugins/registry';
import { useFileStore } from '../../stores/fileStore';
import { useLayoutPresetStore } from '../../stores/layoutPresetStore';
import { LayoutList, LayoutGrid, Columns3, Search, ChevronLeft, ChevronRight, Menu, LayoutTemplate, Save, Trash2 } from 'lucide-react';
import './Toolbar.css';

export default function Toolbar() {
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const setSortBy = useFileStore((s) => s.setSortBy);
  const sortBy = useFileStore((s) => s.sortBy);
  const sortOrder = useFileStore((s) => s.sortOrder);
  const showSearchBar = useUiStore((s) => s.showSearchBar);
  const toggleSearchBar = useUiStore((s) => s.toggleSearchBar);
  const [menuOpen, setMenuOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const presetMenuRef = useRef<HTMLDivElement>(null);

  const visible = usePluginStore((s) => s.visible);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const presets = useLayoutPresetStore((s) => s.presets);
  const activePresetId = useLayoutPresetStore((s) => s.activePresetId);
  const applyPreset = useLayoutPresetStore((s) => s.applyPreset);
  const saveCurrentAsPreset = useLayoutPresetStore((s) => s.saveCurrentAsPreset);
  const deletePreset = useLayoutPresetStore((s) => s.deletePreset);

  const currentDir = useFileStore((s) => s.currentDir);
  const navigateTo = useFileStore((s) => s.navigateTo);
  const goBack = useFileStore((s) => s.goBack);
  const goForward = useFileStore((s) => s.goForward);
  const goUp = useFileStore((s) => s.goUp);
  const historyIndex = useFileStore((s) => s.historyIndex);
  const history = useFileStore((s) => s.history);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!menuOpen && !presetMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPresetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, presetMenuOpen]);

  if (!currentDir) return null;

  const segments = currentDir.replace(/\\/g, '/').split('/').filter(Boolean);
  const plugins = getAllPlugins();

  return (
    <div className="toolbar">
      {/* Left: nav */}
      <div className="toolbar-left">
        {/* Navigation */}
        <button className="toolbar-btn" onClick={goBack} disabled={historyIndex <= 0} title="Back">
          <ChevronLeft size={14} />
        </button>
        <button className="toolbar-btn" onClick={goForward} disabled={historyIndex >= history.length - 1} title="Forward">
          <ChevronRight size={14} />
        </button>
        <button className="toolbar-btn" onClick={goUp} title="Go up">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3L3 8h3v5h4V8h3L8 3z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="toolbar-breadcrumbs">
        {segments.map((seg, i) => {
          const path = segments.slice(0, i + 1).join('/');
          const fullPath = currentDir.startsWith('/') ? '/' + path : path;
          return (
            <span key={fullPath} className="tb-breadcrumb">
              {i > 0 && <span className="tb-breadcrumb-sep">›</span>}
              <span
                className={`tb-breadcrumb-link ${i === segments.length - 1 ? 'active' : ''}`}
                onClick={() => navigateTo(fullPath)}
              >
                {seg}
              </span>
            </span>
          );
        })}
      </div>

      {/* Right: minimal actions + plugin menu */}
      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${showSearchBar ? 'active' : ''}`}
          onClick={toggleSearchBar}
          title="Toggle search bar"
        >
          <Search size={14} />
        </button>

        <div className="toolbar-separator" />

        <button className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')} title="List view">
          <LayoutList size={15} />
        </button>
        <button className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')} title="Grid view">
          <LayoutGrid size={15} />
        </button>
        <button className={`toolbar-btn ${viewMode === 'columns' ? 'active' : ''}`}
          onClick={() => setViewMode('columns')} title="Column view">
          <Columns3 size={15} />
        </button>

        <div className="toolbar-separator" />

        {/* Sort */}
        <select
          className="toolbar-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'modified_at')}
        >
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="modified_at">Date</option>
        </select>
        <button className="toolbar-btn" onClick={() => useFileStore.getState().toggleSortOrder()} title="Toggle sort order">
          <span className="sort-order-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        </button>

        <div className="toolbar-separator" />

        {/* Layout presets */}
        <div className="toolbar-plugin-menu" ref={presetMenuRef}>
          <button
            className={`toolbar-btn ${presetMenuOpen ? 'active' : ''}`}
            onClick={() => setPresetMenuOpen((v) => !v)}
            title="Layout presets"
          >
            <LayoutTemplate size={15} />
          </button>
          {presetMenuOpen && (
            <div className="toolbar-menu-dropdown toolbar-preset-dropdown">
              <div className="toolbar-menu-header">Layout Presets</div>
              {presets.map((p) => (
                <div key={p.id} className="toolbar-menu-row">
                  <label
                    className="toolbar-menu-item"
                    style={{ flex: 1 }}
                    onClick={() => { applyPreset(p.id); setPresetMenuOpen(false); }}
                  >
                    <span style={{ fontWeight: activePresetId === p.id ? 600 : 400 }}>
                      {activePresetId === p.id ? '✓ ' : ''}{p.name}
                    </span>
                  </label>
                  <button
                    className="toolbar-menu-icon-btn"
                    onClick={() => deletePreset(p.id)}
                    title="Delete preset"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {presets.length === 0 && (
                <div style={{ padding: '8px 12px', fontSize: 11, color: '#888' }}>No presets saved</div>
              )}
              <div className="toolbar-menu-sep" />
              <div style={{ display: 'flex', gap: 4, padding: '6px 8px' }}>
                <input
                  placeholder="Preset name..."
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  style={{
                    flex: 1, padding: '2px 6px', fontSize: 11,
                    border: '1px solid var(--border)', borderRadius: 3,
                    background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none',
                  }}
                />
                <button
                  className="toolbar-btn"
                  style={{ padding: '2px 8px' }}
                  onClick={() => {
                    if (savePresetName.trim()) {
                      saveCurrentAsPreset(savePresetName.trim());
                      setSavePresetName('');
                      setPresetMenuOpen(false);
                    }
                  }}
                  title="Save current layout"
                >
                  <Save size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-separator" />

        {/* Plugin menu */}
        <div className="toolbar-plugin-menu" ref={menuRef}>
          <button
            className={`toolbar-btn toolbar-menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            title="Plugins"
          >
            <Menu size={15} />
          </button>
          {menuOpen && (
            <div className="toolbar-menu-dropdown">
              <div className="toolbar-menu-header">Plugins</div>
              {plugins.map((p) => (
                <label key={p.id} className="toolbar-menu-item">
                  <input
                    type="checkbox"
                    checked={!!visible[p.id]}
                    onChange={() => togglePlugin(p.id)}
                  />
                  <span>{p.title}</span>
                  <span className="toolbar-menu-position">{p.position}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
