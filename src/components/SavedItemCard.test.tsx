import { fireEvent, render } from '@testing-library/react';
import type { SavedItem } from '../domain/savedItem';
import { getLinkScreenshotUrl } from '../lib/previewImages';
import { SavedItemCard } from './SavedItemCard';

const baseItem = {
  id: 'item-preview',
  title: 'Preview item',
  tags: ['preview'],
  isFavorite: false,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
} satisfies Partial<SavedItem>;

const handlers = {
  onToggleFavorite: vi.fn(),
  onMoveToTrash: vi.fn(),
  onRestore: vi.fn()
};

function renderCard(item: SavedItem) {
  return render(<SavedItemCard item={item} {...handlers} />);
}

describe('SavedItemCard previews', () => {
  it('renders a remote page screenshot thumbnail for link cards', () => {
    const linkItem: SavedItem = {
      ...baseItem,
      type: 'link',
      url: 'https://screenie.app/pricing'
    } as SavedItem;

    const { container } = renderCard(linkItem);
    const image = container.querySelector<HTMLImageElement>('.item-thumb img');

    expect(image).toHaveAttribute('src', getLinkScreenshotUrl(linkItem.url));
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('renders saved screenshot image data for screenshot cards', () => {
    const screenshotItem: SavedItem = {
      ...baseItem,
      type: 'screenshot',
      imageDataUrl: 'data:image/png;base64,screenshot-preview',
      sizeBytes: 1024
    } as SavedItem;

    const { container } = renderCard(screenshotItem);
    const image = container.querySelector<HTMLImageElement>('.item-thumb img');

    expect(image).toHaveAttribute('src', screenshotItem.imageDataUrl);
  });

  it('falls back to the type icon when a preview image fails to load', () => {
    const linkItem: SavedItem = {
      ...baseItem,
      type: 'link',
      url: 'https://screenie.app/pricing'
    } as SavedItem;

    const { container } = renderCard(linkItem);
    const image = container.querySelector<HTMLImageElement>('.item-thumb img');

    expect(image).not.toBeNull();
    fireEvent.error(image as HTMLImageElement);

    expect(container.querySelector('.item-thumb img')).toBeNull();
    expect(container.querySelector('.item-thumb svg')).not.toBeNull();
  });
});
