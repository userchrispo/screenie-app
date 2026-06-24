import type { DragEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { Image as ImageIcon, Link, Paperclip, Type, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CreateSavedItemInput } from '../../domain/savedItem';
import { SurfaceCard } from '../../components/SurfaceCard';
import { usePreferences } from '../../lib/usePreferences';

type CaptureMode = 'link' | 'snippet' | 'image';
type ImageSource = 'paste' | 'upload';

const MODES: { mode: CaptureMode; label: string; icon: ReactNode; tone: string }[] = [
  { mode: 'link', label: 'Link', icon: <Link size={18} strokeWidth={1.75} />, tone: 'blue' },
  { mode: 'snippet', label: 'Text', icon: <Type size={18} strokeWidth={1.75} />, tone: 'violet' },
  { mode: 'image', label: 'Screenshot', icon: <ImageIcon size={18} strokeWidth={1.75} />, tone: 'teal' }
];

interface PendingImage {
  file: File;
  source: ImageSource;
}

interface CapturePanelProps {
  onCreate: (input: CreateSavedItemInput) => Promise<unknown>;
  initialMode?: 'link' | 'snippet' | null;
  initialSnippet?: string;
  initialLink?: string;
  initialTags?: string;
  captureFocusToken?: number;
}

export function CapturePanel({
  onCreate,
  initialMode = null,
  initialSnippet = '',
  initialLink = '',
  initialTags = '',
  captureFocusToken = 0
}: CapturePanelProps) {
  const { preferences } = usePreferences();
  const maxImageBytes = preferences.maxImageMb * 1024 * 1024;
  const [mode, setMode] = useState<CaptureMode>(initialMode ?? preferences.defaultCaptureMode);
  const [linkValue, setLinkValue] = useState(initialLink);
  const [linkTitleValue, setLinkTitleValue] = useState('');
  const [linkTagsValue, setLinkTagsValue] = useState(preferences.linkTags);
  const [snippetValue, setSnippetValue] = useState(initialSnippet);
  const [snippetTitleValue, setSnippetTitleValue] = useState('');
  const [snippetTagsValue, setSnippetTagsValue] = useState(preferences.snippetTags);
  const [imageTagsValue, setImageTagsValue] = useState(preferences.imageTags);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
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
    if (!initialTags) {
      return;
    }

    if (initialMode === 'snippet') {
      setSnippetTagsValue(initialTags);
      setShowDetails(true);
    } else if (initialMode === 'link') {
      setLinkTagsValue(initialTags);
      setShowDetails(true);
    }
  }, [initialTags, initialMode, captureFocusToken]);

  useEffect(() => {
    if (captureFocusToken > 0) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [captureFocusToken]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPendingImages([]);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const stageFiles = useCallback(
    (files: FileList | File[], source: ImageSource) => {
    const imageFiles = Array.from(files);
    const accepted = imageFiles.filter((file) => file.type.startsWith('image/') && file.size <= maxImageBytes);
    const rejected = imageFiles.length - accepted.length;

    if (accepted.length === 0) {
      setPendingImages([]);
      setMode('image');
      setMessage(rejected > 0 ? `Choose image files under ${preferences.maxImageMb} MB.` : 'Choose an image first.');
      return;
    }

    setPendingImages(accepted.map((file) => ({ file, source })));
    setMode('image');
    setMessage(
      `${accepted.length} ${accepted.length === 1 ? 'image' : 'images'} ready to review.${
        rejected > 0 ? ` ${rejected} skipped.` : ''
      }`
    );
    },
    [maxImageBytes, preferences.maxImageMb]
  );

  const handleClipboardData = useCallback(
    (clipboardData: DataTransfer | null) => {
      if (!clipboardData) {
        return false;
      }

      const files = getClipboardFiles(clipboardData);
      if (files.length > 0) {
        stageFiles(files, 'paste');
        return true;
      }

      const text = clipboardData.getData('text/plain') || clipboardData.getData('text');
      if (!text.trim()) {
        return false;
      }

      if (parseUrl(text)) {
        setLinkValue(text.trim());
        setMode('link');
        setMessage('Clipboard URL ready to review.');
        return true;
      }

      setSnippetValue(text);
      setMode('snippet');
      setMessage('Clipboard text ready to review.');
      return true;
    },
    [stageFiles]
  );

  useEffect(() => {
    if (!preferences.autoClipboardCapture) {
      return;
    }

    function onPaste(event: ClipboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
      }

      if (handleClipboardData(event.clipboardData)) {
        event.preventDefault();
      }
    }

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [handleClipboardData, preferences.autoClipboardCapture]);

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
    setMessage('Snippet saved.');
  }

  const saveFile = useCallback(
    async (file: File, source: ImageSource) => {
      const imageDataUrl = await fileToDataUrl(file);
      const type = file.name.toLowerCase().includes('screen') ? 'screenshot' : 'image';
      const action = source === 'paste' ? 'Pasted' : 'Uploaded';
      await onCreate({
        type,
        title: file.name.replace(/\.[^.]+$/, '') || `${action} image`,
        text: `${action} ${type} ${file.name}. OCR queued for review.`,
        imageDataUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        tags: normalizeCaptureTags(imageTagsValue, [type, 'intake']),
        source,
        ocrStatus: 'queued',
        ocrLanguage: preferences.ocrLanguage,
        thumbnailColor: 'hero'
      });
    },
    [imageTagsValue, onCreate, preferences.ocrLanguage]
  );

  async function savePendingImages() {
    if (pendingImages.length === 0) {
      setMessage('Choose an image first.');
      return;
    }

    for (const pendingImage of pendingImages) {
      await saveFile(pendingImage.file, pendingImage.source);
    }

    const savedCount = pendingImages.length;
    setPendingImages([]);
    setMessage(`${savedCount} ${savedCount === 1 ? 'image' : 'images'} saved. OCR queued.`);
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
      setMessage('Clipboard URL ready to review.');
      return;
    }

    setSnippetValue(text);
    setMessage('Clipboard text ready to review.');
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
      stageFiles([file], 'paste');
      return;
    }

    setMessage('No image found on the clipboard.');
  }

  function handleDragOver(event: DragEvent<Element>) {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<Element>) {
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      stageFiles(event.dataTransfer.files, 'upload');
    }
  }

  function handleLinkKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveLink();
    }
  }

  return (
    <SurfaceCard
      ref={panelRef}
      as="section"
      className={`capture-omni${isDragging ? ' capture-omni--dragging' : ''}`}
      aria-label="Capture saved content"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="capture-omni__modes" role="group" aria-label="Capture type">
        {MODES.map((option) => {
          const active = mode === option.mode;
          return (
            <button
              key={option.mode}
              type="button"
              className={`capture-mode${active ? ' capture-mode--active' : ''}`}
              aria-pressed={active}
              onClick={() => setMode(option.mode)}
            >
              <span className={`tile-vivid tile-vivid--${option.tone} capture-mode__icon`} aria-hidden="true">
                {option.icon}
              </span>
              <span className="capture-mode__label">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="capture-omni__stage">
        {mode === 'link' ? (
          <div className="capture-omni__field">
            <span className="capture-omni__lead" aria-hidden="true">
              <Link size={18} strokeWidth={1.75} />
            </span>
            <input
              id="link-input"
              aria-label="Link URL"
              className="capture-omni__input"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              onKeyDown={handleLinkKeyDown}
              placeholder="Paste a link to save it to your inbox…"
            />
            <button type="button" className="btn btn--accent capture-omni__save" onClick={() => void saveLink()}>
              Save link
            </button>
          </div>
        ) : null}

        {mode === 'snippet' ? (
          <div className="capture-omni__field capture-omni__field--text">
            <textarea
              id="snippet-input"
              aria-label="Note"
              className="capture-omni__textarea"
              value={snippetValue}
              onChange={(event) => setSnippetValue(event.target.value)}
              placeholder="Type or paste a note, quote, or idea…"
              rows={3}
            />
            <div className="capture-omni__field-actions">
              <button type="button" className="btn btn--accent" onClick={() => void saveSnippet()}>
                Save note
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'image' ? (
          <div
            className="capture-omni__drop"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {pendingImages.length > 0 ? (
              <div className="pending-image-list" aria-label="Images ready to save">
                <strong>
                  {pendingImages.length} {pendingImages.length === 1 ? 'image' : 'images'} ready
                </strong>
                <ul>
                  {pendingImages.map(({ file, source }) => (
                    <li key={`${source}-${file.name}-${file.size}`}>
                      <span>{file.name}</span>
                      <small>{source === 'paste' ? 'Pasted from clipboard' : 'Added from file or drop'}</small>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="capture-omni__clear"
                  aria-label="Clear staged images"
                  onClick={() => {
                    setPendingImages([]);
                    setMessage('');
                  }}
                >
                  <X size={14} strokeWidth={1.75} /> Clear
                </button>
              </div>
            ) : (
              <div className="capture-omni__dropzone">
                <span className="capture-omni__dropicon" aria-hidden="true">
                  <Upload size={20} strokeWidth={1.75} />
                </span>
                <p>
                  Drop a screenshot here, paste with <kbd>Ctrl/⌘ V</kbd>, or browse your files.
                </p>
              </div>
            )}

            <div className="capture-omni__drop-actions">
              <button
                type="button"
                className="btn btn--accent"
                disabled={pendingImages.length === 0}
                onClick={() => void savePendingImages()}
              >
                {pendingImages.length === 1 ? 'Save image' : 'Save images'}
              </button>
              <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
                Browse files
              </button>
              <button type="button" className="btn" onClick={() => void pasteClipboardImage()}>
                Paste image
              </button>
            </div>
            <input
              ref={fileInputRef}
              id="image-input"
              className="capture-omni__file"
              type="file"
              accept="image/*"
              aria-label="Add image"
              multiple
              onChange={(event) => {
                if (event.target.files?.length) {
                  stageFiles(event.target.files, 'upload');
                }
                event.target.value = '';
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="capture-omni__footer">
        <button
          type="button"
          className="capture-omni__details-toggle"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((value) => !value)}
        >
          <Paperclip size={14} strokeWidth={1.75} aria-hidden="true" />
          {showDetails ? 'Hide details' : 'Add title & tags'}
        </button>
        {mode === 'link' ? (
          <button type="button" className="capture-omni__inline-action" onClick={() => void pasteClipboardText('link')}>
            Paste from clipboard
          </button>
        ) : null}
        {mode === 'snippet' ? (
          <button
            type="button"
            className="capture-omni__inline-action"
            onClick={() => void pasteClipboardText('snippet')}
          >
            Paste from clipboard
          </button>
        ) : null}
      </div>

      {showDetails ? (
        <div className="capture-omni__details">
          {mode === 'link' ? (
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
          ) : null}
          {mode === 'snippet' ? (
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
          ) : null}
          {mode === 'image' ? (
            <div className="capture-metadata-grid" aria-label="Image metadata">
              <label htmlFor="image-tags-input">Tags</label>
              <input
                id="image-tags-input"
                value={imageTagsValue}
                onChange={(event) => setImageTagsValue(event.target.value)}
                placeholder="image, intake"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="capture-message" role="status">
        {message}
      </p>
    </SurfaceCard>
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

function getClipboardFiles(clipboardData: DataTransfer): File[] {
  const directFiles = Array.from(clipboardData.files ?? []);
  if (directFiles.length > 0) {
    return directFiles;
  }

  return Array.from(clipboardData.items ?? [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
