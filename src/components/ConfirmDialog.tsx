import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { SurfaceCard } from './SurfaceCard';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="app-overlay app-overlay--center" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="section"
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="modal-panel__header">
          <h2 id="confirm-dialog-title">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <p className="text-muted">{body}</p>
        <div className="modal-panel__actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`ghost-button ${danger ? 'ghost-button--danger' : 'ghost-button--primary'}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
