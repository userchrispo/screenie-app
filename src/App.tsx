import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PageHeader } from './components/PageHeader';
import { SavedItemCard } from './components/SavedItemCard';
import { SurfaceCard } from './components/SurfaceCard';
import { FilterMenu } from './components/FilterMenu';
import { ViewTransition } from './components/ViewTransition';
import { ConfirmDialog } from './components/ConfirmDialog';
import type {
  CreateSavedItemInput,
  SavedItem,
  SavedItemType,
  ScreenieFilter,
  ScreenieSort,
  ScreenieView
} from './domain/savedItem';
import { normalizeTags } from './domain/savedItem';
import {
  captureDraftToCreateInput,
  parseCaptureBridgeMessage,
  type CaptureDraft
} from './domain/captureDraft';
import { FindView } from './features/find/FindView';
import { InboxView } from './features/inbox/InboxView';
import { ExtensionCaptureDialog } from './features/inbox/ExtensionCaptureDialog';
import { LibraryView } from './features/library/LibraryView';
import { TagsView } from './features/tags/TagsView';
import { ItemDetailPanel } from './features/item/ItemDetailPanel';
import { NotificationsPanel } from './features/notifications/NotificationsPanel';
import { IntegrationsView } from './features/integrations/IntegrationsView';
import { TemplatesView } from './features/templates/TemplatesView';
import { SettingsView } from './features/settings/SettingsView';
import type { CaptureTemplate } from './features/templates/templatesData';
import { useSavedItems } from './features/screenie/useSavedItems';
import { searchSavedItems } from './lib/search/searchSavedItems';
import { isModKey } from './lib/keyboardShortcuts';
import { canRunOcr, recognizeImageText } from './lib/ocr/localOcr';

const filterSubtitles: Record<ScreenieFilter, string> = {
  inbox: 'Uncategorized saves land here before you assign a project.',
  library: 'Every saved item across your workspace.',
  favorites: 'Items you marked as favorites.',
  tags: 'Browse saved content by tag.',
  trash: 'Items moved to trash stay here until restored or deleted.'
};

const filterTitles: Record<ScreenieFilter, string> = {
  inbox: 'Inbox',
  library: 'Library',
  favorites: 'Favorites',
  tags: 'Tags',
  trash: 'Trash'
};

function isBrowseFilter(view: ScreenieView): view is ScreenieFilter {
  return view !== 'find' && view !== 'integrations' && view !== 'templates' && view !== 'settings';
}

export function App() {
  const [activeView, setActiveView] = useState<ScreenieView>('inbox');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<ScreenieSort>('best-match');
  const [typeFilter, setTypeFilter] = useState<SavedItemType[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [captureTemplate, setCaptureTemplate] = useState<CaptureTemplate | null>(null);
  const [captureFocusToken, setCaptureFocusToken] = useState(0);
  const [pendingSearchFocus, setPendingSearchFocus] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<SavedItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [extensionDraft, setExtensionDraft] = useState<CaptureDraft | null>(null);
  const [extensionSaving, setExtensionSaving] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    items,
    projects,
    counts,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    createProject,
    renameProject,
    removeProject,
    clearAll,
    exportWorkspace,
    importWorkspace,
    resetDemo
  } = useSavedItems();

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const item of items) {
      if (item.status === 'active') {
        for (const tag of item.tags) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).sort();
  }, [items]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const activeFilter: ScreenieFilter = activeView === 'find' ? 'library' : isBrowseFilter(activeView) ? activeView : 'library';

  const filteredResults = useMemo(
    () =>
      searchSavedItems(items, {
        text: '',
        filter: activeFilter,
        sortBy: sortBy === 'best-match' ? 'newest' : sortBy,
        types: typeFilter.length > 0 ? typeFilter : undefined,
        tags: tagFilter.length > 0 ? tagFilter : undefined,
        projectId: projectId ?? undefined
      }),
    [activeFilter, items, projectId, sortBy, tagFilter, typeFilter]
  );

  const closeOverlays = useCallback(() => {
    setSelectedItemId(null);
    setNotificationsOpen(false);
    setFilterOpen(false);
  }, []);

  function focusSearch() {
    setActiveView('find');
    setPendingSearchFocus(true);
  }

  function focusCapture() {
    setActiveView('inbox');
    setCaptureFocusToken((value) => value + 1);
  }

  function clearFilters() {
    setTypeFilter([]);
    setTagFilter([]);
  }

  function handleNavigate(view: ScreenieView) {
    if (view !== 'find') {
      setProjectId(null);
    }
    setActiveView(view);
  }

  function handleTagClick(tag: string) {
    setTagFilter([tag]);
    setActiveView('tags');
  }

  function handleSelectProject(id: string) {
    setProjectId(id);
    setActiveView('find');
  }

  function handleSelectTemplate(template: CaptureTemplate) {
    setCaptureTemplate(template);
    setActiveView('inbox');
    setCaptureFocusToken((value) => value + 1);
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

  const runOcrForItem = useCallback(
    async (item: SavedItem) => {
      if (!canRunOcr(item) || !item.imageDataUrl) {
        return;
      }

      const language = item.ocrLanguage ?? 'eng';
      await updateItem(item.id, {
        ocrStatus: 'processing',
        ocrLanguage: language,
        ocrError: null
      });

      try {
        const result = await recognizeImageText(item.imageDataUrl, language);
        await updateItem(item.id, {
          extractedText: result.text || undefined,
          ocrStatus: 'ready',
          ocrLanguage: result.language,
          ocrError: null
        });
      } catch (err) {
        await updateItem(item.id, {
          ocrStatus: 'failed',
          ocrLanguage: language,
          ocrError: err instanceof Error ? err.message : 'Local OCR failed.'
        });
      }
    },
    [updateItem]
  );

  const createItemWithOcr = useCallback(
    async (input: CreateSavedItemInput) => {
      const item = await createItem(input);
      if (item.ocrStatus === 'queued' && canRunOcr(item)) {
        void runOcrForItem(item);
      }
      return item;
    },
    [createItem, runOcrForItem]
  );

  async function deletePermanently(item: SavedItem) {
    setPendingDeleteItem(item);
  }

  async function confirmDeletePermanently() {
    if (!pendingDeleteItem) {
      return;
    }

    setDeleteBusy(true);
    try {
      await deleteItem(pendingDeleteItem.id);
      if (selectedItemId === pendingDeleteItem.id) {
        setSelectedItemId(null);
      }
      setPendingDeleteItem(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function saveItemDetail(
    id: string,
    input: { title: string; tags: string; projectId: string | null }
  ) {
    await updateItem(id, {
      title: input.title,
      tags: normalizeTags(input.tags.split(',').map((tag) => tag.trim())),
      projectId: input.projectId
    });
  }

  async function handleClearAll() {
    await clearAll();
    closeOverlays();
  }

  async function handleResetDemo() {
    await resetDemo();
    closeOverlays();
  }

  async function handleSaveExtensionDraft() {
    if (!extensionDraft) {
      return;
    }

    setExtensionSaving(true);
    try {
      const item = await createItemWithOcr(captureDraftToCreateInput(extensionDraft));
      setExtensionDraft(null);
      setSelectedItemId(item.id);
      setActiveView('inbox');
    } finally {
      setExtensionSaving(false);
    }
  }

  useEffect(() => {
    if (pendingSearchFocus && activeView === 'find') {
      searchInputRef.current?.focus();
      setPendingSearchFocus(false);
    }
  }, [activeView, pendingSearchFocus]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (selectedItemId) {
          setSelectedItemId(null);
          return;
        }
        if (notificationsOpen || filterOpen) {
          closeOverlays();
        }
      }

      if (isModKey(event) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (isModKey(event) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        focusCapture();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOverlays, filterOpen, notificationsOpen, selectedItemId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) {
        return;
      }

      const message = parseCaptureBridgeMessage(event.data);
      if (!message) {
        return;
      }

      setExtensionDraft(message.draft);
      setActiveView('inbox');
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const cardHandlers = {
    onToggleFavorite: (item: SavedItem) => void toggleFavorite(item),
    onMoveToTrash: (item: SavedItem) => void moveToTrash(item),
    onRestore: (item: SavedItem) => void restoreItem(item),
    onOpenDetail: (item: SavedItem) => setSelectedItemId(item.id),
    onTagClick: handleTagClick,
    onDeletePermanently: (item: SavedItem) => void deletePermanently(item)
  };

  const filterProps = {
    typeFilter,
    tagFilter,
    availableTags,
    filterOpen,
    onFilterOpenChange: setFilterOpen,
    onTypeFilterChange: setTypeFilter,
    onTagFilterChange: setTagFilter,
    onClearFilters: clearFilters
  };

  return (
    <div className="app-frame">
      <div className="screenie-shell">
        <Sidebar
          activeView={activeView}
          counts={counts}
          projects={projects}
          activeProjectId={projectId}
          onNavigate={handleNavigate}
          onSelectProject={handleSelectProject}
          onClearProject={() => setProjectId(null)}
          onAddProject={(name) => void createProject({ name })}
          onRenameProject={(id, name) => void renameProject(id, name)}
          onRemoveProject={(id) => void removeProject(id)}
        />
        <main className="app-main" aria-label="Screenie app">
          <div className="main-inner">
            <TopBar
              activeView={activeView}
              searchText={searchText}
              searchInputRef={searchInputRef}
              onSearchTextChange={setSearchText}
              onFocusSearch={focusSearch}
              onNavigateHome={() => setActiveView('inbox')}
              onOpenNotifications={() => setNotificationsOpen(true)}
              onNavigateSettings={() => setActiveView('settings')}
              onOpenFilter={() => setFilterOpen(true)}
            />

            {error ? (
              <div className="error-banner" role="alert">
                {error}
              </div>
            ) : null}

            <ViewTransition viewKey={activeView}>
              {activeView === 'inbox' ? (
                <InboxView
                  items={items}
                  isLoading={isLoading}
                  {...filterProps}
                  onCreate={createItemWithOcr}
                  initialCaptureMode={captureTemplate?.mode ?? null}
                  initialSnippet={captureTemplate?.mode === 'snippet' ? captureTemplate.body : ''}
                  initialLink={captureTemplate?.mode === 'link' ? captureTemplate.body : ''}
                  captureFocusToken={captureFocusToken}
                  {...cardHandlers}
                />
              ) : activeView === 'find' ? (
                <FindView
                  items={items}
                  filter="library"
                  searchText={searchText}
                  sortBy={sortBy}
                  typeFilter={typeFilter}
                  tagFilter={tagFilter}
                  projectId={projectId ?? undefined}
                  searchInputRef={searchInputRef}
                  onSearchTextChange={setSearchText}
                  onSortChange={setSortBy}
                  {...cardHandlers}
                />
              ) : activeView === 'library' ? (
                <LibraryView
                  items={items}
                  sortBy={sortBy}
                  {...filterProps}
                  {...cardHandlers}
                />
              ) : activeView === 'tags' ? (
                <TagsView items={items} sortBy={sortBy} {...filterProps} {...cardHandlers} />
              ) : activeView === 'integrations' ? (
                <IntegrationsView />
              ) : activeView === 'templates' ? (
                <TemplatesView onSelectTemplate={handleSelectTemplate} />
              ) : activeView === 'settings' ? (
                <SettingsView
                  onClearAll={handleClearAll}
                  onExportWorkspace={exportWorkspace}
                  onImportWorkspace={importWorkspace}
                  onResetDemo={handleResetDemo}
                />
              ) : (
                <div className="saved-view page-stack">
                  <PageHeader
                    titleId="saved-view-title"
                    title={filterTitles[activeView]}
                    subtitle={filterSubtitles[activeView]}
                    actions={
                      <FilterMenu
                        open={filterOpen}
                        typeFilter={typeFilter}
                        tagFilter={tagFilter}
                        availableTags={availableTags}
                        onOpenChange={setFilterOpen}
                        onTypeFilterChange={setTypeFilter}
                        onTagFilterChange={setTagFilter}
                        onClear={clearFilters}
                      />
                    }
                  />
                  <SurfaceCard as="section" className="content-section" aria-labelledby="saved-view-title">
                    <p className="text-muted saved-view__meta">
                      {filteredResults.length} {filteredResults.length === 1 ? 'item' : 'items'} in this view.
                    </p>

                    {filteredResults.length > 0 ? (
                      <div className="item-list">
                        {filteredResults.map((result) => (
                          <SavedItemCard
                            key={result.item.id}
                            item={result.item}
                            matchedText={result.matchedText}
                            matchSummary={result.matchSummary}
                            {...cardHandlers}
                          />
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
              )}
            </ViewTransition>
          </div>
        </main>
      </div>

      <ItemDetailPanel
        item={selectedItem}
        projects={projects}
        onClose={() => setSelectedItemId(null)}
        onSave={saveItemDetail}
        onToggleFavorite={(item) => void toggleFavorite(item)}
        onMoveToTrash={(item) => void moveToTrash(item)}
        onDeletePermanently={(item) => void deletePermanently(item)}
        onRunOcr={(item) => void runOcrForItem(item)}
      />
      <NotificationsPanel
        open={notificationsOpen}
        items={items}
        onClose={() => setNotificationsOpen(false)}
        onOpenItem={(item) => {
          setNotificationsOpen(false);
          setSelectedItemId(item.id);
        }}
      />
      <ExtensionCaptureDialog
        draft={extensionDraft}
        saving={extensionSaving}
        onSave={() => void handleSaveExtensionDraft()}
        onClose={() => setExtensionDraft(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteItem)}
        title="Delete permanently"
        body={
          pendingDeleteItem
            ? `Delete "${pendingDeleteItem.title}" permanently? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete permanently"
        danger
        busy={deleteBusy}
        onConfirm={() => void confirmDeletePermanently()}
        onClose={() => setPendingDeleteItem(null)}
      />
    </div>
  );
}
