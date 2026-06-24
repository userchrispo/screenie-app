import { CAPTURE_BRIDGE_MESSAGE, type CaptureBridgeMessage } from '../../domain/captureDraft';

export const SAMPLE_BRIDGE_MESSAGE: CaptureBridgeMessage = {
  type: CAPTURE_BRIDGE_MESSAGE,
  draft: {
    type: 'link',
    title: 'Screenie bridge test',
    url: 'https://screenie.app',
    text: 'Sample capture posted from the integrations bridge test.',
    tags: ['bridge', 'test'],
    source: 'extension'
  }
};

export const BRIDGE_SNIPPET = `// From your browser extension content script:
window.postMessage(
  {
    type: '${CAPTURE_BRIDGE_MESSAGE}',
    draft: {
      type: 'link', // 'link' | 'snippet' | 'image' | 'screenshot'
      title: document.title,
      url: location.href,
      tags: ['clipped'],
      source: 'extension'
    }
  },
  '*'
);`;
