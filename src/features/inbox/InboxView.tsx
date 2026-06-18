import { CheckCircle2, FileImage, FolderOpen, Image, Link, Puzzle, ScanText, Type } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { SavedItem, SavedItemType } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { FilterMenu } from '../../components/FilterMenu';
import { formatBytes } from '../../lib/format';
import { getSavedItemPreviewImage } from '../../lib/previewImages';
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
  captureFocusToken,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onTagClick
}: InboxViewProps) {
  const inboxItems = items.filter((item) => item.status === 'active' && !item.projectId);
  const previewItems = inboxItems.slice(0, 3);
  const recentItems = inboxItems.slice(0, 4);
  const ocrQueuedItems = inboxItems.filter(
    (item) =>
      (item.type === 'screenshot' || item.type === 'image') &&
      !item.extractedText &&
      Boolean(item.imageDataUrl || item.mimeType)
  );
  const ocrReadyItems = inboxItems.filter((item) => item.extractedText);
  const needsReviewItems = inboxItems.slice(0, 3);
  const topTags = getTopTags(inboxItems, 5);
  const typeCounts = getTypeCounts(inboxItems);
  const latestItem = inboxItems[0];

  return (
    <div className="inbox-view page-stack dashboard-view dashboard-view--inbox">
      <PageHeader
        titleId="inbox-title"
        title="Inbox"
        subtitle="Uncategorized saves land here before you assign a project."
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

      <div className="dashboard-layout dashboard-layout--inbox" aria-labelledby="inbox-title">
        <section className="capture-stage dashboard-layout__main inbox-dashboard__capture" aria-label="Capture workspace">
        <div className="capture-decor" aria-hidden={previewItems.length === 0}>
          <div className="pastel-field" aria-hidden="true" />
          {previewItems.length > 0 ? (
            <div className="floating-cards" aria-label="Recent inbox previews">
              {previewItems.slice(0, 3).map((item, index) => (
                <div
                  key={item.id}
                  className={`float-card-button ${getFloatPositionClass(item.type, index)}`}
                  aria-hidden="true"
                >
                  <SurfaceCard className="float-card">
                    <FloatingPreview item={item} />
                  </SurfaceCard>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="capture-wrap">
          <CapturePanel
            onCreate={onCreate}
            initialMode={initialCaptureMode ?? null}
            initialSnippet={initialSnippet}
            initialLink={initialLink}
            captureFocusToken={captureFocusToken}
          />
        </div>

        <p className="capture-note" aria-hidden="true">
          <span>↑</span>
          Capture anything to add to your inbox
        </p>
      </section>

      <SurfaceCard
        as="section"
        className="content-section intake-review dashboard-layout__aside dashboard-rail-card"
        aria-labelledby="intake-review-title"
      >
        <div className="section-header">
          <div>
            <h2 id="intake-review-title">Intake review</h2>
            <p className="text-muted">New captures stay local until you assign a project or tag pass.</p>
          </div>
          <span className="status-badge status-badge--progress">Extension ready</span>
        </div>

        <div className="intake-review__grid dashboard-metric-grid" aria-label="Inbox intake status">
          <IntakeMetric
            icon={<FolderOpen size={18} strokeWidth={1.5} />}
            label="Unassigned"
            value={inboxItems.length}
          />
          <IntakeMetric
            icon={<ScanText size={18} strokeWidth={1.5} />}
            label="OCR queued"
            value={ocrQueuedItems.length}
          />
          <IntakeMetric
            icon={<CheckCircle2 size={18} strokeWidth={1.5} />}
            label="OCR ready"
            value={ocrReadyItems.length}
          />
          <IntakeMetric
            icon={<Puzzle size={18} strokeWidth={1.5} />}
            label="Review lane"
            value={needsReviewItems.length}
          />
        </div>

        {needsReviewItems.length > 0 ? (
          <div className="intake-review__queue" aria-label="Items ready for review">
            {needsReviewItems.map((item) => (
              <button type="button" key={item.id} className="intake-review__item" onClick={() => onOpenDetail(item)}>
                <span>{item.title}</span>
                <small>{item.projectId ? 'Project assigned' : 'Needs project'}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state--compact">Inbox review is clear.</div>
        )}
      </SurfaceCard>

      <SurfaceCard
        as="section"
        className="content-section dashboard-layout__aside dashboard-rail-card inbox-dashboard__memory"
        aria-labelledby="inbox-memory-title"
      >
        <div className="section-header">
          <div>
            <h2 id="inbox-memory-title">Memory map</h2>
            <p className="text-muted">A quick read on what this inbox is becoming.</p>
          </div>
        </div>

        <div className="inbox-dashboard__type-stack" aria-label="Inbox content breakdown">
          <DashboardBreakdown label="Links" value={typeCounts.link} total={inboxItems.length} />
          <DashboardBreakdown label="Screenshots" value={typeCounts.screenshot} total={inboxItems.length} />
          <DashboardBreakdown label="Images" value={typeCounts.image} total={inboxItems.length} />
          <DashboardBreakdown label="Snippets" value={typeCounts.snippet} total={inboxItems.length} />
        </div>

        {topTags.length > 0 ? (
          <div className="inbox-dashboard__tag-cloud" aria-label="Top inbox tags">
            {topTags.map(({ tag, count }) => (
              <button key={tag} type="button" className="tag-chip" onClick={() => onTagClick(tag)}>
                {tag}
                <span>{count}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state--compact">Tags will appear as captures are organized.</div>
        )}

        {latestItem ? (
          <button
            type="button"
            className="inbox-dashboard__latest"
            onClick={() => onOpenDetail(latestItem)}
            aria-label={`Open latest save ${latestItem.title}`}
          >
            <span>Latest save</span>
            <strong>{latestItem.title}</strong>
            <small>{getReadableType(latestItem.type)}</small>
          </button>
        ) : null}
      </SurfaceCard>

      <SurfaceCard
        as="section"
        className="content-section dashboard-layout__main dashboard-section dashboard-section--recent inbox-dashboard__recent"
        aria-labelledby="recent-title"
      >
        <div className="section-header">
          <div>
            <h2 id="recent-title">Recently saved</h2>
            <p className="text-muted">{inboxItems.length} uncategorized items in your inbox.</p>
          </div>
          <div className="type-summary" aria-label="Saved item types">
            <span>
              <FileImage size={18} strokeWidth={1.5} /> {typeCounts.screenshot} Screenshots
            </span>
            <span>
              <Link size={18} strokeWidth={1.5} /> {typeCounts.link} Links
            </span>
            <span>
              <Type size={18} strokeWidth={1.5} /> {typeCounts.snippet} Snippets
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state" role="status">
            Loading saved content...
          </div>
        ) : recentItems.length > 0 ? (
          <div className="item-list dashboard-card-grid inbox-dashboard__recent-grid">
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
          <div className="empty-state">Save your first link, screenshot, or snippet above.</div>
        )}
      </SurfaceCard>
      </div>
    </div>
  );
}

function IntakeMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="intake-metric">
      <span className="intake-metric__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="intake-metric__value">{value}</span>
      <span className="intake-metric__label">{label}</span>
    </div>
  );
}

function FloatingPreview({ item }: { item: SavedItem }) {
  if (item.type === 'link') {
    const previewImage = getSavedItemPreviewImage(item);

    return (
      <>
        <MiniPreviewImage
          src={previewImage}
          fallback={
            <span className="icon-slot">
              <Link size={24} strokeWidth={1.5} />
            </span>
          }
        />
        <span>{item.url ? truncate(item.url, 28) : item.title}</span>
      </>
    );
  }

  if (item.type === 'snippet') {
    return (
      <>
        <span className="icon-slot">
          <Type size={24} strokeWidth={1.5} />
        </span>
        <span>{truncate(item.title, 24)}</span>
      </>
    );
  }

  return (
    <>
      <MiniPreviewImage
        src={getSavedItemPreviewImage(item)}
        fallback={
        <span className="icon-slot">
          {item.type === 'image' ? (
            <Image size={24} strokeWidth={1.5} />
          ) : (
            <FileImage size={24} strokeWidth={1.5} />
          )}
        </span>
        }
      />
      <div>
        <strong>{truncate(item.title, 22)}</strong>
        <span>{formatBytes(item.sizeBytes) ?? 'PNG'}</span>
      </div>
    </>
  );
}

function MiniPreviewImage({ src, fallback }: { src: string | undefined; fallback: ReactNode }) {
  const [failedPreviewImage, setFailedPreviewImage] = useState<string | null>(null);
  const shouldShowPreviewImage = Boolean(src && failedPreviewImage !== src);

  useEffect(() => {
    setFailedPreviewImage(null);
  }, [src]);

  if (!shouldShowPreviewImage) {
    return <>{fallback}</>;
  }

  return (
    <span className="mini-preview">
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedPreviewImage(src ?? null)}
      />
    </span>
  );
}

function getFloatPositionClass(type: SavedItem['type'], index: number): string {
  if (type === 'link') {
    return 'float-link';
  }

  if (type === 'snippet') {
    return 'float-text';
  }

  return index % 2 === 0 ? 'float-shot' : 'float-text';
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

function DashboardBreakdown({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="dashboard-breakdown">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{percentage}%</small>
    </div>
  );
}

function getReadableType(type: SavedItemType): string {
  if (type === 'screenshot') {
    return 'Screenshot';
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
