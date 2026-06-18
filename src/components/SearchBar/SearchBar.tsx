import { useUiStore } from '../../stores/uiStore';
import './SearchBar.css';

export default function SearchBar() {
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const showSearchBar = useUiStore((s) => s.showSearchBar);

  if (!showSearchBar) return null;

  return (
    <div className="searchbar">
      <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <input
        data-search-input
        className="search-input"
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setSearchQuery('');
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {searchQuery && (
        <button className="search-clear" onClick={() => setSearchQuery('')} title="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
