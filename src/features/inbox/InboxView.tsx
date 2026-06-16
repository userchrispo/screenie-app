import { CheckCircle2, FileImage, FolderOpen, Image, Link, Puzzle, ScanText, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SavedItem, SavedItemType } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { FilterMenu } from '../../components/FilterMenu';
import { formatBytes } from '../../lib/format';
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

  return (
    <div className="page-stack">
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

      <section className="capture-stage" aria-label="Capture workspace">
        <div className="capture-decor" aria-hidden={previewItems.length === 0}>
          <div className="pastel-field" aria-hidden="true" />
          {previewItems.length > 0 ? (
            <div className="floating-cards" aria-label="Recent inbox previews">
              {previewItems.slice(0, 3).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`float-card-button ${getFloatPositionClass(item.type, index)}`}
                  onClick={() => onOpenDetail(item)}
                  aria-label={`Open ${item.title}`}
                >
                  <SurfaceCard className="float-card">
                    <FloatingPreview item={item} />
                  </SurfaceCard>
                </button>
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

      <SurfaceCard as="section" className="content-section intake-review" aria-labelledby="intake-review-title">
        <div className="section-header">
          <div>
            <h2 id="intake-review-title">Intake review</h2>
            <p className="text-muted">New captures stay local until you assign a project or tag pass.</p>
          </div>
          <span className="status-badge status-badge--progress">Extension ready</span>
        </div>

        <div className="intake-review__grid" aria-label="Inbox intake status">
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

      <SurfaceCard as="section" className="content-section" aria-labelledby="recent-title">
        <div className="section-header">
          <div>
            <h2 id="recent-title">Recently saved</h2>
            <p className="text-muted">{inboxItems.length} uncategorized items in your inbox.</p>
          </div>
          <div className="type-summary" aria-label="Saved item types">
            <span>
              <FileImage size={18} strokeWidth={1.5} /> Screenshots
            </span>
            <span>
              <Link size={18} strokeWidth={1.5} /> Links
            </span>
            <span>
              <Type size={18} strokeWidth={1.5} /> Snippets
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state" role="status">
            Loading saved content...
          </div>
        ) : recentItems.length > 0 ? (
          <div className="item-list">
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
    return (
      <>
        <span className="icon-slot">
          <Link size={24} strokeWidth={1.5} />
        </span>
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
      {item.imageDataUrl ? (
        <span className="mini-preview" style={{ backgroundImage: `url(${item.imageDataUrl})` }} />
      ) : (
        <span className="icon-slot">
          {item.type === 'image' ? (
            <Image size={24} strokeWidth={1.5} />
          ) : (
            <FileImage size={24} strokeWidth={1.5} />
          )}
        </span>
      )}
      <div>
        <strong>{truncate(item.title, 22)}</strong>
        <span>{formatBytes(item.sizeBytes) ?? 'PNG'}</span>
      </div>
    </>
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

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
