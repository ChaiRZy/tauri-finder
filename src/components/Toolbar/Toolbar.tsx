import { useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { LayoutList, LayoutGrid, Columns3, ArrowUpDown, Search, FolderTree, ChevronLeft, ChevronRight } from 'lucide-react';
import './Toolbar.css';

export default function Toolbar() {
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const setSortBy = useFileStore((s) => s.setSortBy);
  const sortBy = useFileStore((s) => s.sortBy);
  const sortOrder = useFileStore((s) => s.sortOrder);
  const togglePreview = useUiStore((s) => s.togglePreview);
  const showPreview = useUiStore((s) => s.showPreview);
  const showSearchBar = useUiStore((s) => s.showSearchBar);
  const toggleSearchBar = useUiStore((s) => s.toggleSearchBar);
  const groupBy = useFileStore((s) => s.groupBy);
  const toggleGroupBy = useFileStore((s) => s.toggleGroupBy);

  const currentDir = useFileStore((s) => s.currentDir);
  const navigateTo = useFileStore((s) => s.navigateTo);
  const goBack = useFileStore((s) => s.goBack);
  const goForward = useFileStore((s) => s.goForward);
  const goUp = useFileStore((s) => s.goUp);
  const historyIndex = useFileStore((s) => s.historyIndex);
  const history = useFileStore((s) => s.history);

  const appWindow = getCurrentWindow();

  const handleMinimize = useCallback(() => appWindow.minimize(), [appWindow]);
  const handleMaximize = useCallback(() => appWindow.toggleMaximize(), [appWindow]);
  const handleClose = useCallback(() => appWindow.close(), [appWindow]);

  if (!currentDir) return null;

  const segments = currentDir.replace(/\\/g, '/').split('/').filter(Boolean);

  return (
    <div className="toolbar">
      {/* Left: window controls + nav + path */}
      <div className="toolbar-left">
        {/* Window controls (macOS-style) */}
        <div className="window-controls">
          <button className="win-btn win-close" onClick={handleClose} title="Close" />
          <button className="win-btn win-minimize" onClick={handleMinimize} title="Minimize" />
          <button className="win-btn win-maximize" onClick={handleMaximize} title="Maximize" />
        </div>

        <div className="toolbar-separator" />

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

        <div className="toolbar-separator" />

        {/* Breadcrumb / Address bar */}
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
      </div>

      {/* Right: view mode, sort, search, preview */}
      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${showSearchBar ? 'active' : ''}`}
          onClick={toggleSearchBar}
          title="Toggle search bar"
        >
          <Search size={14} />
        </button>

        <button
          className={`toolbar-btn ${groupBy === 'type' ? 'active' : ''}`}
          onClick={toggleGroupBy}
          title={groupBy === 'type' ? 'Ungroup' : 'Group by type'}
        >
          <FolderTree size={14} />
        </button>

        <div className="toolbar-separator" />

        <span className="toolbar-label">View:</span>
        <button
          className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
          title="List view"
        >
          <LayoutList size={15} />
        </button>
        <button
          className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Grid view"
        >
          <LayoutGrid size={15} />
        </button>
        <button
          className={`toolbar-btn ${viewMode === 'columns' ? 'active' : ''}`}
          onClick={() => setViewMode('columns')}
          title="Column view"
        >
          <Columns3 size={15} />
        </button>

        <div className="toolbar-separator" />

        <span className="toolbar-label">Sort:</span>
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
          <ArrowUpDown size={13} />
          <span className="sort-order-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        </button>

        <div className="toolbar-separator" />

        <button
          className={`toolbar-btn ${showPreview ? 'active' : ''}`}
          onClick={togglePreview}
          title="Toggle preview panel"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <circle cx="6" cy="7" r="1.5" fill="currentColor" />
            <path d="M2 11l3-3 2 2 3-3 4 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
