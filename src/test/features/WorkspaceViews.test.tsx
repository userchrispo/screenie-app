import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrationsView } from '../../features/integrations/IntegrationsView';
import { TemplatesView } from '../../features/templates/TemplatesView';
import { SettingsView } from '../../features/settings/SettingsView';

describe('Workspace views', () => {
  it('renders integrations setup cards', () => {
    render(<IntegrationsView />);

    expect(screen.getByRole('heading', { name: 'Integrations' })).toBeInTheDocument();
    expect(screen.getByText('Local storage')).toBeInTheDocument();
    expect(screen.getByText('Local OCR')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Bridge ready')).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(1);
  });

  it('renders templates and selects one', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<TemplatesView onSelectTemplate={onSelect} />);

    expect(screen.getByRole('heading', { name: 'Templates' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Use template' })[0]);
    expect(onSelect).toHaveBeenCalled();
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
    expect(screen.getByRole('button', { name: 'Clear all data' })).toBeInTheDocument();
  });
});
