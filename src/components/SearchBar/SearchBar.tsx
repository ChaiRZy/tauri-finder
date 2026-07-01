import { useState, useCallback, useRef, useEffect } from 'react';
import { typedInvoke } from '../../utils/invoke';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { FileSearch, FileText } from 'lucide-react';
import type { ContentMatch } from '../../bindings';
import './SearchBar.css';

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
      const results: ContentMatch[] = await typedInvoke.searchContent(query, currentDir);
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
    <div className="searchbar">
      <div className="searchbar-row">
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
        <div className="search-results">
          {contentResults.map((match, i) => (
            <div
              key={i}
              className="search-result-item"
              onClick={() => goToFile(match)}
            >
              <span className="search-result-line">{match.line}</span>
              <div className="search-result-body">
                <div className="search-result-path">
                  {match.path}
                </div>
                <div className="search-result-content">
                  {match.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'content' && loading && (
        <div className="search-status">Searching...</div>
      )}

      {mode === 'content' && !loading && searchQuery && contentResults.length === 0 && (
        <div className="search-status">No content matches</div>
      )}
    </div>
  );
}
