import type { ReactNode, RefObject } from 'react';
import { CircleHelp, ScanText, Search, SlidersHorizontal, Star, Tags } from 'lucide-react';
import type { Project, SavedItem, SavedItemType, ScreenieFilter, ScreenieSort } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { searchSavedItems } from '../../lib/search/searchSavedItems';
import { recallSavedItems, type RecallResult, type RecallSignal } from '../../lib/recall/recallSavedItems';

interface FindViewProps {
  items: SavedItem[];
  projects: Project[];
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
  projects,
  filter,
  searchText,
  sortBy,
  typeFilter,
  tagFilter,
  projectId,
  onSearchTextChange,
  onSortChange,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onTagClick,
  onDeletePermanently
}: FindViewProps) {
  const scopedFilter = projectId ? 'library' : filter;
  const scopedItems = searchSavedItems(items, {
    text: '',
    filter: scopedFilter,
    sortBy: 'newest',
    types: typeFilter.length > 0 ? typeFilter : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    projectId
  }).map((result) => result.item);
  const results = searchSavedItems(scopedItems, {
    text: searchText,
    filter: 'library',
    sortBy,
    types: typeFilter.length > 0 ? typeFilter : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    projectId
  });
  const recallResults = recallSavedItems({
    items: scopedItems,
    projects,
    text: searchText,
    projectId,
    limit: 3
  });
  const bestRecall = searchText.trim() ? recallResults[0] : undefined;
  const relatedRecallItems = bestRecall
    ? bestRecall.relatedItemIds
        .map((id) => scopedItems.find((item) => item.id === id))
        .filter((item): item is SavedItem => Boolean(item))
    : [];
  const recallSuggestions = getRecallSuggestions(scopedItems, projects);
  const resultItems = results.map((result) => result.item);
  const favoriteCount = resultItems.filter((item) => item.isFavorite).length;
  const ocrMatchCount = results.filter(
    (result) => result.matchedText || result.matchSummary?.toLowerCase().includes('ocr')
  ).length;
  const topTags = getTopTags(resultItems, 6);
  const activeFilters = getActiveFilters({ filter, projectId, typeFilter, tagFilter });

  return (
    <div className="find-view page-stack dashboard-view dashboard-view--find">
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

      <div className="dashboard-layout dashboard-layout--find" aria-labelledby="find-title">
        <main className="dashboard-layout__main find-dashboard__results" aria-label="Search results">
          <section className="results-toolbar find-dashboard__summary" aria-label="Search results summary">
            <div>
              <p>{results.length} results found</p>
              <span>{getSearchSummary(searchText, activeFilters)}</span>
            </div>

            <div className="filter-chip-row find-dashboard__active-filters" aria-label="Active search filters">
              {activeFilters.length > 0 ? (
                activeFilters.map((activeFilter) => <span key={activeFilter}>{activeFilter}</span>)
              ) : (
                <span>All saved memory</span>
              )}
            </div>
          </section>

          {bestRecall ? (
            <RecallMemoryPanel result={bestRecall} relatedItems={relatedRecallItems} onOpenDetail={onOpenDetail} />
          ) : null}

          {results.length > 0 ? (
            <section className="content-section find-dashboard__result-section" aria-labelledby="find-results-title">
              <div className="section-header">
                <div>
                  <h2 id="find-results-title">Ranked matches</h2>
                  <p className="text-muted">Open a card to review the full save and edit its memory details.</p>
                </div>
              </div>

              <div className="item-list dashboard-card-grid find-dashboard__result-grid">
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
            </section>
          ) : (
            <div className="empty-state find-dashboard__empty">
              <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
              <h2>No saved item matched that search.</h2>
              <p>Try a tag, filename, URL, or remembered OCR text.</p>
              {recallSuggestions.length > 0 ? (
                <section className="find-recall-suggestions" aria-label="Recall search suggestions">
                  <span>Try searches like</span>
                  <div className="filter-chip-row">
                    {recallSuggestions.map((suggestion) => (
                      <button key={suggestion.label} type="button" onClick={() => onSearchTextChange(suggestion.query)}>
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}

          <p className="find-tip">
            <CircleHelp size={16} strokeWidth={1.5} aria-hidden="true" />
            <span>Tip: Search by text, tags, names, dates, OCR, and more.</span>
          </p>
        </main>

        <aside className="dashboard-layout__aside find-dashboard__rail" aria-label="Find insights">
          <SurfaceCard
            as="section"
            className="content-section dashboard-rail-card find-dashboard__query-card"
            aria-labelledby="find-query-title"
          >
            <div className="section-header">
              <div>
                <h2 id="find-query-title">Search memory</h2>
                <p className="text-muted">The current result set, summarized for quick scanning.</p>
              </div>
            </div>

            <div className="find-dashboard__metric-grid" aria-label="Search result metrics">
              <FindMetric icon={<Search size={18} strokeWidth={1.5} />} label="Matches" value={results.length} />
              <FindMetric icon={<Star size={18} strokeWidth={1.5} />} label="Favorites" value={favoriteCount} />
              <FindMetric icon={<ScanText size={18} strokeWidth={1.5} />} label="OCR hits" value={ocrMatchCount} />
            </div>
          </SurfaceCard>

          <SurfaceCard
            as="section"
            className="content-section dashboard-rail-card find-dashboard__refine-card"
            aria-labelledby="find-refine-title"
          >
            <div className="section-header">
              <div>
                <h2 id="find-refine-title">Refine lane</h2>
                <p className="text-muted">Use tags and type filters to narrow this workspace.</p>
              </div>
            </div>

            {topTags.length > 0 ? (
              <div className="find-dashboard__tag-cloud" aria-label="Top result tags">
                {topTags.map(({ tag, count }) => (
                  <button key={tag} type="button" className="tag-chip" onClick={() => onTagClick(tag)}>
                    <Tags size={14} strokeWidth={1.5} aria-hidden="true" />
                    {tag}
                    <span>{count}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state empty-state--compact">Matching tags will appear here.</div>
            )}
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}

function RecallMemoryPanel({
  result,
  relatedItems,
  onOpenDetail
}: {
  result: RecallResult;
  relatedItems: SavedItem[];
  onOpenDetail: (item: SavedItem) => void;
}) {
  return (
    <SurfaceCard
      as="section"
      className="content-section find-recall-card"
      aria-labelledby="best-memory-match-title"
    >
      <div className="section-header">
        <div>
          <h2 id="best-memory-match-title">Best memory match</h2>
          <p className="text-muted">Screenie found the strongest local clue and why it matched.</p>
        </div>
      </div>

      <div className="find-recall-card__body">
        <div className="find-recall-card__copy">
          <span className="find-recall-card__eyebrow">Quiet recall</span>
          <p className="find-recall-card__title">{result.item.title}</p>
          <p>{result.answer}</p>
          <EvidenceChips signals={result.signals} />
        </div>
        <button type="button" className="ghost-button ghost-button--primary" onClick={() => onOpenDetail(result.item)}>
          Open match
        </button>
      </div>

      {relatedItems.length > 0 ? (
        <div className="find-recall-card__related" aria-label="Related captures">
          <span>Related captures</span>
          <div>
            {relatedItems.map((item) => (
              <button key={item.id} type="button" onClick={() => onOpenDetail(item)}>
                {item.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </SurfaceCard>
  );
}

function EvidenceChips({ signals }: { signals: RecallSignal[] }) {
  const visibleSignals = signals.slice(0, 6);

  return (
    <div className="filter-chip-row find-recall-card__signals" aria-label="Recall evidence">
      {visibleSignals.map((signal) => (
        <span key={`${signal.kind}-${signal.label}`}>{signal.label}</span>
      ))}
    </div>
  );
}

function FindMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="find-dashboard__metric">
      <span aria-hidden="true">{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
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

function getRecallSuggestions(items: SavedItem[], projects: Project[]): Array<{ label: string; query: string }> {
  const suggestions: Array<{ label: string; query: string }> = [];
  const topTags = getTopTags(items, 3);
  const projectIds = new Set(items.map((item) => item.projectId).filter(Boolean));
  const topProject = projects.find((project) => projectIds.has(project.id));
  const hasOcrReadyItem = items.some((item) => item.extractedText || item.ocrStatus === 'ready');

  suggestions.push(...topTags.map(({ tag }) => ({ label: `#${tag}`, query: tag })));

  if (topProject) {
    suggestions.push({ label: topProject.name, query: topProject.name });
  }

  if (hasOcrReadyItem) {
    suggestions.push({ label: 'OCR-ready screenshots', query: 'screenshot OCR' });
  }

  return suggestions.slice(0, 5);
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
