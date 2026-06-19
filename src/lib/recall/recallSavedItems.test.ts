import type { Project, SavedItem } from '../../domain/savedItem';
import { recallSavedItems } from './recallSavedItems';

const projects: Project[] = [
  {
    id: 'project-pricing',
    name: 'Pricing Research',
    createdAt: '2024-05-01T09:00:00.000Z'
  },
  {
    id: 'project-design',
    name: 'Website Redesign',
    createdAt: '2024-05-02T09:00:00.000Z'
  }
];

const items: SavedItem[] = [
  {
    id: 'shot-pricing',
    type: 'screenshot',
    title: 'Pricing screenshot from last week',
    text: 'Pro $49 /mo Billed monthly',
    extractedText: 'Simple transparent pricing. Starter $19. Pro $49. Team $99.',
    tags: ['pricing', 'pro plan', 'screenshot'],
    projectId: 'project-pricing',
    source: 'paste',
    ocrStatus: 'ready',
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
    projectId: 'project-pricing',
    source: 'manual',
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
    projectId: 'project-pricing',
    source: 'upload',
    ocrStatus: 'ready',
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-06T09:31:00.000Z',
    updatedAt: '2024-05-06T09:31:00.000Z'
  },
  {
    id: 'design-link',
    type: 'link',
    title: 'Design inspiration',
    url: 'https://example.com/design',
    text: 'Reference links for a visual design exploration.',
    tags: ['design', 'inspiration'],
    projectId: 'project-design',
    source: 'manual',
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-04T11:12:00.000Z',
    updatedAt: '2024-05-04T11:12:00.000Z'
  },
  {
    id: 'favorite-unrelated',
    type: 'snippet',
    title: 'Favorite unrelated note',
    text: 'A note about onboarding flows.',
    tags: ['onboarding'],
    source: 'manual',
    isFavorite: true,
    status: 'active',
    createdAt: '2024-05-09T11:12:00.000Z',
    updatedAt: '2024-05-09T11:12:00.000Z'
  },
  {
    id: 'trash-pricing',
    type: 'snippet',
    title: 'Trashed pricing note',
    text: 'Old pricing draft',
    tags: ['pricing'],
    source: 'manual',
    isFavorite: false,
    status: 'trash',
    createdAt: '2024-05-03T09:00:00.000Z',
    updatedAt: '2024-05-03T09:00:00.000Z'
  }
];

describe('recallSavedItems', () => {
  it('recalls OCR-only phrases with evidence', () => {
    const results = recallSavedItems({
      items,
      projects,
      text: 'transparent starter team',
      now: '2024-05-15T12:00:00.000Z'
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      item: { id: 'shot-pricing' },
      answer: expect.stringContaining('transparent pricing'),
      signals: expect.arrayContaining([
        expect.objectContaining({ kind: 'ocr', label: 'OCR text' }),
        expect.objectContaining({ kind: 'project', label: 'Pricing Research' })
      ])
    });
  });

  it('boosts remembered date language without losing text relevance', () => {
    const results = recallSavedItems({
      items,
      projects,
      text: 'pricing screenshot last week',
      now: '2024-05-15T12:00:00.000Z'
    });

    expect(results.map((result) => result.item.id).slice(0, 3)).toEqual([
      'shot-pricing',
      'hero-image',
      'link-pricing'
    ]);
    expect(results[0].signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'date', label: 'Last week' }),
        expect.objectContaining({ kind: 'project', label: 'Pricing Research' })
      ])
    );
  });

  it('does not let favorite status make unrelated items win', () => {
    const results = recallSavedItems({
      items,
      projects,
      text: 'design inspiration',
      now: '2024-05-15T12:00:00.000Z'
    });

    expect(results[0].item.id).toBe('design-link');
    expect(results.some((result) => result.item.id === 'favorite-unrelated')).toBe(false);
  });

  it('returns related captures from shared project tags source and date proximity', () => {
    const results = recallSavedItems({
      items,
      projects,
      text: 'pricing screenshot last week',
      now: '2024-05-15T12:00:00.000Z'
    });

    expect(results[0].relatedItemIds).toEqual(['hero-image', 'link-pricing']);
  });
});
