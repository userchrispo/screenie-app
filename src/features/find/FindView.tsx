import type { RefObject } from 'react';
import { CircleHelp, SlidersHorizontal } from 'lucide-react';
import type { SavedItem, SavedItemType, ScreenieFilter, ScreenieSort } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { searchSavedItems } from '../../lib/search/searchSavedItems';

interface FindViewProps {
  items: SavedItem[];
  filter: ScreenieFilter;
  searchText: string;
  sortBy: ScreenieSort;
  typeFilter: SavedItemType[];
  tagFilter: string[];
  projectId?: string;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSearchTextChange: (value: string) => void;
  onSortChange: (value: ScreenieSort) => void;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
  onOpenDetail: (item: SavedItem) => void;
  onTagClick: (tag: string) => void;
  onDeletePermanently?: (item: SavedItem) => void;
}

export function FindView({
  items,
  filter,
  searchText,
  sortBy,
  typeFilter,
  tagFilter,
  projectId,
  onSortChange,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onTagClick,
  onDeletePermanently
}: FindViewProps) {
  const results = searchSavedItems(items, {
    text: searchText,
    filter: projectId ? 'library' : filter,
    sortBy,
    types: typeFilter.length > 0 ? typeFilter : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    projectId
  });

  return (
    <div className="find-view page-stack">
      <PageHeader
        titleId="find-title"
        title="Find"
        subtitle="Search across screenshots, links, snippets, tags, and OCR text."
        actions={
          <label className="find-sort">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => onSortChange(event.target.value as ScreenieSort)}>
              <option value="best-match">Best match</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>
          </label>
        }
      />

      <div className="results-toolbar">
        <p>{results.length} results found</p>
      </div>

      {results.length > 0 ? (
        <div className="item-list">
          {results.map((result) => (
            <SavedItemCard
              key={result.item.id}
              item={result.item}
              matchedText={result.matchedText}
              matchSummary={result.matchSummary}
              onToggleFavorite={onToggleFavorite}
              onMoveToTrash={onMoveToTrash}
              onRestore={onRestore}
              onOpenDetail={onOpenDetail}
              onTagClick={onTagClick}
              onDeletePermanently={onDeletePermanently}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
          <h2>No saved item matched that search.</h2>
          <p>Try a tag, filename, URL, or remembered OCR text.</p>
        </div>
      )}

      <p className="find-tip">
        <CircleHelp size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Tip: Search by text, tags, names, dates, OCR, and more.</span>
      </p>
    </div>
  );
}
