import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsView } from './SettingsView';

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
