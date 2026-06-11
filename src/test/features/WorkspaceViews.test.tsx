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
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(2);
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
    render(<SettingsView onClearAll={async () => undefined} />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear all data' })).toBeInTheDocument();
  });
});
