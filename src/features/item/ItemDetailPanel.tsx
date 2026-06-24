import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Clipboard, Image as ImageIcon, Link2, Quote, Star, Trash2, X } from 'lucide-react';
import type { Project, SavedItem } from '../../domain/savedItem';
import { formatBytes, formatItemDate } from '../../lib/format';
import { getLinkLabel, getSavedItemPreviewImage } from '../../lib/previewImages';
import { SurfaceCard } from '../../components/SurfaceCard';
import { SettingsSection } from '../../components/SettingsSection';

interface ItemDetailPanelProps {
  item: SavedItem | null;
  projects: Project[];
  onClose: () => void;
  onSave: (id: string, input: { title: string; tags: string; projectId: string | null }) => Promise<void>;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onDeletePermanently: (item: SavedItem) => void;
  onRunOcr: (item: SavedItem) => void;
}

export function ItemDetailPanel({
  item,
  projects,
  onClose,
  onSave,
  onToggleFavorite,
  onMoveToTrash,
  onDeletePermanently,
  onRunOcr
}: ItemDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [ocrMessage, setOcrMessage] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const activeItemId = item?.id;
  const previewImage = item ? getSavedItemPreviewImage(item) : undefined;
  const [failedPreviewImage, setFailedPreviewImage] = useState<string | null>(null);
  const shouldShowPreviewImage = Boolean(previewImage && failedPreviewImage !== previewImage);

  useEffect(() => {
    if (!item) {
      return;
    }

    setTitle(item.title);
    setTags(getTagDraft(item));
    setProjectId(getProjectDraft(item));
    setOcrMessage('');
  }, [item]);

  useEffect(() => {
    if (!activeItemId) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    return () => {
      previouslyFocusedElement.current?.focus();
      previouslyFocusedElement.current = null;
    };
  }, [activeItemId]);

  useEffect(() => {
    setFailedPreviewImage(null);
  }, [previewImage]);

  if (!item) {
    return null;
  }

  const currentItem = item;
  const ocrStatus = getDetailOcrStatus(currentItem);
  const previewText = currentItem.text ?? currentItem.extractedText;
  const typeLabel = getItemTypeLabel(currentItem);
  const isDraftDirty =
    title !== currentItem.title || tags !== getTagDraft(currentItem) || projectId !== getProjectDraft(currentItem);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(currentItem.id, {
        title,
        tags,
        projectId: projectId || null
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setTitle(currentItem.title);
    setTags(getTagDraft(currentItem));
    setProjectId(getProjectDraft(currentItem));
  }

  async function handleCopyOcrText() {
    if (!currentItem.extractedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentItem.extractedText);
      setOcrMessage('OCR text copied.');
    } catch {
      setOcrMessage('OCR text is ready to select and copy.');
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(panelRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="app-overlay app-overlay--focus-detail" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="section"
        ref={panelRef}
        className={`detail-panel detail-panel--focus detail-panel--${currentItem.type}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${currentItem.title} details`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
      >
        <header className="detail-panel__header detail-panel__chrome">
          <div className="detail-panel__title-group">
            <span className="detail-panel__eyebrow">{typeLabel}</span>
            <h2 id="detail-panel-title">{currentItem.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button detail-panel__close"
            aria-label="Close item details"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="detail-panel__focus-grid">
          <section className="detail-panel__preview-shell" aria-labelledby="detail-preview-title">
            <div className="detail-panel__preview-header">
              <h3 id="detail-preview-title">Preview</h3>
              <span className={`detail-panel__type-chip detail-panel__type-chip--${currentItem.type}`}>{typeLabel}</span>
            </div>

            <div className="detail-panel__preview" data-preview-type={currentItem.type}>
              {shouldShowPreviewImage ? (
                <figure className="detail-panel__preview-media">
                  <img
                    className="detail-panel__image"
                    src={previewImage}
                    alt={currentItem.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedPreviewImage(previewImage ?? null)}
                  />
                </figure>
              ) : currentItem.type === 'snippet' && previewText ? (
                <div className="note-preview note-preview--lg">
                  <Quote className="note-preview__mark" size={18} strokeWidth={2} aria-hidden="true" />
                  <p className="note-preview__text">{previewText}</p>
                </div>
              ) : currentItem.type === 'link' ? (
                <div className="detail-panel__preview-brand" aria-label={`${typeLabel} preview`}>
                  <Link2 className="detail-panel__preview-icon" size={24} strokeWidth={1.5} aria-hidden="true" />
                  <span>{getLinkLabel(currentItem.url)}</span>
                </div>
              ) : (
                <div className="detail-panel__preview-empty" aria-label={`${typeLabel} preview`}>
                  <ImageIcon className="detail-panel__preview-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
                  <span>{getPreviewFallbackText(currentItem)}</span>
                </div>
              )}
            </div>

            {currentItem.url ? (
              <p className="detail-panel__url detail-panel__source">
                <a href={currentItem.url} target="_blank" rel="noreferrer">
                  {currentItem.url}
                </a>
              </p>
            ) : null}

            {previewText && currentItem.type !== 'snippet' ? (
              <div className="detail-panel__body detail-panel__content-section">
                <h3>Content</h3>
                <p>{previewText}</p>
              </div>
            ) : null}
          </section>

          <div className="detail-panel__workspace" aria-label="Item details and editing">
            <section
              className="detail-panel__workspace-section detail-panel__workspace-section--meta"
              aria-labelledby="detail-meta-title"
            >
              <div className="detail-panel__workspace-header">
                <h3 id="detail-meta-title">Details</h3>
                <button
                  type="button"
                  className="icon-button detail-panel__favorite"
                  aria-label="Toggle favorite"
                  aria-pressed={currentItem.isFavorite}
                  onClick={() => onToggleFavorite(currentItem)}
                >
                  <Star
                    size={18}
                    strokeWidth={1.5}
                    fill={currentItem.isFavorite ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <dl className="detail-panel__meta detail-panel__meta-grid">
                <div className="detail-panel__meta-card">
                  <dt>Type</dt>
                  <dd>{currentItem.type}</dd>
                </div>
                <div className="detail-panel__meta-card">
                  <dt>Saved</dt>
                  <dd>
                    <time dateTime={currentItem.createdAt}>{formatItemDate(currentItem.createdAt)}</time>
                  </dd>
                </div>
                {currentItem.sizeBytes ? (
                  <div className="detail-panel__meta-card">
                    <dt>Size</dt>
                    <dd>{formatBytes(currentItem.sizeBytes)}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {ocrStatus ? (
              <SettingsSection title="OCR">
                <div className="detail-panel__ocr">
                  <div className="detail-panel__ocr-status">
                    <span className={`ocr-chip ocr-chip--${ocrStatus.variant}`}>{ocrStatus.label}</span>
                    <span>{ocrStatus.detail}</span>
                  </div>

                  {currentItem.ocrError ? <p className="modal-panel__error">{currentItem.ocrError}</p> : null}

                  {currentItem.extractedText ? (
                    <>
                      <p className="detail-panel__ocr-text">{currentItem.extractedText}</p>
                      <button type="button" className="ghost-button" onClick={() => void handleCopyOcrText()}>
                        <Clipboard size={16} strokeWidth={1.5} aria-hidden="true" />
                        Copy OCR text
                      </button>
                    </>
                  ) : null}

                  {canRunOcr(currentItem) ? (
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={currentItem.ocrStatus === 'processing'}
                      onClick={() => onRunOcr(currentItem)}
                    >
                      {getOcrActionLabel(currentItem)}
                    </button>
                  ) : null}

                  {ocrMessage ? (
                    <p className="capture-message" role="status">
                      {ocrMessage}
                    </p>
                  ) : null}
                </div>
              </SettingsSection>
            ) : null}

            <SettingsSection title="Edit">
              <div className="detail-panel__form">
                <label htmlFor="detail-title">Title</label>
                <input id="detail-title" value={title} onChange={(event) => setTitle(event.target.value)} />

                <label htmlFor="detail-tags">Tags (comma separated)</label>
                <input id="detail-tags" value={tags} onChange={(event) => setTags(event.target.value)} />

                <label htmlFor="detail-project">Project</label>
                <select id="detail-project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                  <option value="">No project (Inbox)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <div className="detail-panel__form-actions">
                  <button type="button" className="ghost-button" disabled={!isDraftDirty || saving} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button type="button" className="detail-panel__save" disabled={saving} onClick={() => void handleSave()}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </SettingsSection>

            <div className="detail-panel__actions detail-panel__footer-actions">
              {currentItem.status === 'trash' ? (
                <button
                  type="button"
                  className="detail-panel__danger"
                  onClick={() => {
                    onDeletePermanently(currentItem);
                    onClose();
                  }}
                >
                  Delete permanently
                </button>
              ) : (
                <button
                  type="button"
                  className="detail-panel__danger"
                  onClick={() => {
                    onMoveToTrash(currentItem);
                    onClose();
                  }}
                >
                  <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
                  Move to trash
                </button>
              )}
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

function getDetailOcrStatus(item: SavedItem): { label: string; detail: string; variant: 'ready' | 'queued' | 'processing' | 'failed' } | null {
  if (item.type !== 'screenshot' && item.type !== 'image') {
    return null;
  }

  if (item.ocrStatus === 'ready' || item.extractedText) {
    return {
      label: 'OCR ready',
      detail: 'Extracted text is available for search and review.',
      variant: 'ready'
    };
  }

  if (item.ocrStatus === 'processing') {
    return {
      label: 'OCR processing',
      detail: 'Local text recognition is running in this browser.',
      variant: 'processing'
    };
  }

  if (item.ocrStatus === 'failed') {
    return {
      label: 'OCR failed',
      detail: 'Text recognition did not finish. You can retry locally.',
      variant: 'failed'
    };
  }

  if (item.ocrStatus === 'queued' || item.imageDataUrl || item.mimeType) {
    return {
      label: 'OCR queued',
      detail: 'This capture is waiting for local text recognition.',
      variant: 'queued'
    };
  }

  return null;
}

function canRunOcr(item: SavedItem): boolean {
  return (item.type === 'screenshot' || item.type === 'image') && Boolean(item.imageDataUrl);
}

function getOcrActionLabel(item: SavedItem): string {
  if (item.ocrStatus === 'processing') {
    return 'OCR processing';
  }

  if (item.ocrStatus === 'failed') {
    return 'Retry OCR';
  }

  if (item.extractedText) {
    return 'Run OCR again';
  }

  return 'Run OCR';
}

function getTagDraft(item: SavedItem): string {
  return item.tags.join(', ');
}

function getProjectDraft(item: SavedItem): string {
  return item.projectId ?? '';
}

function getItemTypeLabel(item: SavedItem): string {
  if (item.type === 'screenshot') {
    return 'Screenshot';
  }

  if (item.type === 'image') {
    return 'Image';
  }

  if (item.type === 'link') {
    return 'Link';
  }

  return 'Snippet';
}

function getPreviewFallbackText(item: SavedItem): string {
  if (item.url) {
    return 'Saved link preview';
  }

  if (item.type === 'snippet') {
    return 'Saved text snippet';
  }

  return 'Visual capture';
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}
