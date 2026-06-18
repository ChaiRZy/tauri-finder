import { useRef, useEffect, useState, useCallback } from 'react';
import FileIcon from './FileIcon';
import type { FileEntry } from '../../types/file';
import type { ColumnData } from '../../stores/fileStore';
import { useTagStore } from '../../stores/tagStore';
import './FileList.css';

interface FileColumnsProps {
  columns: ColumnData[];
  selectedPaths: Set<string>;
  onSelect: (path: string) => void;
  onDoubleClick: (entry: FileEntry) => void;
  onColumnNavigate: (entry: FileEntry, colIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
}

const COL_WIDTH_KEY = 'finder-column-widths';

export default function FileColumns({ columns, selectedPaths, onSelect, onDoubleClick, onColumnNavigate, onContextMenu }: FileColumnsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tagDefs = useTagStore((s) => s.tagDefs);
  const folderTags = useTagStore((s) => s.folderTags);

  const [colWidths, setColWidths] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(COL_WIDTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return columns.map(() => 240);
  });
  const [focusCol, setFocusCol] = useState(columns.length - 1);
  const [focusItem, setFocusItem] = useState(0);
  const dragCol = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [columns.length]);

  // Sync widths count with columns count
  useEffect(() => {
    if (colWidths.length !== columns.length) {
      setColWidths(columns.map((_, i) => colWidths[i] || 240));
    }
  }, [columns.length]);

  const saveWidths = (widths: number[]) => {
    localStorage.setItem(COL_WIDTH_KEY, JSON.stringify(widths));
  };

  const onColResizeStart = useCallback((e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    dragCol.current = colIdx;
    dragStartX.current = e.clientX;
    dragStartW.current = colWidths[colIdx] || 240;
    const onMove = (ev: MouseEvent) => {
      if (dragCol.current === null) return;
      const newW = Math.max(120, Math.min(500, dragStartW.current + ev.clientX - dragStartX.current));
      setColWidths((prev) => {
        const next = [...prev];
        next[dragCol.current!] = newW;
        saveWidths(next);
        return next;
      });
    };
    const onUp = () => {
      dragCol.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const col = columns[focusCol];
    if (!col) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextCol = focusCol + 1;
      if (nextCol < columns.length) {
        setFocusCol(nextCol);
        setFocusItem(0);
        // Select the first item or the one that navigated
        const nextColData = columns[nextCol];
        if (nextColData?.entries[0]) {
          onSelect(nextColData.entries[0].path);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevCol = focusCol - 1;
      if (prevCol >= 0) {
        setFocusCol(prevCol);
        setFocusItem(0);
        const prevColData = columns[prevCol];
        if (prevColData?.entries[0]) {
          onSelect(prevColData.entries[0].path);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, focusItem - 1);
      setFocusItem(prev);
      if (col.entries[prev]) onSelect(col.entries[prev].path);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(col.entries.length - 1, focusItem + 1);
      setFocusItem(next);
      if (col.entries[next]) onSelect(col.entries[next].path);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = col.entries[focusItem];
      if (entry?.is_dir) {
        onColumnNavigate(entry, focusCol);
        setFocusCol(focusCol + 1);
        setFocusItem(0);
      } else if (entry) {
        onDoubleClick(entry);
      }
    }
  }, [columns, focusCol, focusItem, onColumnNavigate, onSelect, onDoubleClick]);

  return (
    <div className="file-columns" ref={scrollRef} tabIndex={0} onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
      {columns.map((col, colIdx) => {
        const nextColPath = columns[colIdx + 1]?.path;
        const width = colWidths[colIdx] || 240;
        const isLast = colIdx === columns.length - 1;
        return (
          <div key={col.path} className="file-column" style={{ minWidth: isLast ? width : 'unset', maxWidth: isLast ? width : 'unset', width: isLast ? width : 'unset', flex: isLast ? 1 : 'none' }}>
            <div className="file-column-header">{col.path.split(/[/\\]/).pop() || col.path}</div>
            <div className="file-column-body">
              {col.entries.length === 0 ? (
                <div className="file-column-empty">Empty</div>
              ) : (
                col.entries.map((entry, itemIdx) => {
                  const isActive = nextColPath === entry.path;
                  const isSelected = selectedPaths.has(entry.path);
                  const isFocused = focusCol === colIdx && focusItem === itemIdx;
                  const tagIds = entry.is_dir ? (folderTags[entry.path] || []) : [];
                  const entryTags = tagIds.map((id) => tagDefs.find((t) => t.id === id)).filter(Boolean);
                  return (
                    <div
                      key={entry.path}
                      className={`file-column-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                      onClick={() => {
                        onSelect(entry.path);
                        setFocusCol(colIdx);
                        setFocusItem(itemIdx);
                        if (entry.is_dir) {
                          onColumnNavigate(entry, colIdx);
                        }
                      }}
                      onDoubleClick={() => onDoubleClick(entry)}
                      onContextMenu={(e) => onContextMenu(e, entry)}
                    >
                      <FileIcon entry={entry} size={16} />
                      <span className="file-column-item-name">{entry.name}</span>
                      {entryTags.length > 0 && (
                        <span style={{ display: 'inline-flex', gap: 2, marginLeft: 4, flexShrink: 0 }}>
                          {entryTags.map((tag) => (
                            <span key={tag!.id} style={{ padding: '0 4px', fontSize: 9, lineHeight: '14px', borderRadius: 2, background: tag!.color, color: '#fff', fontWeight: 500 }}>
                              {tag!.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {!isLast && (
              <div
                className="file-column-resize-handle"
                onMouseDown={(e) => onColResizeStart(e, colIdx)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
