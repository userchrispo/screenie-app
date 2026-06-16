import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapturePanel } from './CapturePanel';

describe('CapturePanel metadata', () => {
  it('saves link metadata with normalized tags', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CapturePanel onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: /Paste link/i }));
    await user.type(screen.getByLabelText('Paste link'), 'https://screenie.app/pricing');
    await user.type(screen.getByLabelText('Title'), 'Pricing page');
    await user.clear(screen.getByLabelText('Tags'));
    await user.type(screen.getByLabelText('Tags'), '#Pricing, Research');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pricing page',
        tags: ['link', 'intake', 'pricing', 'research']
      })
    );
  });
});
