import { Bell, Command, Search, Settings, SlidersHorizontal } from 'lucide-react';

interface TopBarProps {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onFocusSearch: () => void;
}

export function TopBar({ searchText, onSearchTextChange, onFocusSearch }: TopBarProps) {
  return (
    <header className="topbar">
      <label className="top-search">
        <Search size={20} aria-hidden="true" />
        <span className="sr-only">Search saved items</span>
        <input
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          onFocus={onFocusSearch}
          placeholder="Search saved items..."
        />
        <kbd>
          <Command size={13} aria-hidden="true" /> K
        </kbd>
      </label>

      <button className="icon-button" type="button" aria-label="Notifications">
        <Bell size={21} aria-hidden="true" />
      </button>
      <button className="icon-button" type="button" aria-label="Settings">
        <Settings size={21} aria-hidden="true" />
      </button>
      <button className="icon-button mobile-filter" type="button" aria-label="Filter items">
        <SlidersHorizontal size={21} aria-hidden="true" />
      </button>
    </header>
  );
}
