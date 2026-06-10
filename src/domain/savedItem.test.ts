import { createSavedItem, updateSavedItem } from './savedItem';

describe('createSavedItem', () => {
  it('creates an active item with defaults and trimmed tags', () => {
    const item = createSavedItem({
      type: 'link',
      title: ' Pricing Plans ',
      url: 'https://screenie.app/pricing',
      tags: [' pricing ', 'pro plan', 'pricing'],
      now: '2026-06-10T12:00:00.000Z'
    });

    expect(item).toMatchObject({
      type: 'link',
      title: 'Pricing Plans',
      url: 'https://screenie.app/pricing',
      tags: ['pricing', 'pro plan'],
      isFavorite: false,
      status: 'active',
      createdAt: '2026-06-10T12:00:00.000Z',
      updatedAt: '2026-06-10T12:00:00.000Z'
    });
    expect(item.id).toMatch(/^item-/);
  });

  it('falls back to an untitled label when title is blank', () => {
    const item = createSavedItem({ type: 'snippet', title: '   ', now: '2026-06-10T12:00:00.000Z' });

    expect(item.title).toBe('Untitled item');
  });
});

describe('updateSavedItem', () => {
  it('normalizes partial updates without changing omitted fields', () => {
    const item = createSavedItem({
      type: 'snippet',
      title: 'Original',
      text: 'Keep me',
      tags: ['research'],
      now: '2026-06-10T12:00:00.000Z'
    });

    const updated = updateSavedItem(
      item,
      { title: ' Updated ', tags: [' Pricing ', 'pricing', ' OCR '] },
      '2026-06-10T13:00:00.000Z'
    );

    expect(updated).toMatchObject({
      title: 'Updated',
      text: 'Keep me',
      tags: ['pricing', 'ocr'],
      createdAt: '2026-06-10T12:00:00.000Z',
      updatedAt: '2026-06-10T13:00:00.000Z'
    });
  });
});
