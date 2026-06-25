import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { FileSearch, FileText } from 'lucide-react';
import './SearchBar.css';

interface ContentMatch {
  path: string;
  line: number;
  content: string;
}

export default function SearchBar() {
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const showSearchBar = useUiStore((s) => s.showSearchBar);
  const currentDir = useFileStore((s) => s.currentDir);

  const [mode, setMode] = useState<'filename' | 'content'>('filename');
  const [contentResults, setContentResults] = useState<ContentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doContentSearch = useCallback(async (query: string) => {
    if (!query.trim() || !currentDir) {
      setContentResults([]);
      return;
    }
    setLoading(true);
    try {
      const results: ContentMatch[] = await invoke('search_content', {
        query,
        basePath: currentDir,
      });
      setContentResults(results);
    } catch {
      setContentResults([]);
    }
    setLoading(false);
  }, [currentDir]);

  useEffect(() => {
    if (mode === 'content') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doContentSearch(searchQuery), 400);
    } else {
      setContentResults([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, mode, doContentSearch]);

  const navigateTo = useFileStore((s) => s.navigateTo);
  const goToFile = useCallback((match: ContentMatch) => {
    // Navigate to the parent directory
    const idx = match.path.replace(/\\/g, '/').lastIndexOf('/');
    const dir = idx >= 0 ? match.path.slice(0, idx) : match.path;
    navigateTo(dir);
  }, [navigateTo]);

  if (!showSearchBar) return null;

  return (
    <div className="searchbar" style={{ flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
        <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          data-search-input
          className="search-input"
          type="text"
          placeholder={mode === 'filename' ? 'Search files... (fuzzy)' : 'Search file contents...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearchQuery('');
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button
          className={`search-mode-btn ${mode === 'content' ? 'active' : ''}`}
          onClick={() => {
            const next = mode === 'filename' ? 'content' : 'filename';
            setMode(next);
            if (next === 'content' && searchQuery) doContentSearch(searchQuery);
            else setContentResults([]);
          }}
          title={mode === 'filename' ? 'Switch to content search' : 'Switch to filename search'}
          style={{
            border: 'none', background: mode === 'content' ? '#e0e0e0' : 'transparent',
            cursor: 'pointer', padding: '2px 6px', borderRadius: 4, color: '#666', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          {mode === 'filename' ? <FileSearch size={13} /> : <FileText size={13} />}
          <span style={{ fontSize: 11 }}>{mode === 'filename' ? 'Name' : 'Content'}</span>
        </button>
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')} title="Clear search">
            ✕
          </button>
        )}
      </div>

      {/* Content search results */}
      {mode === 'content' && contentResults.length > 0 && (
        <div style={{
          width: '100%', maxHeight: 200, overflowY: 'auto', borderTop: '1px solid #e5e5e5',
          background: '#fff', fontSize: 12,
        }}>
          {contentResults.map((match, i) => (
            <div
              key={i}
              onClick={() => goToFile(match)}
              style={{
                padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: '#999', flexShrink: 0, minWidth: 30 }}>{match.line}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#888', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {match.path}
                </div>
                <div style={{ color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {match.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'content' && loading && (
        <div style={{ padding: '4px 8px', color: '#999', fontSize: 11 }}>Searching...</div>
      )}

      {mode === 'content' && !loading && searchQuery && contentResults.length === 0 && (
        <div style={{ padding: '4px 8px', color: '#999', fontSize: 11 }}>No content matches</div>
      )}
    </div>
  );
}
