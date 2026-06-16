import { useEffect, useState } from 'react';
import { Clipboard, Star, Trash2, X } from 'lucide-react';
import type { Project, SavedItem } from '../../domain/savedItem';
import { formatBytes, formatItemDate } from '../../lib/format';
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

  useEffect(() => {
    if (!item) {
      return;
    }
    setTitle(item.title);
    setTags(item.tags.join(', '));
    setProjectId(item.projectId ?? '');
    setOcrMessage('');
  }, [item]);

  if (!item) {
    return null;
  }

  const currentItem = item;
  const ocrStatus = getDetailOcrStatus(currentItem);

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

  return (
    <div className="app-overlay" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="aside"
        className="detail-panel"
        role="dialog"
        aria-label={`${currentItem.title} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="detail-panel__header">
          <h2>{currentItem.title}</h2>
          <button type="button" className="icon-button" aria-label="Close item details" onClick={onClose}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        {item.imageDataUrl ? (
          <img className="detail-panel__image" src={item.imageDataUrl} alt={item.title} />
        ) : null}

        <dl className="detail-panel__meta">
          <div>
            <dt>Type</dt>
            <dd>{item.type}</dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd>
              <time dateTime={item.createdAt}>{formatItemDate(item.createdAt)}</time>
            </dd>
          </div>
          {item.sizeBytes ? (
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(item.sizeBytes)}</dd>
            </div>
          ) : null}
        </dl>

        {item.url ? (
          <p className="detail-panel__url">
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.url}
            </a>
          </p>
        ) : null}

        {(item.text || item.extractedText) && (
          <div className="detail-panel__body">
            <h3>Content</h3>
            <p>{item.text ?? item.extractedText}</p>
          </div>
        )}

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

            <button type="button" className="detail-panel__save" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </SettingsSection>

        <div className="detail-panel__actions">
          <button type="button" className="icon-button" aria-label="Toggle favorite" onClick={() => onToggleFavorite(item)}>
            <Star size={18} strokeWidth={1.5} fill={item.isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          {item.status === 'trash' ? (
            <button
              type="button"
              className="detail-panel__danger"
              onClick={() => {
                onDeletePermanently(item);
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
                onMoveToTrash(item);
                onClose();
              }}
            >
              <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
              Move to trash
            </button>
          )}
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
