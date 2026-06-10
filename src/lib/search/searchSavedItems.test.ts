import type { SavedItem } from '../../domain/savedItem';
import { searchSavedItems } from './searchSavedItems';

const items: SavedItem[] = [
  {
    id: 'shot-pricing',
    type: 'screenshot',
    title: 'Pricing screenshot',
    text: 'Pro $49 /mo billed monthly',
    extractedText: 'Simple transparent pricing starter pro team',
    tags: ['pricing', 'pro plan', 'screenshot'],
    isFavorite: true,
    status: 'active',
    createdAt: '2024-05-08T10:42:00.000Z',
    updatedAt: '2024-05-08T10:42:00.000Z'
  },
  {
    id: 'link-pricing',
    type: 'link',
    title: 'Our Pricing Plans - Screenie',
    url: 'https://screenie.app/pricing',
    text: 'Pro plan includes advanced analytics and priority support.',
    tags: ['pricing', 'features'],
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-07T15:15:00.000Z',
    updatedAt: '2024-05-07T15:15:00.000Z'
  },
  {
    id: 'trash-note',
    type: 'snippet',
    title: 'Old pricing note',
    text: 'Archived pricing draft',
    tags: ['pricing'],
    isFavorite: false,
    status: 'trash',
    createdAt: '2024-05-01T09:00:00.000Z',
    updatedAt: '2024-05-01T09:00:00.000Z'
  }
];

describe('searchSavedItems', () => {
  it('returns active matches ranked by stronger field matches', () => {
    const results = searchSavedItems(items, {
      text: 'pricing pro plan',
      filter: 'inbox',
      sortBy: 'best-match'
    });

    expect(results.map((result) => result.item.id)).toEqual(['shot-pricing', 'link-pricing']);
    expect(results[0].matchedText).toContain('Pro $49');
  });

  it('can filter trash separately', () => {
    const results = searchSavedItems(items, {
      text: 'pricing',
      filter: 'trash',
      sortBy: 'newest'
    });

    expect(results).toHaveLength(1);
    expect(results[0].item.id).toBe('trash-note');
  });
});
