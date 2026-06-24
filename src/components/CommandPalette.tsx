import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  keywords?: string;
  icon?: ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return commands;
    }

    return commands.filter((command) =>
      `${command.label} ${command.group ?? ''} ${command.keywords ?? ''}`.toLowerCase().includes(normalized)
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) {
    return null;
  }

  function runCommand(index: number) {
    const command = filtered[index];
    if (command) {
      command.run();
      onClose();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(activeIndex);
    }
  }

  let runningIndex = -1;
  let lastGroup: string | undefined;

  return (
    <div className="cmdk-overlay" role="presentation" onClick={onClose}>
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="cmdk__search">
          <Search size={18} strokeWidth={1.5} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands and views…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
          />
        </div>

        <div className="cmdk__list" id="cmdk-list" role="listbox" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="cmdk__empty">No matching commands.</p>
          ) : (
            filtered.map((command) => {
              runningIndex += 1;
              const index = runningIndex;
              const showGroup = command.group && command.group !== lastGroup;
              lastGroup = command.group;

              return (
                <div key={command.id}>
                  {showGroup ? <p className="section-label cmdk__group-label">{command.group}</p> : null}
                  <button
                    type="button"
                    className="cmdk__item"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runCommand(index)}
                  >
                    {command.icon ? (
                      <span className="icon-slot" aria-hidden="true">
                        {command.icon}
                      </span>
                    ) : null}
                    <span>{command.label}</span>
                    {command.hint ? <span className="cmdk__item-meta">{command.hint}</span> : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
