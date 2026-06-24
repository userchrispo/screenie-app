import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { IntegrationsView } from '../../features/integrations/IntegrationsView';
import { TemplatesView } from '../../features/templates/TemplatesView';
import { SettingsView } from '../../features/settings/SettingsView';
import { resetPreferences } from '../../lib/preferences';
import { deleteScreenieDatabaseForTests } from '../../lib/storage/screenieRepository';
import type { SavedItem } from '../../domain/savedItem';

function makeItem(overrides: Partial<SavedItem> = {}): SavedItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    type: 'snippet',
    title: 'Sample',
    tags: [],
    source: 'manual',
    ocrStatus: 'not_applicable',
    isFavorite: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

beforeEach(async () => {
  resetPreferences();
  await deleteScreenieDatabaseForTests();
});

afterEach(() => {
  resetPreferences();
  localStorage.clear();
});

describe('Workspace views', () => {
  it('renders the integrations capability hub', () => {
    render(<IntegrationsView />);

    expect(screen.getByRole('heading', { name: 'Integrations' })).toBeInTheDocument();
    expect(screen.getByText('Local storage')).toBeInTheDocument();
    expect(screen.getByText('Local OCR')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Bridge ready')).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('runs the extension bridge test', async () => {
    const user = userEvent.setup();
    const onTestBridge = vi.fn();

    render(<IntegrationsView onTestBridge={onTestBridge} />);

    await user.click(screen.getByRole('button', { name: 'Test connection' }));

    expect(onTestBridge).toHaveBeenCalledOnce();
    expect(await screen.findByText(/Sample capture sent/i)).toBeInTheDocument();
  });

  it('runs OCR on queued items from integrations', async () => {
    const user = userEvent.setup();
    const onRunAllOcr = vi.fn().mockResolvedValue(undefined);

    render(
      <IntegrationsView
        items={[makeItem({ type: 'screenshot', mimeType: 'image/png', imageDataUrl: 'data:image/png;base64,xx' })]}
        onRunAllOcr={onRunAllOcr}
      />
    );

    await user.click(screen.getByRole('button', { name: /Run all queued/i }));

    expect(onRunAllOcr).toHaveBeenCalledOnce();
  });

  it('renders templates and selects one with tags', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<TemplatesView onSelectTemplate={onSelect} />);

    expect(screen.getByRole('heading', { name: 'Templates' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Use template' })[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it('creates a custom template that persists', async () => {
    const user = userEvent.setup();

    render(<TemplatesView onSelectTemplate={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: 'New template' })[0]);

    const dialog = screen.getByRole('dialog', { name: 'New template' });
    await user.type(within(dialog).getByLabelText('Name'), 'Weekly review');
    await user.type(within(dialog).getByLabelText('Content'), 'What went well?');
    await user.click(within(dialog).getByRole('button', { name: 'Create template' }));

    await waitFor(() => expect(screen.getByText('Weekly review')).toBeInTheDocument());
  });

  it('renders settings sections', () => {
    render(
      <SettingsView
        onClearAll={async () => undefined}
        onExportWorkspace={async () => ({ version: 1, exportedAt: '2026-06-16T12:00:00.000Z', items: [], projects: [] })}
        onImportWorkspace={async () => undefined}
        onResetDemo={async () => undefined}
      />
    );

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Capture defaults')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear all data' })).toBeInTheDocument();
  });
});
