import {
  Download,
  FileImage,
  FolderOpen,
  HardDrive,
  Layers,
  Link as LinkIcon,
  Monitor,
  Moon,
  RotateCcw,
  ScanText,
  Sun,
  Tags as TagsIcon,
  Trash2,
  Type,
  Upload,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { SurfaceCard } from '../../components/SurfaceCard';
import { StatCard } from '../../components/StatCard';
import { Field, Input, Select } from '../../components/Field';
import { Button } from '../../components/Button';
import type { Project, SavedItem, WorkspaceSnapshot } from '../../domain/savedItem';
import { parseWorkspaceSnapshot } from '../../domain/workspaceSnapshot';
import { formatBytes } from '../../lib/format';
import { modShortcutKeys } from '../../lib/keyboardShortcuts';
import { getStoredPreference, setThemePreference, type ThemePreference } from '../../lib/theme';
import { OCR_LANGUAGE_OPTIONS, type Density } from '../../lib/preferences';
import { usePreferences } from '../../lib/usePreferences';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' }
];

interface SettingsViewProps {
  items?: SavedItem[];
  projects?: Project[];
  onClearAll: () => Promise<void>;
  onExportWorkspace: () => Promise<WorkspaceSnapshot>;
  onImportWorkspace: (snapshot: WorkspaceSnapshot) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onRunAllOcr?: () => Promise<void> | void;
}

type DataDialog = 'clear' | 'export' | 'import' | 'reset' | null;

export function SettingsView({
  items = [],
  projects = [],
  onClearAll,
  onExportWorkspace,
  onImportWorkspace,
  onResetDemo,
  onRunAllOcr
}: SettingsViewProps) {
  const { preferences, update, reset } = usePreferences();
  const [dialog, setDialog] = useState<DataDialog>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [importSnapshot, setImportSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [importError, setImportError] = useState('');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => getStoredPreference());
  const [estimatedBytes, setEstimatedBytes] = useState<number | null>(null);
  const [ocrMessage, setOcrMessage] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const insights = useMemo(() => computeInsights(items, projects), [items, projects]);

  useEffect(() => {
    let active = true;
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      navigator.storage
        .estimate()
        .then((estimate) => {
          if (active) {
            setEstimatedBytes(estimate.usage ?? null);
          }
        })
        .catch(() => {
          if (active) {
            setEstimatedBytes(null);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [items]);

  function handleThemeChange(preference: ThemePreference) {
    setThemePreference(preference);
    setThemePreferenceState(preference);
  }

  async function handleRunAllOcr() {
    if (insights.ocrQueued === 0 || !onRunAllOcr) {
      return;
    }

    setOcrBusy(true);
    setOcrMessage(`Running OCR on ${insights.ocrQueued} queued ${insights.ocrQueued === 1 ? 'item' : 'items'}…`);
    try {
      await onRunAllOcr();
      setOcrMessage('Local OCR finished for queued items.');
    } finally {
      setOcrBusy(false);
    }
  }

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

  const storageLabel =
    estimatedBytes && estimatedBytes > insights.storedBytes
      ? formatBytes(estimatedBytes) ?? '0 KB'
      : formatBytes(insights.storedBytes) ?? '0 KB';

  return (
    <div className="page-stack workspace-page">
      <PageHeader
        titleId="settings-title"
        eyebrow="Workspace"
        title="Settings"
        subtitle="Workspace insights, capture defaults, OCR, appearance, and data."
      />

      <SurfaceCard as="section" className="content-section" aria-labelledby="settings-insights-title">
        <div className="section-header">
          <div>
            <h2 id="settings-insights-title">Workspace insights</h2>
            <p>A live snapshot of everything stored on this device.</p>
          </div>
        </div>
        <div className="stat-grid" aria-label="Workspace metrics">
          <StatCard label="Saved items" value={insights.total} icon={<Layers size={16} strokeWidth={1.5} />} />
          <StatCard label="Links" value={insights.links} tone="blue" icon={<LinkIcon size={16} strokeWidth={1.5} />} />
          <StatCard label="Notes" value={insights.snippets} tone="violet" icon={<Type size={16} strokeWidth={1.5} />} />
          <StatCard
            label="Images"
            value={insights.images}
            tone="teal"
            icon={<FileImage size={16} strokeWidth={1.5} />}
          />
          <StatCard
            label="Projects"
            value={insights.projects}
            tone="green"
            icon={<FolderOpen size={16} strokeWidth={1.5} />}
          />
          <StatCard label="Tags" value={insights.tags} icon={<TagsIcon size={16} strokeWidth={1.5} />} />
          <StatCard label="In trash" value={insights.trash} icon={<Trash2 size={16} strokeWidth={1.5} />} />
          <StatCard
            label="Storage used"
            value={storageLabel}
            tone="amber"
            icon={<HardDrive size={16} strokeWidth={1.5} />}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard as="section" className="content-section" aria-labelledby="settings-title">
        <SettingsSection title="Appearance">
          <p className="text-muted">Choose how Screenie looks and feels on this device.</p>
          <div className="settings-field-label">Theme</div>
          <div className="theme-options" role="group" aria-label="Theme preference">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = themePreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-option${active ? ' theme-option--active' : ''}`}
                  aria-pressed={active}
                  onClick={() => handleThemeChange(option.value)}
                >
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
          <div className="settings-field-label">Density</div>
          <div className="theme-options" role="group" aria-label="Layout density">
            {DENSITY_OPTIONS.map((option) => {
              const active = preferences.density === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-option${active ? ' theme-option--active' : ''}`}
                  aria-pressed={active}
                  onClick={() => update({ density: option.value })}
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Capture defaults">
          <p className="text-muted">These pre-fill every new capture. You can still edit them per item.</p>
          <div className="settings-grid">
            <Field label="Default capture mode" htmlFor="pref-mode">
              <Select
                id="pref-mode"
                value={preferences.defaultCaptureMode}
                onChange={(event) =>
                  update({ defaultCaptureMode: event.target.value as typeof preferences.defaultCaptureMode })
                }
              >
                <option value="link">Link</option>
                <option value="snippet">Text</option>
                <option value="image">Screenshot</option>
              </Select>
            </Field>
            <Field label="Max image size (MB)" htmlFor="pref-max-image">
              <Input
                id="pref-max-image"
                type="number"
                min={1}
                max={50}
                value={preferences.maxImageMb}
                onChange={(event) => update({ maxImageMb: Number(event.target.value) })}
              />
            </Field>
            <Field label="Default link tags" htmlFor="pref-link-tags" hint="Comma separated">
              <Input
                id="pref-link-tags"
                value={preferences.linkTags}
                onChange={(event) => update({ linkTags: event.target.value })}
              />
            </Field>
            <Field label="Default note tags" htmlFor="pref-snippet-tags" hint="Comma separated">
              <Input
                id="pref-snippet-tags"
                value={preferences.snippetTags}
                onChange={(event) => update({ snippetTags: event.target.value })}
              />
            </Field>
            <Field label="Default image tags" htmlFor="pref-image-tags" hint="Comma separated">
              <Input
                id="pref-image-tags"
                value={preferences.imageTags}
                onChange={(event) => update({ imageTags: event.target.value })}
              />
            </Field>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={preferences.autoClipboardCapture}
              onChange={(event) => update({ autoClipboardCapture: event.target.checked })}
            />
            <span>
              <strong>Clipboard auto-capture</strong>
              <small>Paste anywhere in the app to stage a link, note, or image.</small>
            </span>
          </label>
          <div className="settings-inline-actions">
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset to defaults
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection title="OCR">
          <p className="text-muted">
            Text recognition runs locally in your browser. Changing the language may download language data on the next
            run.
          </p>
          <div className="settings-grid">
            <Field label="Default OCR language" htmlFor="pref-ocr-language">
              <Select
                id="pref-ocr-language"
                value={preferences.ocrLanguage}
                onChange={(event) => update({ ocrLanguage: event.target.value })}
              >
                {OCR_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="settings-status-row">
            <span className={`status-badge ${insights.ocrQueued > 0 ? 'status-badge--progress' : 'status-badge--active'}`}>
              {insights.ocrQueued > 0 ? `${insights.ocrQueued} queued` : 'All caught up'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={<ScanText size={16} strokeWidth={1.5} aria-hidden="true" />}
              disabled={insights.ocrQueued === 0 || ocrBusy || !onRunAllOcr}
              onClick={() => void handleRunAllOcr()}
            >
              {ocrBusy ? 'Running…' : `Run OCR on all queued (${insights.ocrQueued})`}
            </Button>
          </div>
          {ocrMessage ? (
            <p className="capture-message" role="status">
              {ocrMessage}
            </p>
          ) : null}
        </SettingsSection>

        <SettingsSection title="Keyboard shortcuts">
          <ul className="shortcut-list">
            <li>
              <span>Command palette</span>
              <kbd>{modShortcutKeys('K').join(' + ')}</kbd>
            </li>
            <li>
              <span>Quick capture</span>
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
        </SettingsSection>

        <SettingsSection title="Danger zone">
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

interface WorkspaceInsights {
  total: number;
  links: number;
  snippets: number;
  images: number;
  projects: number;
  tags: number;
  trash: number;
  storedBytes: number;
  ocrQueued: number;
}

function computeInsights(items: SavedItem[], projects: Project[]): WorkspaceInsights {
  const active = items.filter((item) => item.status === 'active');

  return {
    total: active.length,
    links: active.filter((item) => item.type === 'link').length,
    snippets: active.filter((item) => item.type === 'snippet').length,
    images: active.filter((item) => item.type === 'image' || item.type === 'screenshot').length,
    projects: projects.length,
    tags: new Set(active.flatMap((item) => item.tags)).size,
    trash: items.filter((item) => item.status === 'trash').length,
    storedBytes: items.reduce((sum, item) => sum + (item.sizeBytes ?? 0), 0),
    ocrQueued: items.filter(
      (item) =>
        (item.type === 'screenshot' || item.type === 'image') &&
        !item.extractedText &&
        Boolean(item.imageDataUrl || item.mimeType)
    ).length
  };
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="app-overlay app-overlay--center" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="section"
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="modal-panel__header">
          <h2 id="data-dialog-title">{copy.title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            aria-label="Close data dialog"
            onClick={onClose}
          >
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
