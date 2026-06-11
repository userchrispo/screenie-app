import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapturePanel } from '../../features/inbox/CapturePanel';

async function expandLinkTile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Paste link/i }));
}

async function expandSnippetTile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Save snippet/i }));
}

describe('CapturePanel', () => {
  it('renders capture labels and action buttons', async () => {
    const user = userEvent.setup();
    render(<CapturePanel onCreate={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByRole('button', { name: /Paste link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save snippet/i })).toBeInTheDocument();

    await expandLinkTile(user);
    expect(screen.getByLabelText('Paste link')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await expandSnippetTile(user);
    expect(screen.getByLabelText('Save snippet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save text' })).toBeInTheDocument();
  });

  it('shows validation messages when saving empty link or snippet', async () => {
    const user = userEvent.setup();
    render(<CapturePanel onCreate={vi.fn().mockResolvedValue(undefined)} />);

    await expandLinkTile(user);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('status')).toHaveTextContent('Paste a URL first.');

    await user.keyboard('{Escape}');
    await expandSnippetTile(user);
    await user.click(screen.getByRole('button', { name: 'Save text' }));
    expect(screen.getByRole('status')).toHaveTextContent('Write a snippet first.');
  });

  it('saves a link and shows confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await expandLinkTile(user);
    await user.type(screen.getByLabelText('Paste link'), 'screenie.app/pricing');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Link saved.');
  });

  it('rejects malformed links without creating an item', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await expandLinkTile(user);
    await user.type(screen.getByLabelText('Paste link'), 'not a real url');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Enter a valid URL.');
  });

  it('saves a snippet and shows confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await expandSnippetTile(user);
    await user.type(
      screen.getByLabelText('Save snippet'),
      'Pro plan includes advanced analytics and priority support.'
    );
    await user.click(screen.getByRole('button', { name: 'Save text' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Snippet saved.');
  });
});
