import { useMemo } from 'react';
import type { SavedItem, SavedItemType, ScreenieSort } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SectionLabel } from '../../components/SectionLabel';
import { SurfaceCard } from '../../components/SurfaceCard';
import { FilterMenu } from '../../components/FilterMenu';
import { searchSavedItems } from '../../lib/search/searchSavedItems';

interface TagsViewProps {
  items: SavedItem[];
  typeFilter: SavedItemType[];
  tagFilter: string[];
  availableTags: string[];
  filterOpen: boolean;
  sortBy: ScreenieSort;
  onFilterOpenChange: (open: boolean) => void;
  onTypeFilterChange: (types: SavedItemType[]) => void;
  onTagFilterChange: (tags: string[]) => void;
  onClearFilters: () => void;
  onTagClick: (tag: string) => void;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
  onOpenDetail: (item: SavedItem) => void;
  onDeletePermanently?: (item: SavedItem) => void;
}

export function TagsView({
  items,
  typeFilter,
  tagFilter,
  availableTags,
  filterOpen,
  sortBy,
  onFilterOpenChange,
  onTypeFilterChange,
  onTagFilterChange,
  onClearFilters,
  onTagClick,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onDeletePermanently
}: TagsViewProps) {
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.status !== 'active') {
        continue;
      }
      for (const tag of item.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const results = searchSavedItems(items, {
    text: '',
    filter: 'tags',
    sortBy: sortBy === 'best-match' ? 'newest' : sortBy,
    types: typeFilter.length > 0 ? typeFilter : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined
  });

  return (
    <div className="saved-view page-stack">
      <PageHeader
        titleId="tags-title"
        title="Tags"
        subtitle="Browse saved content by tag."
        actions={
          <FilterMenu
            open={filterOpen}
            typeFilter={typeFilter}
            tagFilter={tagFilter}
            availableTags={availableTags}
            onOpenChange={onFilterOpenChange}
            onTypeFilterChange={onTypeFilterChange}
            onTagFilterChange={onTagFilterChange}
            onClear={onClearFilters}
          />
        }
      />

      <SurfaceCard as="section" className="content-section" aria-labelledby="tags-title">
        {tagCounts.length > 0 ? (
          <>
            <SectionLabel>All tags</SectionLabel>
            <div className="tag-browser" aria-label="All tags">
            {tagCounts.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip tag-chip--button${tagFilter.includes(tag) ? ' tag-chip--active' : ''}`}
                aria-pressed={tagFilter.includes(tag)}
                onClick={() => onTagClick(tag)}
              >
                {tag}
                <span className="tag-count">{count}</span>
              </button>
            ))}
            </div>
          </>
        ) : (
          <p className="text-muted">No tags yet. Tags are added when you save links, snippets, and images.</p>
        )}

        <p className="text-muted saved-view__meta">
          {results.length} {results.length === 1 ? 'item' : 'items'}
          {tagFilter.length > 0 ? ` tagged ${tagFilter.join(', ')}` : ' with tags'}.
        </p>

        {results.length > 0 ? (
          <div className="item-list">
            {results.map((result) => (
              <SavedItemCard
                key={result.item.id}
                item={result.item}
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
            <h2>No tagged items.</h2>
            <p>Select a tag above or save content with tags.</p>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
