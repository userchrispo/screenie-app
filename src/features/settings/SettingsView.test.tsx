import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { SettingsView } from './SettingsView';
import { resetPreferences } from '../../lib/preferences';
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

const noopProps = {
  onClearAll: vi.fn().mockResolvedValue(undefined),
  onExportWorkspace: vi.fn(),
  onImportWorkspace: vi.fn(),
  onResetDemo: vi.fn()
};

beforeEach(() => {
  resetPreferences();
});

afterEach(() => {
  resetPreferences();
  localStorage.clear();
});

describe('SettingsView data controls', () => {
  it('clears local data through an app-native dialog', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsView
        onClearAll={onClearAll}
        onExportWorkspace={vi.fn()}
        onImportWorkspace={vi.fn()}
        onResetDemo={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Clear all data/i }));

    const dialog = screen.getByRole('dialog', { name: 'Clear all data' });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Clear all data' }));

    expect(onClearAll).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent('Local workspace cleared.');
  });
});

describe('SettingsView insights and preferences', () => {
  it('summarizes the workspace from items and projects', () => {
    render(
      <SettingsView
        {...noopProps}
        items={[makeItem({ type: 'link' }), makeItem({ type: 'snippet' })]}
        projects={[{ id: 'p1', name: 'Inbox', createdAt: '2026-01-01T00:00:00.000Z' }]}
      />
    );

    const metrics = screen.getByLabelText('Workspace metrics');
    expect(within(metrics).getByText('Links').closest('.stat-card')).toHaveTextContent('1');
    expect(within(metrics).getByText('Notes').closest('.stat-card')).toHaveTextContent('1');
  });

  it('persists a capture default through preferences', async () => {
    const user = userEvent.setup();
    render(<SettingsView {...noopProps} />);

    const linkTags = screen.getByLabelText('Default link tags');
    await user.clear(linkTags);
    await user.type(linkTags, 'work, urgent');

    expect(JSON.parse(localStorage.getItem('screenie-prefs') ?? '{}').linkTags).toBe('work, urgent');
  });

  it('runs OCR on all queued items', async () => {
    const user = userEvent.setup();
    const onRunAllOcr = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsView
        {...noopProps}
        items={[makeItem({ type: 'screenshot', mimeType: 'image/png', imageDataUrl: 'data:image/png;base64,xxx' })]}
        onRunAllOcr={onRunAllOcr}
      />
    );

    await user.click(screen.getByRole('button', { name: /Run OCR on all queued/i }));

    expect(onRunAllOcr).toHaveBeenCalledOnce();
  });
});
