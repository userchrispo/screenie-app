import type { RefObject } from 'react';
import { CircleHelp, ScanText, Search, SearchX, Star } from 'lucide-react';
import type { SavedItem, SavedItemType, ScreenieFilter, ScreenieSort } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { EmptyState } from '../../components/EmptyState';
import { searchSavedItems } from '../../lib/search/searchSavedItems';
import { tagColorClass } from '../../lib/tagColor';

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
  const resultItems = results.map((result) => result.item);
  const favoriteCount = resultItems.filter((item) => item.isFavorite).length;
  const ocrMatchCount = results.filter(
    (result) => result.matchedText || result.matchSummary?.toLowerCase().includes('ocr')
  ).length;
  const topTags = getTopTags(resultItems, 10);
  const activeFilters = getActiveFilters({ filter, projectId, typeFilter, tagFilter });

  return (
    <div className="find-view page-stack">
      <PageHeader
        titleId="find-title"
        eyebrow="Search"
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

      <SurfaceCard as="section" className="content-section" aria-labelledby="find-title">
        <div className="results-toolbar" aria-label="Search results summary">
          <div className="results-toolbar__count">
            <strong>{results.length} results found</strong>
            <span>{getSearchSummary(searchText, activeFilters)}</span>
          </div>

          <div className="find-metrics" aria-label="Search result metrics">
            <span>
              <Search size={15} strokeWidth={1.75} aria-hidden="true" /> <strong>{results.length}</strong> matches
            </span>
            <span>
              <Star size={15} strokeWidth={1.75} aria-hidden="true" /> <strong>{favoriteCount}</strong> favorites
            </span>
            <span>
              <ScanText size={15} strokeWidth={1.75} aria-hidden="true" /> <strong>{ocrMatchCount}</strong> OCR hits
            </span>
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="filter-chip-row" aria-label="Active search filters">
            {activeFilters.map((activeFilter) => (
              <span key={activeFilter}>{activeFilter}</span>
            ))}
          </div>
        ) : null}

        {topTags.length > 0 ? (
          <div className="inbox-tags" aria-label="Refine by tag">
            <span className="inbox-tags__label">Refine by tag</span>
            <div className="tag-cloud">
              {topTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip tag-chip--button ${tagColorClass(tag)}${
                    tagFilter.includes(tag) ? ' tag-chip--active' : ''
                  }`}
                  aria-pressed={tagFilter.includes(tag)}
                  onClick={() => onTagClick(tag)}
                >
                  {tag}
                  <span className="tag-count">{count}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="item-list dashboard-card-grid">
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
          <EmptyState
            icon={<SearchX size={22} strokeWidth={1.5} />}
            title="No saved item matched that search."
            description="Try a tag, filename, URL, or remembered OCR text."
          />
        )}
      </SurfaceCard>

      <p className="find-tip">
        <CircleHelp size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Tip: Search by text, tags, names, dates, OCR, and more.</span>
      </p>
    </div>
  );
}

function getActiveFilters({
  filter,
  projectId,
  typeFilter,
  tagFilter
}: {
  filter: ScreenieFilter;
  projectId?: string;
  typeFilter: SavedItemType[];
  tagFilter: string[];
}): string[] {
  const filters = [
    projectId ? 'Current project' : getReadableFilter(filter),
    ...typeFilter.map(getReadableType),
    ...tagFilter.map((tag) => `#${tag}`)
  ];

  return filters.filter((value) => value !== 'All');
}

function getSearchSummary(searchText: string, activeFilters: string[]): string {
  const query = searchText.trim();

  if (query && activeFilters.length > 0) {
    return `Searching "${query}" with ${activeFilters.length} active filter${activeFilters.length === 1 ? '' : 's'}.`;
  }

  if (query) {
    return `Searching "${query}" across local captures.`;
  }

  if (activeFilters.length > 0) {
    return `${activeFilters.length} active filter${activeFilters.length === 1 ? '' : 's'} applied.`;
  }

  return 'Search across screenshots, links, snippets, tags, and OCR.';
}

function getTopTags(items: SavedItem[], limit: number): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    item.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return Array.from(counts, ([tag, count]) => ({ tag, count }))
    .sort((first, second) => second.count - first.count || first.tag.localeCompare(second.tag))
    .slice(0, limit);
}

function getReadableFilter(filter: ScreenieFilter): string {
  return filter
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getReadableType(type: SavedItemType): string {
  if (type === 'screenshot') {
    return 'Screenshot';
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}
