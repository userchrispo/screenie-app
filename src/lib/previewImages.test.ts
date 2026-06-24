import type { SavedItem } from '../domain/savedItem';
import { getLinkLabel, getSavedItemPreviewImage } from './previewImages';

describe('preview image helpers', () => {
  it('returns local image data for captures that have it', () => {
    const item = {
      type: 'screenshot',
      imageDataUrl: 'data:image/png;base64,local-preview'
    } satisfies Pick<SavedItem, 'type' | 'url' | 'imageDataUrl'>;

    expect(getSavedItemPreviewImage(item)).toBe('data:image/png;base64,local-preview');
  });

  it('does not derive a preview image for links', () => {
    const item = {
      type: 'link',
      url: 'https://screenie.app/pricing'
    } satisfies Pick<SavedItem, 'type' | 'url' | 'imageDataUrl'>;

    expect(getSavedItemPreviewImage(item)).toBeUndefined();
  });

  it('does not derive a preview image for snippets', () => {
    const item = {
      type: 'snippet'
    } satisfies Pick<SavedItem, 'type' | 'url' | 'imageDataUrl'>;

    expect(getSavedItemPreviewImage(item)).toBeUndefined();
  });
});

describe('getLinkLabel', () => {
  it('derives the brand name from common hostnames', () => {
    expect(getLinkLabel('https://screenie.app/pricing')).toBe('Screenie');
    expect(getLinkLabel('https://cursor.com/dashboard')).toBe('Cursor');
    expect(getLinkLabel('https://authenticator.cursor.sh/verify')).toBe('Cursor');
  });

  it('ignores a leading www prefix', () => {
    expect(getLinkLabel('https://www.github.com/anthropics')).toBe('Github');
  });

  it('falls back gracefully for missing or invalid URLs', () => {
    expect(getLinkLabel(undefined)).toBe('Link');
    expect(getLinkLabel('not a url')).toBe('not a url');
  });
});
