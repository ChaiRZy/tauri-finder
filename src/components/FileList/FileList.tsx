import { useRef, useCallback, useMemo } from 'react';
import { openPath } from '@tauri-apps/plugin-opener';
import { useFileStore } from '../../stores/fileStore';
import { useUiStore } from '../../stores/uiStore';
import FileRow from './FileRow';
import FileGrid from './FileGrid';
import FileColumns from './FileColumns';
import { groupEntries } from '../../utils/formatters';
import { fuzzyFilter } from '../../utils/fuzzyMatch';
import './FileList.css';

export default function FileList() {
  const entries = useFileStore((s) => s.entries);
  const columns = useFileStore((s) => s.columns);
  const viewMode = useUiStore((s) => s.viewMode);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const navigateTo = useFileStore((s) => s.navigateTo);
  const navigateColumn = useFileStore((s) => s.navigateColumn);
  const groupBy = useFileStore((s) => s.groupBy);
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const toggleSelection = useUiStore((s) => s.toggleSelection);
  const showContextMenu = useUiStore((s) => s.showContextMenu);
  const clearSelection = useUiStore((s) => s.clearSelection);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter entries based on fuzzy search (was: exact contains match)
  const filtered = useMemo(() =>
    searchQuery
      ? fuzzyFilter(entries, searchQuery, (e) => e.name)
      : entries,
    [entries, searchQuery],
  );

  const handleDoubleClick = (entry: { is_dir: boolean; path: string }) => {
    if (entry.is_dir) {
      navigateTo(entry.path);
    } else {
      openPath(entry.path);
    }
  };

  const handleColumnNavigate = useCallback(async (entry: { is_dir: boolean; path: string }, colIndex: number) => {
    if (entry.is_dir) {
      await navigateColumn(entry.path, colIndex);
    } else {
      openPath(entry.path);
    }
  }, [navigateColumn]);

  const handleContextMenu = (e: React.MouseEvent, entry?: typeof entries[0]) => {
    e.preventDefault();
    if (entry && !selectedPaths.has(entry.path)) {
      clearSelection();
      toggleSelection(entry.path);
    }
    const target = entry ? [entry] : [];
    showContextMenu(e.clientX, e.clientY, target.length > 0 ? target : filtered);
  };

  return (
    <div
      ref={containerRef}
      className="file-list-container"
      onContextMenu={(e) => handleContextMenu(e)}
      onClick={(e) => {
        if (e.target === containerRef.current || (e.target as HTMLElement).closest('.file-list-container')) {
          clearSelection();
        }
      }}
    >
      {viewMode === 'columns' && columns.length > 0 ? (
        <FileColumns
          columns={searchQuery ? columns.map((col, i) => {
            if (i < columns.length - 1) return col;
            return { ...col, entries: fuzzyFilter(col.entries, searchQuery, (e) => e.name) };
          }) : columns}
          selectedPaths={selectedPaths}
          onSelect={(path) => toggleSelection(path)}
          onDoubleClick={(entry) => handleDoubleClick(entry)}
          onColumnNavigate={handleColumnNavigate}
          onContextMenu={(e, entry) => handleContextMenu(e, entry)}
        />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="12" width="32" height="28" rx="2" stroke="#ccc" strokeWidth="1.5" fill="none" />
              <path d="M8 16h32" stroke="#ccc" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="empty-text">
            {searchQuery ? 'No results found' : 'This folder is empty'}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="file-list-table">
          <div className="file-list-header">
            <span className="col-name">Name</span>
            <span className="col-size">Size</span>
            <span className="col-date">Date Modified</span>
            <span className="col-type">Kind</span>
          </div>
          {groupBy === 'type' ? (
            Array.from(groupEntries(filtered)).map(([groupLabel, groupEntriesList]) => (
              <div key={groupLabel}>
                <div className="file-group-header">{groupLabel}</div>
                {groupEntriesList.map((entry) => (
                  <FileRow
                    key={entry.path}
                    entry={entry}
                    selected={selectedPaths.has(entry.path)}
                    onSelect={() => toggleSelection(entry.path)}
                    onDoubleClick={() => handleDoubleClick(entry)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                  />
                ))}
              </div>
            ))
          ) : (
            filtered.map((entry) => (
              <FileRow
                key={entry.path}
                entry={entry}
                selected={selectedPaths.has(entry.path)}
                onSelect={() => toggleSelection(entry.path)}
                onDoubleClick={() => handleDoubleClick(entry)}
                onContextMenu={(e) => handleContextMenu(e, entry)}
              />
            ))
          )}
        </div>
      ) : (
        <FileGrid
          entries={filtered}
          selectedPaths={selectedPaths}
          onSelect={(path) => toggleSelection(path)}
          onDoubleClick={(entry) => handleDoubleClick(entry)}
          onContextMenu={(e, entry) => handleContextMenu(e, entry)}
        />
      )}
    </div>
  );
}
