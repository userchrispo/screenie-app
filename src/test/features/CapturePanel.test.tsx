import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapturePanel } from '../../features/inbox/CapturePanel';

describe('CapturePanel', () => {
  it('renders capture labels and action buttons', () => {
    render(<CapturePanel onCreate={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByLabelText('Paste link')).toBeInTheDocument();
    expect(screen.getByLabelText('Save snippet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save text' })).toBeInTheDocument();
  });

  it('shows validation messages when saving empty link or snippet', async () => {
    const user = userEvent.setup();
    render(<CapturePanel onCreate={vi.fn().mockResolvedValue(undefined)} />);

    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Paste a URL first.');

    await user.click(screen.getByRole('button', { name: 'Save text' }));
    expect(screen.getByRole('status')).toHaveTextContent('Write a snippet first.');
  });

  it('saves a link and shows confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await user.type(screen.getByLabelText('Paste link'), 'screenie.app/pricing');
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Link saved.');
  });

  it('saves a snippet and shows confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await user.type(
      screen.getByLabelText('Save snippet'),
      'Pro plan includes advanced analytics and priority support.'
    );
    await user.click(screen.getByRole('button', { name: 'Save text' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Snippet saved.');
  });
});
