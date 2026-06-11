import { PageHeader } from '../../components/PageHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { SurfaceCard } from '../../components/SurfaceCard';
import { modShortcutKeys } from '../../lib/keyboardShortcuts';

interface SettingsViewProps {
  onClearAll: () => Promise<void>;
}

export function SettingsView({ onClearAll }: SettingsViewProps) {
  async function handleClear() {
    if (window.confirm('Clear all saved items and projects? This cannot be undone.')) {
      await onClearAll();
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
          <p className="text-muted">
            Screenie runs locally in your browser. All saves stay on this device.
          </p>
        </SettingsSection>

        <SettingsSection title="Screenie Pro">
          <p className="text-muted">
            This MVP includes local capture, search, tags, and projects. Cloud OCR, sync, and
            extensions are not available yet.
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

        <SettingsSection title="Data">
          <button type="button" className="slide-panel__danger" onClick={() => void handleClear()}>
            Clear all data
          </button>
        </SettingsSection>
      </SurfaceCard>
    </div>
  );
}
