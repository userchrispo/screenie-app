import { FileImage, Link, Type, X } from 'lucide-react';
import type { CaptureDraft } from '../../domain/captureDraft';
import { SurfaceCard } from '../../components/SurfaceCard';

interface ExtensionCaptureDialogProps {
  draft: CaptureDraft | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function ExtensionCaptureDialog({
  draft,
  saving,
  onSave,
  onClose
}: ExtensionCaptureDialogProps) {
  if (!draft) {
    return null;
  }

  return (
    <div className="app-overlay app-overlay--center" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="section"
        className="modal-panel extension-capture"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extension-capture-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h2 id="extension-capture-title">Review extension capture</h2>
          <button type="button" className="icon-button" aria-label="Close extension capture" onClick={onClose}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="extension-capture__summary">
          <span className="settings-action-card__icon" aria-hidden="true">
            <DraftIcon type={draft.type} />
          </span>
          <div>
            <strong>{draft.title}</strong>
            <small>{draft.type} from extension bridge</small>
          </div>
        </div>

        {draft.imageDataUrl ? <img className="extension-capture__image" src={draft.imageDataUrl} alt="" /> : null}
        {draft.url ? <p className="detail-panel__url">{draft.url}</p> : null}
        {draft.text ? <p className="detail-panel__ocr-text">{draft.text}</p> : null}
        {draft.tags?.length ? <p className="text-muted">Tags: {draft.tags.join(', ')}</p> : null}

        <p className="modal-panel__note">
          Extension captures are reviewed before saving. Nothing is written until you confirm.
        </p>

        <div className="modal-panel__actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ghost-button ghost-button--primary" disabled={saving} onClick={onSave}>
            {saving ? 'Saving...' : 'Save capture'}
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}

function DraftIcon({ type }: { type: CaptureDraft['type'] }) {
  if (type === 'link') {
    return <Link size={18} strokeWidth={1.5} />;
  }

  if (type === 'snippet') {
    return <Type size={18} strokeWidth={1.5} />;
  }

  return <FileImage size={18} strokeWidth={1.5} />;
}
