import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapturePanel } from './CapturePanel';

describe('CapturePanel metadata', () => {
  it('saves link metadata with normalized tags', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CapturePanel onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText('Link URL'), {
      target: { value: 'https://screenie.app/pricing' }
    });
    await user.click(screen.getByRole('button', { name: 'Add title & tags' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Pricing page' } });
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: '#Pricing, Research' } });
    await user.click(screen.getByRole('button', { name: 'Save link' }));

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

    await user.click(screen.getByRole('button', { name: 'Screenshot' }));
    const file = new File(['screenie preview'], 'screen-capture.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Add image'), { target: { files: [file] } });

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
