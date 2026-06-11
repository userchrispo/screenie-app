import { useEffect, useState } from 'react';
import { Star, Trash2, X } from 'lucide-react';
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
}

export function ItemDetailPanel({
  item,
  projects,
  onClose,
  onSave,
  onToggleFavorite,
  onMoveToTrash,
  onDeletePermanently
}: ItemDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) {
      return;
    }
    setTitle(item.title);
    setTags(item.tags.join(', '));
    setProjectId(item.projectId ?? '');
  }, [item]);

  if (!item) {
    return null;
  }

  const currentItem = item;

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
