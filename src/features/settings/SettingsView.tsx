import { Download, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { SurfaceCard } from '../../components/SurfaceCard';
import type { WorkspaceSnapshot } from '../../domain/savedItem';
import { parseWorkspaceSnapshot } from '../../domain/workspaceSnapshot';
import { modShortcutKeys } from '../../lib/keyboardShortcuts';

interface SettingsViewProps {
  onClearAll: () => Promise<void>;
  onExportWorkspace: () => Promise<WorkspaceSnapshot>;
  onImportWorkspace: (snapshot: WorkspaceSnapshot) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

type DataDialog = 'clear' | 'export' | 'import' | 'reset' | null;

export function SettingsView({
  onClearAll,
  onExportWorkspace,
  onImportWorkspace,
  onResetDemo
}: SettingsViewProps) {
  const [dialog, setDialog] = useState<DataDialog>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [importSnapshot, setImportSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [importError, setImportError] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  async function handleConfirmClear() {
    setBusy(true);
    try {
      await onClearAll();
      setStatusMessage('Local workspace cleared.');
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReset() {
    setBusy(true);
    try {
      await onResetDemo();
      setStatusMessage('Starter workspace restored.');
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmExport() {
    setBusy(true);
    try {
      const snapshot = await onExportWorkspace();
      downloadWorkspaceSnapshot(snapshot);
      setStatusMessage(`Exported ${snapshot.items.length} items and ${snapshot.projects.length} projects.`);
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const snapshot = parseWorkspaceSnapshot(await file.text());
      setImportSnapshot(snapshot);
      setImportError('');
      setDialog('import');
    } catch (err) {
      setImportSnapshot(null);
      setImportError(err instanceof Error ? err.message : 'Unable to read that Screenie archive.');
      setDialog('import');
    }
  }

  async function handleConfirmImport() {
    if (!importSnapshot) {
      return;
    }

    setBusy(true);
    try {
      await onImportWorkspace(importSnapshot);
      setStatusMessage(`Imported ${importSnapshot.items.length} items and ${importSnapshot.projects.length} projects.`);
      setImportSnapshot(null);
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack workspace-page">
      <PageHeader
        titleId="settings-title"
        title="Settings"
        subtitle="Workspace preferences, shortcuts, and data."
      />

      <SurfaceCard as="section" className="content-section" aria-labelledby="settings-title">
        <SettingsSection title="Workspace">
          <div className="settings-status-row">
            <span className="status-badge status-badge--active">Local-first</span>
            <p className="text-muted">
              IndexedDB storage is active on this device.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection title="Screenie Pro">
          <p className="text-muted">
            Product Beta includes local capture, OCR, search, tags, projects, and extension-ready intake.
            Cloud sync remains planned.
          </p>
        </SettingsSection>

        <SettingsSection title="Keyboard shortcuts">
          <ul className="shortcut-list">
            <li>
              <span>Search</span>
              <kbd>{modShortcutKeys('K').join(' + ')}</kbd>
            </li>
            <li>
              <span>Quick save</span>
              <kbd>{modShortcutKeys('Shift', 'S').join(' + ')}</kbd>
            </li>
            <li>
              <span>Close panel</span>
              <kbd>Esc</kbd>
            </li>
          </ul>
        </SettingsSection>

        <SettingsSection title="Import and export">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose Screenie archive"
            onChange={(event) => void handleImportFile(event)}
          />
          <div className="settings-action-grid">
            <button
              type="button"
              className="settings-action-card"
              aria-label="Export archive"
              onClick={() => setDialog('export')}
            >
              <span className="settings-action-card__icon" aria-hidden="true">
                <Download size={18} strokeWidth={1.5} />
              </span>
              <span>
                <strong>Export archive</strong>
                <small>Download a local JSON backup.</small>
              </span>
            </button>
            <button
              type="button"
              className="settings-action-card"
              aria-label="Import archive"
              onClick={() => setDialog('import')}
            >
              <span className="settings-action-card__icon" aria-hidden="true">
                <Upload size={18} strokeWidth={1.5} />
              </span>
              <span>
                <strong>Import archive</strong>
                <small>Review imported captures before saving.</small>
              </span>
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Data controls">
          <div className="settings-action-grid">
            <button
              type="button"
              className="settings-action-card settings-action-card--danger"
              aria-label="Clear all data"
              onClick={() => setDialog('clear')}
            >
              <span className="settings-action-card__icon" aria-hidden="true">
                <Trash2 size={18} strokeWidth={1.5} />
              </span>
              <span>
                <strong>Clear all data</strong>
                <small>Remove saves and projects from this device.</small>
              </span>
            </button>
            <button
              type="button"
              className="settings-action-card"
              aria-label="Reset workspace"
              onClick={() => setDialog('reset')}
            >
              <span className="settings-action-card__icon" aria-hidden="true">
                <RotateCcw size={18} strokeWidth={1.5} />
              </span>
              <span>
                <strong>Reset workspace</strong>
                <small>Restore a clean starter workspace.</small>
              </span>
            </button>
          </div>
          {statusMessage ? (
            <p className="capture-message" role="status">
              {statusMessage}
            </p>
          ) : null}
        </SettingsSection>
      </SurfaceCard>

      {dialog ? (
        <DataFlowDialog
          dialog={dialog}
          busy={busy}
          importSnapshot={importSnapshot}
          importError={importError}
          onClose={() => setDialog(null)}
          onChooseImport={() => importInputRef.current?.click()}
          onConfirmClear={() => void handleConfirmClear()}
          onConfirmExport={() => void handleConfirmExport()}
          onConfirmImport={() => void handleConfirmImport()}
          onConfirmReset={() => void handleConfirmReset()}
        />
      ) : null}
    </div>
  );
}

function DataFlowDialog({
  dialog,
  busy,
  importSnapshot,
  importError,
  onClose,
  onChooseImport,
  onConfirmClear,
  onConfirmExport,
  onConfirmImport,
  onConfirmReset
}: {
  dialog: Exclude<DataDialog, null>;
  busy: boolean;
  importSnapshot: WorkspaceSnapshot | null;
  importError: string;
  onClose: () => void;
  onChooseImport: () => void;
  onConfirmClear: () => void;
  onConfirmExport: () => void;
  onConfirmImport: () => void;
  onConfirmReset: () => void;
}) {
  const copy = getDialogCopy(dialog);
  const action = getDialogAction(dialog, {
    busy,
    hasImport: Boolean(importSnapshot),
    onChooseImport,
    onConfirmClear,
    onConfirmExport,
    onConfirmImport,
    onConfirmReset
  });

  return (
    <div className="app-overlay app-overlay--center" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="section"
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h2 id="data-dialog-title">{copy.title}</h2>
          <button type="button" className="icon-button" aria-label="Close data dialog" onClick={onClose}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="text-muted">{copy.body}</p>
        {dialog === 'import' && importSnapshot ? (
          <p className="modal-panel__note">
            Ready to import {importSnapshot.items.length} items and {importSnapshot.projects.length} projects from{' '}
            <time dateTime={importSnapshot.exportedAt}>{new Date(importSnapshot.exportedAt).toLocaleString()}</time>.
          </p>
        ) : null}
        {dialog === 'import' && importError ? (
          <p className="modal-panel__error" role="alert">
            {importError}
          </p>
        ) : null}

        <div className="modal-panel__actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            {action.cancelLabel}
          </button>
          <button
            type="button"
            className={`ghost-button ${action.danger ? 'ghost-button--danger' : 'ghost-button--primary'}`}
            disabled={action.disabled}
            onClick={action.onConfirm}
          >
            {action.label}
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}

function getDialogCopy(dialog: Exclude<DataDialog, null>): {
  title: string;
  body: string;
} {
  if (dialog === 'export') {
    return {
      title: 'Export archive',
      body: 'Export packages local captures, projects, tags, OCR text, and metadata into a Screenie JSON archive.'
    };
  }

  if (dialog === 'import') {
    return {
      title: 'Import archive',
      body: 'Choose a Screenie archive. You can review item and project counts before anything is written.'
    };
  }

  if (dialog === 'reset') {
    return {
      title: 'Reset workspace',
      body: 'Reset clears local data and restores the starter project structure for a fresh beta review.'
    };
  }

  return {
    title: 'Clear all data',
    body: 'This removes saved items and projects from this browser. The action cannot be undone.'
  };
}

function getDialogAction(
  dialog: Exclude<DataDialog, null>,
  options: {
    busy: boolean;
    hasImport: boolean;
    onChooseImport: () => void;
    onConfirmClear: () => void;
    onConfirmExport: () => void;
    onConfirmImport: () => void;
    onConfirmReset: () => void;
  }
) {
  if (options.busy) {
    return {
      cancelLabel: 'Cancel',
      danger: false,
      disabled: true,
      label: 'Working...',
      onConfirm: undefined
    };
  }

  if (dialog === 'clear') {
    return {
      cancelLabel: 'Cancel',
      danger: true,
      disabled: false,
      label: 'Clear all data',
      onConfirm: options.onConfirmClear
    };
  }

  if (dialog === 'reset') {
    return {
      cancelLabel: 'Cancel',
      danger: true,
      disabled: false,
      label: 'Reset workspace',
      onConfirm: options.onConfirmReset
    };
  }

  if (dialog === 'export') {
    return {
      cancelLabel: 'Close',
      danger: false,
      disabled: false,
      label: 'Export archive',
      onConfirm: options.onConfirmExport
    };
  }

  return {
    cancelLabel: 'Close',
    danger: false,
    disabled: false,
    label: options.hasImport ? 'Import archive' : 'Choose archive',
    onConfirm: options.hasImport ? options.onConfirmImport : options.onChooseImport
  };
}

function downloadWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `screenie-export-${new Date(snapshot.exportedAt).toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
