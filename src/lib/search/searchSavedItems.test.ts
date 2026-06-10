import type { SavedItem } from '../../domain/savedItem';
import { searchSavedItems } from './searchSavedItems';

const items: SavedItem[] = [
  {
    id: 'shot-pricing',
    type: 'screenshot',
    title: 'Pricing screenshot from last week',
    text: 'Pro $49 /mo Billed monthly',
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
    id: 'hero-image',
    type: 'image',
    title: 'Pricing hero image',
    text: 'Filename contains pricing; tagged pricing.',
    tags: ['pricing', 'hero'],
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-06T09:31:00.000Z',
    updatedAt: '2024-05-06T09:31:00.000Z'
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

    expect(results.map((result) => result.item.id)).toEqual(['shot-pricing', 'link-pricing', 'hero-image']);
    expect(results[0]).toMatchObject({
      matchKind: 'text',
      matchedText: 'Pro $49 /mo Billed monthly',
      matchedTags: ['pricing', 'pro plan']
    });
    expect(results[0].matchSummary).toContain('Matched text');
  });

  it('handles natural screenshot search wording with stop words', () => {
    const results = searchSavedItems(items, {
      text: 'that pricing screenshot from last week',
      filter: 'library',
      sortBy: 'best-match',
      limit: 3
    });

    expect(results.map((result) => result.item.id)).toEqual(['shot-pricing', 'hero-image', 'link-pricing']);
    expect(results[0].matchedTerms).toEqual(expect.arrayContaining(['pricing', 'screenshot']));
  });

  it('supports type and tag filters for narrowed result sets', () => {
    const results = searchSavedItems(items, {
      text: 'pricing',
      filter: 'tags',
      sortBy: 'newest',
      tags: ['hero'],
      types: ['image']
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      item: { id: 'hero-image' },
      matchedTags: ['pricing']
    });
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

  it('sorts empty searches without requiring a text match', () => {
    const results = searchSavedItems(items, {
      text: '',
      filter: 'inbox',
      sortBy: 'oldest'
    });

    expect(results.map((result) => result.item.id)).toEqual(['hero-image', 'link-pricing', 'shot-pricing']);
  });
});
