import FileIcon from './FileIcon';
import type { FileEntry } from '../../types/file';
import { useTagStore } from '../../stores/tagStore';
import './FileList.css';

interface FileGridProps {
  entries: FileEntry[];
  selectedPaths: Set<string>;
  onSelect: (path: string) => void;
  onDoubleClick: (entry: FileEntry) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
}

export default function FileGrid({ entries, selectedPaths, onSelect, onDoubleClick, onContextMenu }: FileGridProps) {
  const tagDefs = useTagStore((s) => s.tagDefs);
  const folderTags = useTagStore((s) => s.folderTags);
  return (
    <div className="file-grid">
      {entries.map((entry) => {
        const tagIds = entry.is_dir ? (folderTags[entry.path] || []) : [];
        const entryTags = tagIds.map((id) => tagDefs.find((t) => t.id === id)).filter(Boolean);
        return (
          <div
            key={entry.path}
            className={`file-grid-item ${selectedPaths.has(entry.path) ? 'selected' : ''}`}
            onClick={() => onSelect(entry.path)}
            onDoubleClick={() => onDoubleClick(entry)}
            onContextMenu={(e) => onContextMenu(e, entry)}
            data-path={entry.path}
          >
            <div className="file-grid-icon">
              <FileIcon entry={entry} size={48} />
              {entryTags.length > 0 && (
                <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {entryTags.map((tag) => (
                    <span key={tag!.id} style={{ padding: '0 4px', fontSize: 9, lineHeight: '14px', borderRadius: 2, background: tag!.color, color: '#fff', fontWeight: 500 }}>
                      {tag!.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="file-grid-name">{entry.name}</div>
          </div>
        );
      })}
    </div>
  );
}
