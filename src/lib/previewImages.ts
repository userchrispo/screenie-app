import type { SavedItem } from '../domain/savedItem';

const MSHOTS_BASE_URL = 'https://s.wordpress.com/mshots/v1/';
const LINK_SCREENSHOT_WIDTH = 900;

export function getLinkScreenshotUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return undefined;
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return undefined;
  }

  return `${MSHOTS_BASE_URL}${encodeURIComponent(parsedUrl.toString())}?w=${LINK_SCREENSHOT_WIDTH}`;
}

export function getSavedItemPreviewImage(
  item: Pick<SavedItem, 'type' | 'url' | 'imageDataUrl'>
): string | undefined {
  if (item.imageDataUrl) {
    return item.imageDataUrl;
  }

  if (item.type === 'link') {
    return getLinkScreenshotUrl(item.url);
  }

  return undefined;
}
