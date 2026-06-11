import type { DragEvent, ReactNode } from 'react';
import { FileImage, Link, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SavedItem } from '../../domain/savedItem';
import { CommandKey } from '../../components/CommandKey';
import { SurfaceCard } from '../../components/SurfaceCard';
import { modShortcutKeys } from '../../lib/keyboardShortcuts';

type CaptureMode = 'link' | 'image' | 'snippet' | null;

interface CapturePanelProps {
  onCreate: (input: {
    type: SavedItem['type'];
    title: string;
    url?: string;
    text?: string;
    extractedText?: string;
    imageDataUrl?: string;
    mimeType?: string;
    sizeBytes?: number;
    tags?: string[];
    thumbnailColor?: string;
  }) => Promise<unknown>;
  initialMode?: CaptureMode;
  initialSnippet?: string;
  initialLink?: string;
  captureFocusToken?: number;
}

export function CapturePanel({
  onCreate,
  initialMode = null,
  initialSnippet = '',
  initialLink = '',
  captureFocusToken = 0
}: CapturePanelProps) {
  const [activeMode, setActiveMode] = useState<CaptureMode>(initialMode);
  const [linkValue, setLinkValue] = useState(initialLink);
  const [snippetValue, setSnippetValue] = useState(initialSnippet);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialMode, captureFocusToken]);

  useEffect(() => {
    if (initialSnippet) {
      setSnippetValue(initialSnippet);
    }
  }, [initialSnippet, captureFocusToken]);

  useEffect(() => {
    if (initialLink) {
      setLinkValue(initialLink);
    }
  }, [initialLink, captureFocusToken]);

  useEffect(() => {
    if (captureFocusToken > 0) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [captureFocusToken]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveMode(null);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function saveLink() {
    if (!linkValue.trim()) {
      setMessage('Paste a URL first.');
      return;
    }

    const parsedUrl = parseUrl(linkValue);
    if (!parsedUrl) {
      setMessage('Enter a valid URL.');
      return;
    }

    const url = parsedUrl.toString();
    await onCreate({
      type: 'link',
      title: titleFromUrl(parsedUrl),
      url,
      text: `Saved link from ${parsedUrl.hostname}`,
      tags: ['link'],
      thumbnailColor: 'link'
    });
    setLinkValue('');
    setActiveMode(null);
    setMessage('Link saved.');
  }

  async function saveSnippet() {
    if (!snippetValue.trim()) {
      setMessage('Write a snippet first.');
      return;
    }

    await onCreate({
      type: 'snippet',
      title: snippetValue.split(/\s+/).slice(0, 5).join(' '),
      text: snippetValue,
      tags: ['snippet'],
      thumbnailColor: 'snippet'
    });
    setSnippetValue('');
    setActiveMode(null);
    setMessage('Snippet saved.');
  }

  async function saveFile(file: File) {
    const imageDataUrl = await fileToDataUrl(file);
    await onCreate({
      type: file.name.toLowerCase().includes('screen') ? 'screenshot' : 'image',
      title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded image',
      text: `Uploaded image ${file.name}`,
      extractedText: file.name,
      imageDataUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      tags: ['image'],
      thumbnailColor: 'hero'
    });
    setActiveMode(null);
    setMessage('Image saved.');
  }

  return (
    <SurfaceCard
      ref={panelRef}
      as="section"
      className="capture-panel"
      aria-label="Capture saved content"
    >
      <div className="capture-grid">
        <CaptureTile
          mode="link"
          activeMode={activeMode}
          onActivate={() => setActiveMode('link')}
          icon={<Link size={18} strokeWidth={1.5} />}
          iconClass="tile-link"
          title="Paste link"
          subtitle="Save any URL"
          shortcut={modShortcutKeys('V')}
          shortcutLabel="Paste link shortcut"
        >
          <label htmlFor="link-input">Paste link</label>
          <div className="input-row">
            <input
              id="link-input"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder="https://www.notion.so/..."
            />
            <button type="button" onClick={() => void saveLink()}>
              Save
            </button>
          </div>
        </CaptureTile>

        <CaptureTile
          mode="image"
          activeMode={activeMode}
          onActivate={() => setActiveMode('image')}
          icon={<FileImage size={18} strokeWidth={1.5} />}
          iconClass="tile-image"
          title="Drop screenshot"
          subtitle="or image here"
          shortcut={modShortcutKeys('Shift', 'V')}
          shortcutLabel="Paste image shortcut"
          className="drop-tile"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) {
              void saveFile(file);
            }
          }}
        >
          <label htmlFor="image-input">Drop screenshot</label>
          <input
            ref={fileInputRef}
            id="image-input"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void saveFile(file);
              }
            }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Choose image
          </button>
        </CaptureTile>

        <CaptureTile
          mode="snippet"
          activeMode={activeMode}
          onActivate={() => setActiveMode('snippet')}
          icon={<Type size={18} strokeWidth={1.5} />}
          iconClass="tile-snippet"
          title="Save snippet"
          subtitle="Capture text"
          shortcut={modShortcutKeys('Shift', 'T')}
          shortcutLabel="Save snippet shortcut"
        >
          <label htmlFor="snippet-input">Save snippet</label>
          <textarea
            id="snippet-input"
            value={snippetValue}
            onChange={(event) => setSnippetValue(event.target.value)}
            placeholder="Capture text"
            rows={3}
          />
          <button type="button" onClick={() => void saveSnippet()}>
            Save text
          </button>
        </CaptureTile>
      </div>

      <p className="capture-message" role="status">
        {message}
      </p>
    </SurfaceCard>
  );
}

interface CaptureTileProps {
  mode: Exclude<CaptureMode, null>;
  activeMode: CaptureMode;
  onActivate: () => void;
  icon: ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  shortcut: string[];
  shortcutLabel: string;
  className?: string;
  children: ReactNode;
  onDragOver?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
}

function CaptureTile({
  mode,
  activeMode,
  onActivate,
  icon,
  iconClass,
  title,
  subtitle,
  shortcut,
  shortcutLabel,
  className = '',
  children,
  onDragOver,
  onDrop
}: CaptureTileProps) {
  const expanded = activeMode === mode;
  const collapsed = activeMode !== null && !expanded;

  if (collapsed) {
    return null;
  }

  if (expanded) {
    return (
      <div
        className={`capture-action-tile capture-action-tile--expanded ${className}`.trim()}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="capture-action-tile__form">{children}</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`capture-action-tile ${className}`.trim()}
      aria-expanded={false}
      onClick={onActivate}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span className={`tile-icon ${iconClass}`} aria-hidden="true">
        {icon}
      </span>
      <span className="capture-action-tile__copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
        <CommandKey keys={shortcut} label={shortcutLabel} />
      </span>
    </button>
  );
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function parseUrl(value: string): URL | null {
  const normalized = normalizeUrl(value);
  if (/\s/.test(normalized)) {
    return null;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function titleFromUrl(url: URL): string {
  return url.hostname.replace(/^www\./, '');
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
