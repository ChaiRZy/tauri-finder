import { useEffect, useState, useRef } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { getSystemDirs, getDrives } from '../../utils/constants';
import type { FileEntry } from '../../types/file';
import { Folder, Home, Download, FileImage, FileMusic, FileVideo, HardDrive, Star, Monitor, Plus, ExternalLink, Bookmark, BookmarkMinus } from 'lucide-react';
import './Sidebar.css';

interface CtxMenu {
  x: number;
  y: number;
  type: 'favorite' | 'system' | 'drive';
  path: string;
}

export default function Sidebar() {
  const navigateTo = useFileStore((s) => s.navigateTo);
  const addTab = useFileStore((s) => s.addTab);
  const currentDir = useFileStore((s) => s.currentDir);
  const [systemDirs, setSystemDirs] = useState<FileEntry[]>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSystemDirs().then(setSystemDirs).catch(() => {});
    getDrives().then(setDrives).catch(() => {});
    const saved = localStorage.getItem('finder-favorites');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ctxMenu]);

  const isActive = (path: string) => currentDir.startsWith(path);

  const addFavorite = (path: string) => {
    if (!favorites.includes(path)) {
      const next = [...favorites, path];
      setFavorites(next);
      localStorage.setItem('finder-favorites', JSON.stringify(next));
    }
    setCtxMenu(null);
  };

  const removeFavorite = (path: string) => {
    const next = favorites.filter(f => f !== path);
    setFavorites(next);
    localStorage.setItem('finder-favorites', JSON.stringify(next));
    setCtxMenu(null);
  };

  const sectionHeader = (label: string, icon?: React.ReactNode) => (
    <div className="sidebar-section-header">
      {icon && <span className="sidebar-section-icon">{icon}</span>}
      <span>{label}</span>
    </div>
  );

  const navItem = (path: string, label: string, icon: React.ReactNode, isFav?: boolean) => (
    <div
      key={path}
      className={`sidebar-item ${isActive(path) ? 'active' : ''}`}
      onClick={() => navigateTo(path)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY, type: isFav ? 'favorite' : 'system', path });
      }}
    >
      <span className="sidebar-item-icon">{icon}</span>
      <span className="sidebar-item-label">{label}</span>
    </div>
  );

  return (
    <div className="sidebar">

      {favorites.length > 0 && (
        <div className="sidebar-section">
          {sectionHeader('Favorites', <Star size={14} />)}
          {favorites.map((path) => (
            <div key={path} className="sidebar-item" onClick={() => navigateTo(path)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCtxMenu({ x: e.clientX, y: e.clientY, type: 'favorite', path });
              }}>
              <span className="sidebar-item-icon"><Folder size={16} /></span>
              <span className="sidebar-item-label">{path.split(/[/\\]/).pop() || path}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-section">
        {sectionHeader('System', <Home size={14} />)}
        {systemDirs.map((entry) => {
          let icon = <Folder size={16} />;
          if (entry.name === 'Desktop') icon = <Monitor size={16} />;
          else if (entry.name === 'Downloads') icon = <Download size={16} />;
          else if (entry.name === 'Pictures') icon = <FileImage size={16} />;
          else if (entry.name === 'Music') icon = <FileMusic size={16} />;
          else if (entry.name === 'Videos') icon = <FileVideo size={16} />;
          const isFav = favorites.includes(entry.path);
          return navItem(entry.path, entry.name, icon, isFav);
        })}
      </div>

      {drives.length > 0 && (
        <div className="sidebar-section">
          {sectionHeader('Devices', <HardDrive size={14} />)}
          {drives.map((drive) => (
            <div
              key={drive}
              className={`sidebar-item ${isActive(drive) ? 'active' : ''}`}
              onClick={() => navigateTo(drive)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCtxMenu({ x: e.clientX, y: e.clientY, type: 'drive', path: drive });
              }}
            >
              <span className="sidebar-item-icon"><HardDrive size={16} /></span>
              <span className="sidebar-item-label">{drive}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom Right-Click Menu */}
      {ctxMenu && (
        <>
          <div className="sidebar-ctx-overlay" onClick={() => setCtxMenu(null)} />
          <div className="sidebar-ctx-menu" ref={menuRef} style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000 }}>
            <div className="sidebar-ctx-item" onClick={() => { navigateTo(ctxMenu.path); setCtxMenu(null); }}>
              <ExternalLink size={13} />
              <span>Open</span>
            </div>
            <div className="sidebar-ctx-item" onClick={() => { addTab(ctxMenu.path); setCtxMenu(null); }}>
              <Plus size={13} />
              <span>Open in New Tab</span>
            </div>
            {ctxMenu.type !== 'drive' && (
              favorites.includes(ctxMenu.path) ? (
                <div className="sidebar-ctx-item" onClick={() => removeFavorite(ctxMenu.path)}>
                  <BookmarkMinus size={13} />
                  <span>Remove from Favorites</span>
                </div>
              ) : (
                <div className="sidebar-ctx-item" onClick={() => addFavorite(ctxMenu.path)}>
                  <Bookmark size={13} />
                  <span>Add to Favorites</span>
                </div>
              )
            )}
          </div>
        </>
      )}

    </div>
  );
}
