import type { SavedItem, SavedItemType, ScreenieSort } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SectionLabel } from '../../components/SectionLabel';
import { SurfaceCard } from '../../components/SurfaceCard';
import { FilterMenu } from '../../components/FilterMenu';
import { searchSavedItems } from '../../lib/search/searchSavedItems';

const TYPE_SECTIONS: { type: SavedItemType; label: string }[] = [
  { type: 'link', label: 'Links' },
  { type: 'screenshot', label: 'Screenshots' },
  { type: 'snippet', label: 'Snippets' },
  { type: 'image', label: 'Images' }
];

interface LibraryViewProps {
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
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
  onOpenDetail: (item: SavedItem) => void;
  onTagClick: (tag: string) => void;
  onDeletePermanently?: (item: SavedItem) => void;
}

export function LibraryView({
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
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onTagClick,
  onDeletePermanently
}: LibraryViewProps) {
  const baseResults = searchSavedItems(items, {
    text: '',
    filter: 'library',
    sortBy: sortBy === 'best-match' ? 'newest' : sortBy,
    types: typeFilter.length > 0 ? typeFilter : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined
  });

  const sections = TYPE_SECTIONS.map((section) => ({
    ...section,
    results: baseResults.filter((result) => result.item.type === section.type)
  })).filter((section) => section.results.length > 0);

  return (
    <div className="saved-view page-stack">
      <PageHeader
        titleId="library-title"
        title="Library"
        subtitle="Every saved item across your workspace."
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

      <SurfaceCard as="section" className="content-section" aria-labelledby="library-title">
        <p className="text-muted saved-view__meta">
          {baseResults.length} {baseResults.length === 1 ? 'item' : 'items'} in your library.
        </p>

        {sections.length > 0 ? (
          <div className="library-sections">
            {sections.map((section) => (
              <section key={section.type} className="library-section" aria-label={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                <div className="item-list">
                  {section.results.map((result) => (
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
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nothing here yet.</h2>
            <p>Saved content will appear here once it matches this view.</p>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
