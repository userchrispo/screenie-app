import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapturePanel } from './CapturePanel';

describe('CapturePanel metadata', () => {
  it('saves link metadata with normalized tags', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CapturePanel onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: /Paste link/i }));
    fireEvent.change(screen.getByLabelText('Paste link'), {
      target: { value: 'https://screenie.app/pricing' }
    });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Pricing page' } });
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: '#Pricing, Research' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pricing page',
        tags: ['link', 'intake', 'pricing', 'research']
      })
    );
  });
});
