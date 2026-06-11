import { X } from 'lucide-react';
import type { SavedItem } from '../../domain/savedItem';
import { formatItemDate } from '../../lib/format';
import { SetupCard } from '../../components/SetupCard';
import { SurfaceCard } from '../../components/SurfaceCard';

interface NotificationsPanelProps {
  open: boolean;
  items: SavedItem[];
  onClose: () => void;
  onOpenItem: (item: SavedItem) => void;
}

export function NotificationsPanel({ open, items, onClose, onOpenItem }: NotificationsPanelProps) {
  if (!open) {
    return null;
  }

  const recent = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="app-overlay" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="aside"
        className="slide-panel slide-panel--narrow"
        role="dialog"
        aria-label="Notifications"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="slide-panel__header">
          <h2>Recent activity</h2>
          <button type="button" className="icon-button" aria-label="Close notifications" onClick={onClose}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        {recent.length > 0 ? (
          <ul className="notification-list">
            {recent.map((item) => (
              <li key={item.id}>
                <button type="button" className="notification-item" onClick={() => onOpenItem(item)}>
                  <SetupCard
                    icon={<span className="notification-item__dot" aria-hidden="true" />}
                    title={item.title}
                    caption={`${item.type} · ${formatItemDate(item.updatedAt)}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No recent saves yet.</p>
        )}
      </SurfaceCard>
    </div>
  );
}
