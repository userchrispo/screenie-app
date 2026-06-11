import { useEffect, useId, useRef } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import type { SavedItemType } from '../domain/savedItem';

const ALL_TYPES: SavedItemType[] = ['link', 'screenshot', 'snippet', 'image'];

const TYPE_LABELS: Record<SavedItemType, string> = {
  link: 'Links',
  screenshot: 'Screenshots',
  snippet: 'Snippets',
  image: 'Images'
};

interface FilterMenuProps {
  open: boolean;
  typeFilter: SavedItemType[];
  tagFilter: string[];
  availableTags: string[];
  onOpenChange: (open: boolean) => void;
  onTypeFilterChange: (types: SavedItemType[]) => void;
  onTagFilterChange: (tags: string[]) => void;
  onClear: () => void;
}

export function FilterMenu({
  open,
  typeFilter,
  tagFilter,
  availableTags,
  onOpenChange,
  onTypeFilterChange,
  onTagFilterChange,
  onClear
}: FilterMenuProps) {
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const hasFilters = typeFilter.length > 0 || tagFilter.length > 0;
  const label = hasFilters
    ? `${typeFilter.length + tagFilter.length} filters`
    : 'All items';

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  function toggleType(type: SavedItemType) {
    if (typeFilter.includes(type)) {
      onTypeFilterChange(typeFilter.filter((value) => value !== type));
      return;
    }
    onTypeFilterChange([...typeFilter, type]);
  }

  function toggleTag(tag: string) {
    if (tagFilter.includes(tag)) {
      onTagFilterChange(tagFilter.filter((value) => value !== tag));
      return;
    }
    onTagFilterChange([...tagFilter, tag]);
  }

  return (
    <div className="filter-menu" ref={panelRef}>
      <button
        className="filter-button"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Filter saved items"
        onClick={() => onOpenChange(!open)}
      >
        <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {open ? (
        <div id={menuId} className="filter-menu__panel popover-panel" role="dialog" aria-label="Filter options">
          <div className="filter-menu__header">
            <strong>Filter items</strong>
            <button type="button" className="icon-button" aria-label="Close filters" onClick={() => onOpenChange(false)}>
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <fieldset className="filter-menu__group">
            <legend>Type</legend>
            <div className="filter-menu__options">
              {ALL_TYPES.map((type) => (
                <label key={type} className="filter-option">
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  <span>{TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {availableTags.length > 0 ? (
            <fieldset className="filter-menu__group">
              <legend>Tags</legend>
              <div className="filter-menu__tags">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip tag-chip--button${tagFilter.includes(tag) ? ' tag-chip--active' : ''}`}
                    aria-pressed={tagFilter.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {hasFilters ? (
            <button type="button" className="filter-menu__clear" onClick={onClear}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
