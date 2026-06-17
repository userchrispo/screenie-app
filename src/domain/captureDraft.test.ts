import {
  CAPTURE_BRIDGE_MESSAGE,
  captureDraftToCreateInput,
  parseCaptureBridgeMessage
} from './captureDraft';

describe('capture bridge drafts', () => {
  it('validates extension capture messages and normalizes tags', () => {
    const message = parseCaptureBridgeMessage({
      type: CAPTURE_BRIDGE_MESSAGE,
      draft: {
        type: 'link',
        title: ' Screenie docs ',
        url: 'https://docs.screenie.app',
        tags: [' Docs ', '#Research', 'docs'],
        source: 'extension'
      }
    });

    expect(message?.draft).toMatchObject({
      type: 'link',
      title: 'Screenie docs',
      url: 'https://docs.screenie.app',
      tags: ['docs', 'research'],
      source: 'extension'
    });
  });

  it('rejects incomplete bridge drafts', () => {
    expect(parseCaptureBridgeMessage({ type: CAPTURE_BRIDGE_MESSAGE, draft: { type: 'link', title: 'Missing URL' } })).toBeNull();
    expect(parseCaptureBridgeMessage({ type: 'other', draft: { type: 'snippet', title: 'Nope', text: 'text' } })).toBeNull();
  });

  it('maps image drafts to queued OCR create input', () => {
    const input = captureDraftToCreateInput({
      type: 'screenshot',
      title: 'Captured tab',
      imageDataUrl: 'data:image/png;base64,abc',
      mimeType: 'image/png',
      tags: ['tab']
    });

    expect(input).toMatchObject({
      type: 'screenshot',
      source: 'extension',
      ocrStatus: 'queued',
      ocrLanguage: 'eng',
      tags: ['tab']
    });
  });
});
