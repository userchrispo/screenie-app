import { useMemo } from 'react';
import { Tags as TagsIcon } from 'lucide-react';
import type { SavedItem, SavedItemType, ScreenieSort } from '../../domain/savedItem';
import { SectionLabel } from '../../components/SectionLabel';
import { FilterMenu } from '../../components/FilterMenu';
import { searchSavedItems } from '../../lib/search/searchSavedItems';
import { tagColorClass } from '../../lib/tagColor';
import { CollectionView } from '../collection/CollectionView';

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

  const tagBrowser =
    tagCounts.length > 0 ? (
      <div className="library-section tags-browser">
        <SectionLabel>All tags</SectionLabel>
        <div className="tag-browser" aria-label="All tags">
          {tagCounts.map(([tag, count]) => {
            const active = tagFilter.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`tag-chip tag-chip--button ${tagColorClass(tag)}${active ? ' tag-chip--active' : ''}`}
                aria-pressed={active}
                onClick={() => onTagClick(tag)}
              >
                {tag}
                <span className="tag-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    ) : (
      <p className="text-muted">No tags yet. Tags are added when you save links, snippets, and images.</p>
    );

  return (
    <CollectionView
      titleId="tags-title"
      eyebrow="Browse"
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
      header={tagBrowser}
      metaText={`${results.length} ${results.length === 1 ? 'item' : 'items'}${
        tagFilter.length > 0 ? ` tagged ${tagFilter.join(', ')}` : ' with tags'
      }.`}
      results={results}
      empty={{
        icon: <TagsIcon size={22} strokeWidth={1.5} />,
        title: 'No tagged items.',
        description: 'Select a tag above or save content with tags.'
      }}
      handlers={{
        onToggleFavorite,
        onMoveToTrash,
        onRestore,
        onOpenDetail,
        onTagClick,
        onDeletePermanently
      }}
    />
  );
}
