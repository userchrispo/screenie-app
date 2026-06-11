import type { RefObject } from 'react';
import { Bell, Search, Settings, SlidersHorizontal } from 'lucide-react';
import { CommandKey } from './CommandKey';
import type { ScreenieView } from '../domain/savedItem';
import { modShortcutKeys } from '../lib/keyboardShortcuts';

const viewLabels: Record<ScreenieView, string> = {
  inbox: 'Inbox',
  find: 'Find',
  library: 'Library',
  favorites: 'Favorites',
  tags: 'Tags',
  trash: 'Trash',
  integrations: 'Integrations',
  templates: 'Templates',
  settings: 'Settings'
};

interface TopBarProps {
  activeView: ScreenieView;
  searchText: string;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSearchTextChange: (value: string) => void;
  onFocusSearch: () => void;
  onNavigateHome: () => void;
  onOpenNotifications: () => void;
  onNavigateSettings: () => void;
  onOpenFilter: () => void;
}

export function TopBar({
  activeView,
  searchText,
  searchInputRef,
  onSearchTextChange,
  onFocusSearch,
  onNavigateHome,
  onOpenNotifications,
  onNavigateSettings,
  onOpenFilter
}: TopBarProps) {
  const isFind = activeView === 'find';
  const searchLabel = isFind ? 'Search everything in Screenie' : 'Search saved items';
  const searchPlaceholder = isFind
    ? 'that pricing screenshot from last week'
    : 'Search saved items...';

  return (
    <header className="topbar">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <button className="breadcrumbs__root" type="button" onClick={onNavigateHome}>
          Screenie
        </button>
        <span className="breadcrumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="breadcrumbs__current" aria-current="page">
          {viewLabels[activeView]}
        </span>
      </nav>

      <div className="topbar__actions">
        <label className="top-search surface-card">
          <span className="icon-slot">
            <Search size={18} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span className="sr-only">{searchLabel}</span>
          <input
            ref={searchInputRef}
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            onFocus={onFocusSearch}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
          />
          <CommandKey keys={modShortcutKeys('K')} label="Focus search" />
        </label>

        <button className="icon-button" type="button" aria-label="Notifications" onClick={onOpenNotifications}>
          <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button className="icon-button" type="button" aria-label="Settings" onClick={onNavigateSettings}>
          <Settings size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button className="icon-button mobile-filter" type="button" aria-label="Filter items" onClick={onOpenFilter}>
          <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
