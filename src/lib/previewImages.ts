import type { SavedItem } from '../domain/savedItem';

export function getSavedItemPreviewImage(
  item: Pick<SavedItem, 'type' | 'url' | 'imageDataUrl'>
): string | undefined {
  if (item.imageDataUrl) {
    return item.imageDataUrl;
  }

  return undefined;
}

/**
 * Derives a short, human-friendly brand/company name from a URL so link cards
 * can show a clean label instead of fetching a remote screenshot. Falls back to
 * the raw hostname, then the original string, when parsing fails.
 */
export function getLinkLabel(url: string | undefined): string {
  if (!url) {
    return 'Link';
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || 'Link';
  }

  const host = hostname.replace(/^www\./i, '');
  const segments = host.split('.').filter(Boolean);

  if (segments.length === 0) {
    return 'Link';
  }

  const brand = segments.length >= 2 ? segments[segments.length - 2] : segments[0];
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}
