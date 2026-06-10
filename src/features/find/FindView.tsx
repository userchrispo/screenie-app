import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { SavedItem, ScreenieFilter, ScreenieSort } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { searchSavedItems } from '../../lib/search/searchSavedItems';

interface FindViewProps {
  items: SavedItem[];
  filter: ScreenieFilter;
  searchText: string;
  sortBy: ScreenieSort;
  onSearchTextChange: (value: string) => void;
  onSortChange: (value: ScreenieSort) => void;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
}

export function FindView({
  items,
  filter,
  searchText,
  sortBy,
  onSearchTextChange,
  onSortChange,
  onToggleFavorite,
  onMoveToTrash,
  onRestore
}: FindViewProps) {
  const results = searchSavedItems(items, {
    text: searchText,
    filter,
    sortBy
  });

  return (
    <div className="find-view">
      <section className="find-search-panel" aria-label="Find saved items">
        <label className="find-search">
          <Search size={36} aria-hidden="true" />
          <span className="sr-only">Search everything in Screenie</span>
          <input
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="that pricing screenshot from last week"
            autoFocus
          />
          {searchText && (
            <button type="button" aria-label="Clear search" onClick={() => onSearchTextChange('')}>
              <X size={28} aria-hidden="true" />
            </button>
          )}
        </label>
      </section>

      <div className="results-toolbar">
        <p>{results.length} results found</p>
        <label>
          <span>Sort by</span>
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value as ScreenieSort)}>
            <option value="best-match">Best match</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      {results.length > 0 ? (
        <div className="item-list">
          {results.map((result) => (
            <SavedItemCard
              key={result.item.id}
              item={result.item}
              matchedText={result.matchedText}
              onToggleFavorite={onToggleFavorite}
              onMoveToTrash={onMoveToTrash}
              onRestore={onRestore}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SlidersHorizontal size={32} aria-hidden="true" />
          <h2>No saved item matched that search.</h2>
          <p>Try a tag, filename, URL, or remembered OCR text.</p>
        </div>
      )}

      <p className="find-tip">Tip: You can search by anything - text, tags, names, dates, and more.</p>
    </div>
  );
}
