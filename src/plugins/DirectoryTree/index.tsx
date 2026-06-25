import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFileStore } from '../../stores/fileStore';
import { getSystemDirs, getDrives } from '../../utils/constants';
import type { FileEntry } from '../../types/file';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Monitor, Download, FileImage, FileMusic, FileVideo, HardDrive, Star } from 'lucide-react';
import './DirectoryTree.css';

export default function DirectoryTree() {
  const navigateTo = useFileStore((s) => s.navigateTo);
  const currentDir = useFileStore((s) => s.currentDir);
  const [rootItems, setRootItems] = useState<FileEntry[]>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [children, setChildren] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getSystemDirs().then(setRootItems).catch(() => {});
    getDrives().then(setDrives).catch(() => {});
  }, []);

  // Auto-expand to current directory's ancestors
  useEffect(() => {
    if (!currentDir) return;
    const parts = currentDir.replace(/\\/g, '/').replace(/\/$/, '').split('/').filter(Boolean);
    const toExpand = new Set(expanded);
    let path = '';
    for (const part of parts) {
      path += '/' + part;
      toExpand.add(path);
    }
    // Also add drive letter
    if (currentDir.match(/^[A-Za-z]:\\/)) {
      const drive = currentDir.substring(0, 2);
      toExpand.add(drive);
    }
    setExpanded(toExpand);

    // Load children for all ancestors if not already loaded
    let acc = '';
    for (const part of parts) {
      acc += '/' + part;
      if (!children[acc]) {
        loadChildren(acc);
      }
    }
  }, [currentDir]);

  const loadChildren = useCallback(async (path: string) => {
    if (loading[path] || children[path]) return;
    setLoading((prev) => ({ ...prev, [path]: true }));
    try {
      const entries: FileEntry[] = await invoke('list_directory', { path });
      setChildren((prev) => ({ ...prev, [path]: entries.filter((e) => e.is_dir) }));
    } catch {}
    setLoading((prev) => ({ ...prev, [path]: false }));
  }, [loading, children]);

  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    if (!children[path]) loadChildren(path);
  }, [children, loadChildren]);

  const isActive = (path: string) => currentDir.startsWith(path);

  const renderNode = (path: string, name: string, depth: number): React.ReactNode => {
    const isExpanded = expanded.has(path);
    const childList = children[path] ?? [];
    const isLoading = loading[path];
    const active = isActive(path);

    return (
      <div key={path}>
        <div
          className={`tree-node ${active ? 'tree-node--active' : ''}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => navigateTo(path)}
        >
          <span
            className="tree-node__arrow"
            onClick={(e) => { e.stopPropagation(); toggleExpand(path); }}
          >
            {isLoading ? (
              <span className="tree-node__spinner" />
            ) : isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </span>
          <span className="tree-node__icon">
            {isExpanded ? <FolderOpen size={15} /> : <Folder size={15} />}
          </span>
          <span className="tree-node__label">{name}</span>
        </div>
        {isExpanded && childList.length > 0 && (
          <div>
            {childList.map((child) => renderNode(child.path, child.name, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getDriveLabel = (drive: string) => {
    const letter = drive.replace(':\\', '');
    return `${letter}:`;
  };

  const SYSTEM_ICONS: Record<string, React.ReactNode> = {
    'Desktop': <Monitor size={15} />,
    'Downloads': <Download size={15} />,
    'Pictures': <FileImage size={15} />,
    'Music': <FileMusic size={15} />,
    'Videos': <FileVideo size={15} />,
  };

  return (
    <div className="tree-panel">
      {/* Drives */}
      {drives.length > 0 && (
        <div className="tree-section">
          <div className="tree-section-title"><HardDrive size={13} /> Drives</div>
          {drives.map((drive) => (
            <div
              key={drive}
              className={`tree-node ${isActive(drive) ? 'tree-node--active' : ''}`}
              style={{ paddingLeft: 8 }}
              onClick={() => navigateTo(drive)}
            >
              <span className="tree-node__icon"><HardDrive size={15} /></span>
              <span className="tree-node__label">{getDriveLabel(drive)}</span>
            </div>
          ))}
        </div>
      )}

      {/* System dirs */}
      <div className="tree-section">
        <div className="tree-section-title"><Star size={13} /> System</div>
        {rootItems.map((entry) => {
          const icon = SYSTEM_ICONS[entry.name] ?? <Folder size={15} />;
          return (
            <div key={entry.path}>
              <div
                className={`tree-node ${isActive(entry.path) ? 'tree-node--active' : ''}`}
                style={{ paddingLeft: 8 }}
                onClick={() => navigateTo(entry.path)}
              >
                <span className="tree-node__icon">{icon}</span>
                <span className="tree-node__label">{entry.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tree root */}
      <div className="tree-section">
        <div className="tree-section-title"><Folder size={13} /> Files</div>
        <div>
          {/* Show drives as expandable roots */}
          {drives.map((drive) => {
            const path = drive;
            const label = getDriveLabel(drive);
            return (
              <div key={drive}>
                {renderNode(path, label, 0)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
