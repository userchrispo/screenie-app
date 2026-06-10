import {
  Bookmark,
  Box,
  Folder,
  Inbox,
  LayoutTemplate,
  Puzzle,
  Sparkles,
  Star,
  Tags,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import type { ScreenieFilter } from '../domain/savedItem';

export interface SidebarCounts {
  inbox: number;
  library: number;
  favorites: number;
  tags: number;
  trash: number;
}

interface SidebarProps {
  activeView: ScreenieFilter | 'find';
  counts: SidebarCounts;
  onNavigate: (view: ScreenieFilter | 'find') => void;
}

interface NavItem {
  id: ScreenieFilter | 'find';
  label: string;
  icon: LucideIcon;
  count?: number;
}

export function Sidebar({ activeView, counts, onNavigate }: SidebarProps) {
  const primaryItems: NavItem[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox },
    { id: 'find', label: 'Find', icon: Box },
    { id: 'library', label: 'Library', icon: Bookmark },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'tags', label: 'Tags', icon: Tags },
    { id: 'trash', label: 'Trash', icon: Trash2, count: counts.trash }
  ];

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <button className="brand" type="button" onClick={() => onNavigate('inbox')}>
        <span className="brand-icon" aria-hidden="true">
          <span />
        </span>
        <span>Screenie</span>
      </button>

      <nav className="nav-group" aria-label="Saved content">
        {primaryItems.map((item) => (
          <SidebarButton
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      <nav className="nav-group sidebar-secondary" aria-label="Workspace tools">
        <button className="nav-item" type="button">
          <Puzzle size={20} aria-hidden="true" />
          <span>Integrations</span>
        </button>
        <button className="nav-item" type="button">
          <LayoutTemplate size={20} aria-hidden="true" />
          <span>Templates</span>
        </button>
      </nav>

      <div className="quick-card" aria-label="Quick save shortcut">
        <Sparkles size={18} aria-hidden="true" />
        <div>
          <strong>Quick save</strong>
          <span>Ctrl + Shift + S</span>
        </div>
      </div>

      <div className="team-card">
        <span className="avatar" aria-hidden="true">A</span>
        <div>
          <strong>Acme Team</strong>
          <span>Pro Plan</span>
        </div>
        <Folder size={18} aria-hidden="true" />
      </div>
    </aside>
  );
}

function SidebarButton({
  item,
  isActive,
  onClick
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      className="nav-item"
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{item.label}</span>
      {typeof item.count === 'number' && <span className="nav-count">{item.count}</span>}
    </button>
  );
}
