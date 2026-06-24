import { Library } from 'lucide-react';
import type { SavedItem, SavedItemType, ScreenieSort } from '../../domain/savedItem';
import { FilterMenu } from '../../components/FilterMenu';
import { searchSavedItems } from '../../lib/search/searchSavedItems';
import { CollectionView } from '../collection/CollectionView';

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

  return (
    <CollectionView
      titleId="library-title"
      eyebrow="Workspace"
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
      metaText={`${baseResults.length} ${baseResults.length === 1 ? 'item' : 'items'} in your library.`}
      results={baseResults}
      empty={{
        icon: <Library size={22} strokeWidth={1.5} />,
        title: 'Nothing here yet.',
        description: 'Saved content will appear here once it matches this view.'
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
