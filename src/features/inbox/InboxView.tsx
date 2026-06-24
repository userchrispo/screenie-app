import { CheckCircle2, FileImage, FolderOpen, Link, Puzzle, ScanText, Type } from 'lucide-react';
import type { SavedItem, SavedItemType } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { FilterMenu } from '../../components/FilterMenu';
import { StatCard } from '../../components/StatCard';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonList } from '../../components/Skeleton';
import { tagColorClass } from '../../lib/tagColor';
import { CapturePanel } from './CapturePanel';

interface InboxViewProps {
  items: SavedItem[];
  isLoading: boolean;
  typeFilter: SavedItemType[];
  tagFilter: string[];
  availableTags: string[];
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onTypeFilterChange: (types: SavedItemType[]) => void;
  onTagFilterChange: (tags: string[]) => void;
  onClearFilters: () => void;
  onCreate: Parameters<typeof CapturePanel>[0]['onCreate'];
  initialCaptureMode?: 'link' | 'snippet' | null;
  initialSnippet?: string;
  initialLink?: string;
  initialTags?: string;
  captureFocusToken?: number;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
  onOpenDetail: (item: SavedItem) => void;
  onTagClick: (tag: string) => void;
}

export function InboxView({
  items,
  isLoading,
  typeFilter,
  tagFilter,
  availableTags,
  filterOpen,
  onFilterOpenChange,
  onTypeFilterChange,
  onTagFilterChange,
  onClearFilters,
  onCreate,
  initialCaptureMode,
  initialSnippet,
  initialLink,
  initialTags,
  captureFocusToken,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onTagClick
}: InboxViewProps) {
  const inboxItems = items.filter((item) => item.status === 'active' && !item.projectId);
  const recentItems = inboxItems.slice(0, 8);
  const ocrQueuedItems = inboxItems.filter(
    (item) =>
      (item.type === 'screenshot' || item.type === 'image') &&
      !item.extractedText &&
      Boolean(item.imageDataUrl || item.mimeType)
  );
  const ocrReadyItems = inboxItems.filter((item) => item.extractedText);
  const needsReviewItems = inboxItems.filter((item) => !item.projectId);
  const topTags = getTopTags(inboxItems, 8);
  const typeCounts = getTypeCounts(inboxItems);

  return (
    <div className="inbox-view page-stack">
      <PageHeader
        titleId="inbox-title"
        eyebrow="Workspace"
        title="Inbox"
        subtitle="Capture anything, then triage it into a project when you're ready."
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

      <section className="capture-region" aria-label="Capture workspace">
        <CapturePanel
          onCreate={onCreate}
          initialMode={initialCaptureMode ?? null}
          initialSnippet={initialSnippet}
          initialLink={initialLink}
          initialTags={initialTags}
          captureFocusToken={captureFocusToken}
        />
      </section>

      <div className="stat-grid" aria-label="Inbox intake status">
        <StatCard
          label="Unassigned"
          value={inboxItems.length}
          icon={<FolderOpen size={16} strokeWidth={1.5} />}
        />
        <StatCard
          label="OCR queued"
          value={ocrQueuedItems.length}
          tone="amber"
          icon={<ScanText size={16} strokeWidth={1.5} />}
        />
        <StatCard
          label="OCR ready"
          value={ocrReadyItems.length}
          tone="green"
          icon={<CheckCircle2 size={16} strokeWidth={1.5} />}
        />
        <StatCard
          label="Needs a project"
          value={needsReviewItems.length}
          tone="blue"
          icon={<Puzzle size={16} strokeWidth={1.5} />}
        />
      </div>

      {topTags.length > 0 ? (
        <div className="inbox-tags" aria-label="Frequent tags">
          <span className="inbox-tags__label">Jump to a tag</span>
          <div className="tag-cloud">
            {topTags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip tag-chip--button ${tagColorClass(tag)}`}
                onClick={() => onTagClick(tag)}
              >
                {tag}
                <span className="tag-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <SurfaceCard as="section" className="content-section" aria-labelledby="recent-title">
        <div className="section-header">
          <div>
            <h2 id="recent-title">Recently saved</h2>
            <p>{inboxItems.length} uncategorized {inboxItems.length === 1 ? 'item' : 'items'} in your inbox.</p>
          </div>
          <div className="type-summary" aria-label="Saved item types">
            <span>
              <FileImage size={16} strokeWidth={1.5} /> {typeCounts.screenshot} Screenshots
            </span>
            <span>
              <Link size={16} strokeWidth={1.5} /> {typeCounts.link} Links
            </span>
            <span>
              <Type size={16} strokeWidth={1.5} /> {typeCounts.snippet} Snippets
            </span>
          </div>
        </div>

        {isLoading ? (
          <SkeletonList count={4} label="Loading saved content" />
        ) : recentItems.length > 0 ? (
          <div className="item-list dashboard-card-grid">
            {recentItems.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                onToggleFavorite={onToggleFavorite}
                onMoveToTrash={onMoveToTrash}
                onRestore={onRestore}
                onOpenDetail={onOpenDetail}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileImage size={22} strokeWidth={1.5} />}
            title="Your inbox is empty."
            description="Save your first link, screenshot, or snippet above."
          />
        )}
      </SurfaceCard>
    </div>
  );
}

function getTypeCounts(items: SavedItem[]): Record<SavedItemType, number> {
  return items.reduce<Record<SavedItemType, number>>(
    (counts, item) => ({
      ...counts,
      [item.type]: counts[item.type] + 1
    }),
    {
      image: 0,
      link: 0,
      screenshot: 0,
      snippet: 0
    }
  );
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
