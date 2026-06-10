import { ArrowDown, FileImage, Link, Type } from 'lucide-react';
import type { SavedItem } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { CapturePanel } from './CapturePanel';

interface InboxViewProps {
  items: SavedItem[];
  isLoading: boolean;
  onCreate: Parameters<typeof CapturePanel>[0]['onCreate'];
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
}

export function InboxView({
  items,
  isLoading,
  onCreate,
  onToggleFavorite,
  onMoveToTrash,
  onRestore
}: InboxViewProps) {
  const activeItems = items.filter((item) => item.status === 'active');
  const recentItems = activeItems.slice(0, 4);

  return (
    <div className="page-stack">
      <section className="hero-panel" aria-labelledby="inbox-title">
        <div>
          <h1 id="inbox-title">Inbox</h1>
          <p>All your saved content, in one place.</p>
        </div>
        <div className="floating-cards" aria-hidden="true">
          <div className="float-card float-link">
            <Link size={24} />
            <span>https://www.notion.so/ho...</span>
          </div>
          <div className="float-card float-shot">
            <span className="mini-preview" />
            <div>
              <strong>Design inspiration</strong>
              <span>PNG - 1.2 MB</span>
            </div>
          </div>
          <div className="float-card float-text">
            <Type size={24} />
            <span>User onboarding flow</span>
          </div>
        </div>
      </section>

      <div className="capture-wrap">
        <ArrowDown className="capture-arrow" size={34} aria-hidden="true" />
        <CapturePanel onCreate={onCreate} />
      </div>

      <section className="content-section" aria-labelledby="recent-title">
        <div className="section-header">
          <div>
            <h2 id="recent-title">Recently saved</h2>
            <p>{activeItems.length} active items indexed locally.</p>
          </div>
          <div className="type-summary" aria-label="Saved item types">
            <span><FileImage size={16} /> Screenshots</span>
            <span><Link size={16} /> Links</span>
            <span><Type size={16} /> Snippets</span>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state" role="status">Loading saved content...</div>
        ) : recentItems.length > 0 ? (
          <div className="item-list">
            {recentItems.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                onToggleFavorite={onToggleFavorite}
                onMoveToTrash={onMoveToTrash}
                onRestore={onRestore}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Save your first link, screenshot, or snippet above.</div>
        )}
      </section>
    </div>
  );
}
