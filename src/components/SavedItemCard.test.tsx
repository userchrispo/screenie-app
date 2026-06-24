import { render } from '@testing-library/react';
import type { SavedItem } from '../domain/savedItem';
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
  it('shows the company name instead of a screenshot for link cards', () => {
    const linkItem: SavedItem = {
      ...baseItem,
      type: 'link',
      url: 'https://screenie.app/pricing'
    } as SavedItem;

    const { container } = renderCard(linkItem);

    expect(container.querySelector('.item-thumb img')).toBeNull();
    expect(container.querySelector('.item-thumb__brand')?.textContent).toBe('Screenie');
  });

  it('renders the snippet text as the thumbnail for text cards', () => {
    const snippetItem: SavedItem = {
      ...baseItem,
      type: 'snippet',
      text: 'Meeting notes: ship the preview update.'
    } as SavedItem;

    const { container } = renderCard(snippetItem);

    expect(container.querySelector('.item-thumb img')).toBeNull();
    expect(container.querySelector('.note-preview__text')?.textContent).toBe(
      'Meeting notes: ship the preview update.'
    );
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
});
