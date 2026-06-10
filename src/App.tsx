import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SavedItemCard } from './components/SavedItemCard';
import type { SavedItem, ScreenieFilter, ScreenieSort } from './domain/savedItem';
import { FindView } from './features/find/FindView';
import { InboxView } from './features/inbox/InboxView';
import { useSavedItems } from './features/screenie/useSavedItems';
import { searchSavedItems } from './lib/search/searchSavedItems';

const filterTitles: Record<ScreenieFilter, string> = {
  inbox: 'Inbox',
  library: 'Library',
  favorites: 'Favorites',
  tags: 'Tags',
  trash: 'Trash'
};

export function App() {
  const [activeView, setActiveView] = useState<ScreenieFilter | 'find'>('inbox');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<ScreenieSort>('best-match');
  const { items, counts, isLoading, error, createItem, updateItem } = useSavedItems();

  const activeFilter: ScreenieFilter = activeView === 'find' ? 'inbox' : activeView;
  const filteredResults = useMemo(
    () =>
      searchSavedItems(items, {
        text: '',
        filter: activeFilter,
        sortBy: sortBy === 'best-match' ? 'newest' : sortBy
      }),
    [activeFilter, items, sortBy]
  );

  function focusSearch() {
    setActiveView('find');
  }

  async function toggleFavorite(item: SavedItem) {
    await updateItem(item.id, { isFavorite: !item.isFavorite });
  }

  async function moveToTrash(item: SavedItem) {
    await updateItem(item.id, { status: 'trash' });
  }

  async function restoreItem(item: SavedItem) {
    await updateItem(item.id, { status: 'active' });
  }

  return (
    <div className="screenie-shell">
      <Sidebar activeView={activeView} counts={counts} onNavigate={setActiveView} />
      <main className="app-main" aria-label="Screenie app">
        <TopBar
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onFocusSearch={focusSearch}
        />

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {activeView === 'inbox' ? (
          <InboxView
            items={items}
            isLoading={isLoading}
            onCreate={createItem}
            onToggleFavorite={(item) => void toggleFavorite(item)}
            onMoveToTrash={(item) => void moveToTrash(item)}
            onRestore={(item) => void restoreItem(item)}
          />
        ) : activeView === 'find' ? (
          <FindView
            items={items}
            filter="inbox"
            searchText={searchText}
            sortBy={sortBy}
            onSearchTextChange={setSearchText}
            onSortChange={setSortBy}
            onToggleFavorite={(item) => void toggleFavorite(item)}
            onMoveToTrash={(item) => void moveToTrash(item)}
            onRestore={(item) => void restoreItem(item)}
          />
        ) : (
          <section className="content-section saved-view" aria-labelledby="saved-view-title">
            <div className="section-header">
              <div>
                <h1 id="saved-view-title">{filterTitles[activeView]}</h1>
                <p>
                  {filteredResults.length} {filteredResults.length === 1 ? 'item' : 'items'} in this view.
                </p>
              </div>
              <button className="ghost-button" type="button">
                <SlidersHorizontal size={18} aria-hidden="true" />
                All items
              </button>
            </div>

            {filteredResults.length > 0 ? (
              <div className="item-list">
                {filteredResults.map((result) => (
                  <SavedItemCard
                    key={result.item.id}
                    item={result.item}
                    matchedText={result.matchedText}
                    onToggleFavorite={(item) => void toggleFavorite(item)}
                    onMoveToTrash={(item) => void moveToTrash(item)}
                    onRestore={(item) => void restoreItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>Nothing here yet.</h2>
                <p>Saved content will appear here once it matches this view.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
