import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapturePanel } from '../../features/inbox/CapturePanel';

function changeField(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function pngFile(name = 'paste-screen.png', size = 1) {
  return new File([new Uint8Array(size)], name, { type: 'image/png' });
}

function textPasteData(text: string) {
  return {
    files: [],
    items: [],
    getData: (type: string) => (type === 'text/plain' || type === 'text' ? text : '')
  };
}

function filePasteData(file: File) {
  return {
    files: [file],
    items: [
      {
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      }
    ],
    getData: () => ''
  };
}

describe('CapturePanel', () => {
  it('renders capture modes and switches between fields', async () => {
    const user = userEvent.setup();
    render(<CapturePanel onCreate={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Screenshot' })).toBeInTheDocument();

    expect(screen.getByLabelText('Link URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save link' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Text' }));
    expect(screen.getByLabelText('Note')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save note' })).toBeInTheDocument();
  });

  it('shows validation messages when saving empty link or note', async () => {
    const user = userEvent.setup();
    render(<CapturePanel onCreate={vi.fn().mockResolvedValue(undefined)} />);

    await user.click(screen.getByRole('button', { name: 'Save link' }));
    expect(screen.getByRole('status')).toHaveTextContent('Paste a URL first.');

    await user.click(screen.getByRole('button', { name: 'Text' }));
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(screen.getByRole('status')).toHaveTextContent('Write a snippet first.');
  });

  it('saves a link and shows confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    changeField('Link URL', 'screenie.app/pricing');
    await user.click(screen.getByRole('button', { name: 'Save link' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Link saved.');
  });

  it('saves a prefilled link from an external intake stub', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <CapturePanel onCreate={onCreate} initialMode="link" initialLink="https://docs.screenie.app/capture" />
    );

    expect(screen.getByLabelText('Link URL')).toHaveValue('https://docs.screenie.app/capture');

    await user.click(screen.getByRole('button', { name: 'Save link' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'link',
        title: 'docs.screenie.app',
        url: 'https://docs.screenie.app/capture',
        tags: ['link', 'intake']
      })
    );
    expect(screen.getByRole('status')).toHaveTextContent('Link saved.');
  });

  it('rejects malformed links without creating an item', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    changeField('Link URL', 'not a real url');
    await user.click(screen.getByRole('button', { name: 'Save link' }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Enter a valid URL.');
  });

  it('saves a note and shows confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: 'Text' }));
    changeField('Note', 'Pro plan includes advanced analytics and priority support.');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Snippet saved.');
  });

  it('saves a prefilled note from an external intake stub', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <CapturePanel
        onCreate={onCreate}
        initialMode="snippet"
        initialSnippet="Research note clipped from the browser extension bridge."
      />
    );

    expect(screen.getByLabelText('Note')).toHaveValue(
      'Research note clipped from the browser extension bridge.'
    );

    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'snippet',
        title: 'Research note clipped from the',
        text: 'Research note clipped from the browser extension bridge.',
        tags: ['snippet', 'intake']
      })
    );
    expect(screen.getByRole('status')).toHaveTextContent('Snippet saved.');
  });

  it('opens image review from pasted image files and saves them after confirmation', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    fireEvent.paste(document, { clipboardData: filePasteData(pngFile()) });

    expect(await screen.findByLabelText('Images ready to save')).toHaveTextContent('paste-screen.png');
    expect(screen.getByRole('status')).toHaveTextContent('1 image ready to review.');
    expect(onCreate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save image' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'screenshot',
        title: 'paste-screen',
        source: 'paste',
        ocrStatus: 'queued',
        ocrLanguage: 'eng',
        mimeType: 'image/png',
        tags: ['screenshot', 'intake', 'image']
      })
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 image saved. OCR queued.');
  });

  it('opens link review from pasted URL text', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    fireEvent.paste(document, { clipboardData: textPasteData('https://screenie.app/pricing') });

    expect(await screen.findByLabelText('Link URL')).toHaveValue('https://screenie.app/pricing');
    expect(screen.getByRole('status')).toHaveTextContent('Clipboard URL ready to review.');

    await user.click(screen.getByRole('button', { name: 'Save link' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'link',
        url: 'https://screenie.app/pricing',
        title: 'screenie.app'
      })
    );
  });

  it('opens note review from pasted plain text', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    fireEvent.paste(document, {
      clipboardData: textPasteData('Customer feedback says screenshots should paste directly.')
    });

    expect(await screen.findByLabelText('Note')).toHaveValue(
      'Customer feedback says screenshots should paste directly.'
    );
    expect(screen.getByRole('status')).toHaveTextContent('Clipboard text ready to review.');

    await user.click(screen.getByRole('button', { name: 'Save note' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'snippet',
        text: 'Customer feedback says screenshots should paste directly.'
      })
    );
  });

  it('does not intercept paste events inside existing form fields', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: 'Text' }));
    const noteInput = screen.getByLabelText('Note');
    fireEvent.paste(noteInput, { clipboardData: textPasteData('https://screenie.app/inside-field') });

    expect(screen.getByLabelText('Note')).toBeInTheDocument();
    expect(screen.queryByLabelText('Link URL')).not.toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('stages file picker images before saving', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: 'Screenshot' }));
    fireEvent.change(screen.getByLabelText('Add image'), {
      target: { files: [pngFile('picker-screen.png')] }
    });

    expect(await screen.findByLabelText('Images ready to save')).toHaveTextContent('picker-screen.png');
    expect(screen.getByRole('status')).toHaveTextContent('1 image ready to review.');
    expect(onCreate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save image' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ source: 'upload' }));
  });

  it('stages dropped image files and rejects invalid or oversized files', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CapturePanel onCreate={onCreate} />);

    fireEvent.drop(screen.getByRole('region', { name: 'Capture saved content' }), {
      dataTransfer: {
        files: [pngFile('drop-screen.png'), new File(['nope'], 'notes.txt', { type: 'text/plain' })]
      }
    });

    expect(await screen.findByLabelText('Images ready to save')).toHaveTextContent('drop-screen.png');
    expect(screen.getByRole('status')).toHaveTextContent('1 image ready to review. 1 skipped.');

    await user.click(screen.getByRole('button', { name: 'Save image' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ source: 'upload' }));

    fireEvent.drop(screen.getByRole('region', { name: 'Capture saved content' }), {
      dataTransfer: {
        files: [pngFile('too-large.png', 10 * 1024 * 1024 + 1)]
      }
    });

    expect(screen.getByRole('status')).toHaveTextContent('Choose image files under 10 MB.');
  });
});
