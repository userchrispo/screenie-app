import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('stages image uploads for review before saving', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CapturePanel onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: /Drop screenshot/i }));
    const file = new File(['screenie preview'], 'screen-capture.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Drop screenshot'), { target: { files: [file] } });

    expect(screen.getByText('1 image ready')).toBeTruthy();
    expect(screen.getByText('screen-capture.png')).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save image' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'screenshot',
          title: 'screen-capture',
          source: 'upload',
          ocrStatus: 'queued'
        })
      );
    });
  });
});
