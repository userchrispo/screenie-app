import { createSavedItem } from './savedItem';

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
});
