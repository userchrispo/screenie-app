import type { DragEvent, ReactNode } from 'react';
import { FileImage, Link, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CreateSavedItemInput, SavedItem } from '../../domain/savedItem';
import { CommandKey } from '../../components/CommandKey';
import { SurfaceCard } from '../../components/SurfaceCard';
import { modShortcutKeys } from '../../lib/keyboardShortcuts';

type CaptureMode = 'link' | 'image' | 'snippet' | null;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface CapturePanelProps {
  onCreate: (input: CreateSavedItemInput) => Promise<unknown>;
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
  const [linkTitleValue, setLinkTitleValue] = useState('');
  const [linkTagsValue, setLinkTagsValue] = useState('link, intake');
  const [snippetValue, setSnippetValue] = useState(initialSnippet);
  const [snippetTitleValue, setSnippetTitleValue] = useState('');
  const [snippetTagsValue, setSnippetTagsValue] = useState('snippet, intake');
  const [imageTagsValue, setImageTagsValue] = useState('image, intake');
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
    const title = linkTitleValue.trim() || titleFromUrl(parsedUrl);
    await onCreate({
      type: 'link',
      title,
      url,
      text: `Saved link from ${parsedUrl.hostname}`,
      tags: normalizeCaptureTags(linkTagsValue, ['link', 'intake']),
      thumbnailColor: 'link'
    });
    setLinkValue('');
    setLinkTitleValue('');
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
      title: snippetTitleValue.trim() || snippetValue.split(/\s+/).slice(0, 5).join(' '),
      text: snippetValue,
      tags: normalizeCaptureTags(snippetTagsValue, ['snippet', 'intake']),
      thumbnailColor: 'snippet'
    });
    setSnippetValue('');
    setSnippetTitleValue('');
    setActiveMode(null);
    setMessage('Snippet saved.');
  }

  async function saveFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files);
    const accepted = imageFiles.filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES);
    const rejected = imageFiles.length - accepted.length;

    if (accepted.length === 0) {
      setMessage(rejected > 0 ? 'Choose image files under 10 MB.' : 'Choose an image first.');
      return;
    }

    for (const file of accepted) {
      await saveFile(file);
    }

    setActiveMode(null);
    setMessage(
      `${accepted.length} ${accepted.length === 1 ? 'image' : 'images'} saved. OCR queued.${
        rejected > 0 ? ` ${rejected} skipped.` : ''
      }`
    );
  }

  async function saveFile(file: File) {
    const imageDataUrl = await fileToDataUrl(file);
    const type = file.name.toLowerCase().includes('screen') ? 'screenshot' : 'image';
    await onCreate({
      type,
      title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded image',
      text: `Uploaded ${type} ${file.name}. OCR queued for review.`,
      imageDataUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      tags: normalizeCaptureTags(imageTagsValue, [type, 'intake']),
      source: 'upload',
      ocrStatus: 'queued',
      ocrLanguage: 'eng',
      thumbnailColor: 'hero'
    });
  }

  async function pasteClipboardText(target: 'link' | 'snippet') {
    if (!navigator.clipboard?.readText) {
      setMessage('Clipboard text is not available in this browser.');
      return;
    }

    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      setMessage('Clipboard is empty.');
      return;
    }

    if (target === 'link') {
      setLinkValue(text.trim());
      return;
    }

    setSnippetValue(text);
  }

  async function pasteClipboardImage() {
    if (!navigator.clipboard?.read) {
      setMessage('Clipboard image paste is not available in this browser.');
      return;
    }

    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      const imageType = clipboardItem.types.find((type) => type.startsWith('image/'));
      if (!imageType) {
        continue;
      }

      const blob = await clipboardItem.getType(imageType);
      const file = new File([blob], `clipboard-${new Date().toISOString().replace(/[:.]/g, '-')}.png`, {
        type: imageType
      });
      await saveFiles([file]);
      return;
    }

    setMessage('No image found on the clipboard.');
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
            <button type="button" onClick={() => void pasteClipboardText('link')}>
              Paste clipboard
            </button>
          </div>
          <div className="capture-metadata-grid" aria-label="Link metadata">
            <label htmlFor="link-title-input">Title</label>
            <input
              id="link-title-input"
              value={linkTitleValue}
              onChange={(event) => setLinkTitleValue(event.target.value)}
              placeholder="Optional display title"
            />

            <label htmlFor="link-tags-input">Tags</label>
            <input
              id="link-tags-input"
              value={linkTagsValue}
              onChange={(event) => setLinkTagsValue(event.target.value)}
              placeholder="link, intake"
            />
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
            if (event.dataTransfer.files.length > 0) {
              void saveFiles(event.dataTransfer.files);
            }
          }}
        >
          <label htmlFor="image-input">Drop screenshot</label>
          <div className="capture-metadata-grid" aria-label="Image metadata">
            <label htmlFor="image-tags-input">Tags</label>
            <input
              id="image-tags-input"
              value={imageTagsValue}
              onChange={(event) => setImageTagsValue(event.target.value)}
              placeholder="image, intake"
            />
          </div>
          <p className="capture-helper">OCR status: queued after save.</p>
          <input
            ref={fileInputRef}
            id="image-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              if (event.target.files?.length) {
                void saveFiles(event.target.files);
              }
            }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Choose image
          </button>
          <button type="button" onClick={() => void pasteClipboardImage()}>
            Paste image
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
          <div className="capture-metadata-grid" aria-label="Snippet metadata">
            <label htmlFor="snippet-title-input">Title</label>
            <input
              id="snippet-title-input"
              value={snippetTitleValue}
              onChange={(event) => setSnippetTitleValue(event.target.value)}
              placeholder="Optional display title"
            />

            <label htmlFor="snippet-tags-input">Tags</label>
            <input
              id="snippet-tags-input"
              value={snippetTagsValue}
              onChange={(event) => setSnippetTagsValue(event.target.value)}
              placeholder="snippet, intake"
            />
          </div>
          <button type="button" onClick={() => void saveSnippet()}>
            Save text
          </button>
          <button type="button" onClick={() => void pasteClipboardText('snippet')}>
            Paste clipboard
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

function normalizeCaptureTags(value: string, defaults: string[]): string[] {
  const tags = [...defaults, ...value.split(',')]
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(tags));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
