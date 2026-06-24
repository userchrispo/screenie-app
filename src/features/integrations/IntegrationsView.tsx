import {
  Cloud,
  Copy,
  Database,
  Puzzle,
  ScanText,
  Clipboard as ClipboardIcon
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { StatusBadge, type StatusBadgeVariant } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import type { SavedItem } from '../../domain/savedItem';
import { formatBytes } from '../../lib/format';
import { OCR_LANGUAGE_OPTIONS } from '../../lib/preferences';
import { usePreferences } from '../../lib/usePreferences';
import { BRIDGE_SNIPPET, SAMPLE_BRIDGE_MESSAGE } from './integrationsData';

interface IntegrationsViewProps {
  items?: SavedItem[];
  estimatedBytes?: number | null;
  onRunAllOcr?: () => Promise<void> | void;
  onTestBridge?: () => void;
}

export function IntegrationsView({
  items = [],
  estimatedBytes = null,
  onRunAllOcr,
  onTestBridge
}: IntegrationsViewProps) {
  const { preferences, update } = usePreferences();
  const [bridgeMessage, setBridgeMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [ocrMessage, setOcrMessage] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);

  const stats = useMemo(() => computeStats(items), [items]);
  const storedBytes =
    estimatedBytes && estimatedBytes > stats.storedBytes ? estimatedBytes : stats.storedBytes;
  const languageLabel =
    OCR_LANGUAGE_OPTIONS.find((option) => option.value === preferences.ocrLanguage)?.label ??
    preferences.ocrLanguage;

  function handleTestBridge() {
    if (onTestBridge) {
      onTestBridge();
    } else if (typeof window !== 'undefined') {
      window.postMessage(SAMPLE_BRIDGE_MESSAGE, '*');
    }
    setBridgeMessage('Sample capture sent. Review it in the capture dialog.');
  }

  async function handleCopySnippet() {
    try {
      await navigator.clipboard.writeText(BRIDGE_SNIPPET);
      setCopyMessage('Snippet copied to clipboard.');
    } catch {
      setCopyMessage('Copy is unavailable in this browser.');
    }
  }

  async function handleRunAllOcr() {
    if (stats.ocrQueued === 0 || !onRunAllOcr) {
      return;
    }
    setOcrBusy(true);
    setOcrMessage(`Running OCR on ${stats.ocrQueued} queued ${stats.ocrQueued === 1 ? 'item' : 'items'}…`);
    try {
      await onRunAllOcr();
      setOcrMessage('Local OCR finished for queued items.');
    } finally {
      setOcrBusy(false);
    }
  }

  return (
    <div className="page-stack workspace-page">
      <PageHeader
        titleId="integrations-title"
        eyebrow="Workspace"
        title="Integrations"
        subtitle="Screenie runs entirely on this device. These are the capabilities it can connect to."
      />

      <div className="connection-grid">
        <ConnectionCard
          icon={<Database size={20} strokeWidth={1.5} />}
          tone="blue"
          title="Local storage"
          caption="Everything is saved in IndexedDB on this device."
          status={{ variant: 'active', label: 'Active' }}
        >
          <dl className="connection-card__stats">
            <div>
              <dt>Saved items</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>Projects</dt>
              <dd>{stats.projects}</dd>
            </div>
            <div>
              <dt>Storage used</dt>
              <dd>{formatBytes(storedBytes) ?? '0 KB'}</dd>
            </div>
          </dl>
        </ConnectionCard>

        <ConnectionCard
          icon={<ScanText size={20} strokeWidth={1.5} />}
          tone="violet"
          title="Local OCR"
          caption="Text recognition runs in your browser with Tesseract."
          status={{ variant: 'active', label: 'Active' }}
        >
          <dl className="connection-card__stats">
            <div>
              <dt>Language</dt>
              <dd>{languageLabel}</dd>
            </div>
            <div>
              <dt>Queued</dt>
              <dd>{stats.ocrQueued}</dd>
            </div>
            <div>
              <dt>Recognized</dt>
              <dd>{stats.ocrReady}</dd>
            </div>
          </dl>
          <div className="connection-card__actions">
            <Button
              variant="secondary"
              size="sm"
              icon={<ScanText size={16} strokeWidth={1.5} aria-hidden="true" />}
              disabled={stats.ocrQueued === 0 || ocrBusy || !onRunAllOcr}
              onClick={() => void handleRunAllOcr()}
            >
              {ocrBusy ? 'Running…' : `Run all queued (${stats.ocrQueued})`}
            </Button>
          </div>
          {ocrMessage ? (
            <p className="connection-card__status" role="status">
              {ocrMessage}
            </p>
          ) : null}
        </ConnectionCard>

        <ConnectionCard
          icon={<Puzzle size={20} strokeWidth={1.5} />}
          tone="teal"
          title="Browser extension"
          caption="An extension can post captures to Screenie through the local bridge."
          status={{ variant: 'progress', label: 'Bridge ready' }}
        >
          <div className="connection-card__actions">
            <Button variant="secondary" size="sm" onClick={handleTestBridge}>
              Test connection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy size={16} strokeWidth={1.5} aria-hidden="true" />}
              onClick={() => void handleCopySnippet()}
            >
              Copy snippet
            </Button>
          </div>
          {bridgeMessage ? (
            <p className="connection-card__status" role="status">
              {bridgeMessage}
            </p>
          ) : null}
          <details className="connection-card__details">
            <summary>How to connect an extension</summary>
            <p>Post a message to the page from your extension. Screenie opens a review dialog before saving.</p>
            <pre className="connection-card__code">
              <code>{BRIDGE_SNIPPET}</code>
            </pre>
            {copyMessage ? (
              <p className="connection-card__status" role="status">
                {copyMessage}
              </p>
            ) : null}
          </details>
        </ConnectionCard>

        <ConnectionCard
          icon={<ClipboardIcon size={20} strokeWidth={1.5} />}
          tone="green"
          title="Clipboard auto-capture"
          caption="Paste anywhere in the app to stage a link, note, or image."
          status={{
            variant: preferences.autoClipboardCapture ? 'active' : 'coming',
            label: preferences.autoClipboardCapture ? 'On' : 'Off'
          }}
        >
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={preferences.autoClipboardCapture}
              onChange={(event) => update({ autoClipboardCapture: event.target.checked })}
            />
            <span>
              <strong>Capture from clipboard</strong>
              <small>Intercept paste events outside of input fields.</small>
            </span>
          </label>
        </ConnectionCard>

        <ConnectionCard
          icon={<Cloud size={20} strokeWidth={1.5} />}
          tone="amber"
          title="Cloud sync"
          caption="Sync saves across devices. Planned, and intentionally disabled in this local-first build."
          status={{ variant: 'coming', label: 'Coming soon' }}
        >
          <div className="connection-card__actions">
            <Button variant="secondary" size="sm" disabled>
              Connect account
            </Button>
          </div>
        </ConnectionCard>
      </div>
    </div>
  );
}

function ConnectionCard({
  icon,
  tone,
  title,
  caption,
  status,
  children
}: {
  icon: ReactNode;
  tone: 'blue' | 'violet' | 'teal' | 'green' | 'amber';
  title: string;
  caption: string;
  status: { variant: StatusBadgeVariant; label: string };
  children?: ReactNode;
}) {
  return (
    <SurfaceCard as="article" className="connection-card">
      <div className="connection-card__head">
        <span className={`connection-card__icon tile-vivid tile-vivid--${tone}`} aria-hidden="true">
          {icon}
        </span>
        <div className="connection-card__title">
          <strong>{title}</strong>
          <p>{caption}</p>
        </div>
        <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
      </div>
      {children}
    </SurfaceCard>
  );
}

function computeStats(items: SavedItem[]) {
  const active = items.filter((item) => item.status === 'active');

  return {
    total: active.length,
    projects: new Set(active.map((item) => item.projectId).filter(Boolean)).size,
    storedBytes: items.reduce((sum, item) => sum + (item.sizeBytes ?? 0), 0),
    ocrReady: items.filter((item) => Boolean(item.extractedText)).length,
    ocrQueued: items.filter(
      (item) =>
        (item.type === 'screenshot' || item.type === 'image') &&
        !item.extractedText &&
        Boolean(item.imageDataUrl || item.mimeType)
    ).length
  };
}
