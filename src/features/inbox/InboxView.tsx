import { FileImage, Image, Link, Type } from 'lucide-react';
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
