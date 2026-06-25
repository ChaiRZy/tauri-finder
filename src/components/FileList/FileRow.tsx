import { useCallback, useState } from 'react';
import { formatSize, formatDate, getFileType } from '../../utils/formatters';
import FileIcon from './FileIcon';
import type { FileEntry } from '../../types/file';
import { useFileStore } from '../../stores/fileStore';
import { useTagStore } from '../../stores/tagStore';
import { useFileSystem } from '../../hooks/useFileSystem';
import { useGitStatus } from '../../hooks/useGitStatus';
import './FileList.css';

interface FileRowProps {
  entry: FileEntry;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function FileRow({ entry, selected, onSelect, onDoubleClick, onContextMenu }: FileRowProps) {
  const tagDefs = useTagStore((s) => s.tagDefs);
  const folderTags = useTagStore((s) => s.folderTags);
  const { moveItems } = useFileSystem();
  const refresh = useFileStore((s) => s.refresh);
  const currentDir = useFileStore((s) => s.currentDir);
  const { gitStatus } = useGitStatus(currentDir);
  const tagIds = entry.is_dir ? (folderTags[entry.path] || []) : [];
  const entryTags = tagIds.map((id) => tagDefs.find((t) => t.id === id)).filter(Boolean);

  const [dragOver, setDragOver] = useState(false);

  // Compute relative path for git status lookup
  const relativePath = currentDir
    ? entry.path.replace(currentDir.replace(/\\/g, '/'), '').replace(/^[/\\]+/, '')
    : entry.name;
  const gitInfo = gitStatus[relativePath] ?? gitStatus[entry.name];

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entry.path);
    // Create a custom ghost element
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.opacity = '0.5';
    ghost.style.width = '300px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, [entry.path]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!entry.is_dir) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, [entry.is_dir]);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!entry.is_dir) return;
    const srcPath = e.dataTransfer.getData('text/plain');
    if (!srcPath) return;
    // Move file into this directory
    await moveItems([srcPath], entry.path);
    await refresh();
  }, [entry.is_dir, entry.path, moveItems, refresh]);

  return (
    <div
      className={`file-row ${selected ? 'selected' : ''} ${dragOver ? 'drag-over' : ''}`}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onSelect();
        } else {
          onSelect();
        }
      }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      data-path={entry.path}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="col-name">
        {gitInfo && (
          <span
            className={`git-indicator git-indicator--${gitInfo.status}`}
            title={`${gitInfo.status}${gitInfo.staged ? ' (staged)' : ''}`}
          />
        )}
        <FileIcon entry={entry} size={18} />
        <span className="file-name-text">{entry.name}</span>
        {entryTags.length > 0 && (
          <span style={{ display: 'inline-flex', gap: 3, marginLeft: 6, verticalAlign: 'middle' }}>
            {entryTags.map((tag) => (
              <span
                key={tag!.id}
                style={{
                  display: 'inline-block',
                  padding: '0 5px',
                  fontSize: 10,
                  lineHeight: '16px',
                  borderRadius: 3,
                  background: tag!.color,
                  color: '#fff',
                  fontWeight: 500,
                }}
              >
                {tag!.name}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="col-size">{entry.is_dir ? '--' : formatSize(entry.size)}</span>
      <span className="col-date">{formatDate(entry.modified_at)}</span>
      <span className="col-type">{getFileType(entry)}</span>
    </div>
  );
}
