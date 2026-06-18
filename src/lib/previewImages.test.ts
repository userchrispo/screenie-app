import type { SavedItem } from '../domain/savedItem';
import { getLinkScreenshotUrl, getSavedItemPreviewImage } from './previewImages';

describe('preview image helpers', () => {
  it('builds an mShots screenshot URL for saved web links', () => {
    expect(getLinkScreenshotUrl('https://screenie.app/pricing')).toBe(
      'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fscreenie.app%2Fpricing?w=900'
    );
  });

  it('does not build screenshot URLs for unsupported protocols', () => {
    expect(getLinkScreenshotUrl('javascript:alert(1)')).toBeUndefined();
    expect(getLinkScreenshotUrl('ftp://screenie.app/file')).toBeUndefined();
  });

  it('prefers local image data before deriving a link screenshot URL', () => {
    const item = {
      type: 'link',
      url: 'https://screenie.app/pricing',
      imageDataUrl: 'data:image/png;base64,local-preview'
    } satisfies Pick<SavedItem, 'type' | 'url' | 'imageDataUrl'>;

    expect(getSavedItemPreviewImage(item)).toBe('data:image/png;base64,local-preview');
  });
});
