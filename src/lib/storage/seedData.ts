import type { SavedItem } from '../../domain/savedItem';

export const seedItems: SavedItem[] = [
  {
    id: 'seed-pricing-screenshot',
    type: 'screenshot',
    title: 'Pricing screenshot',
    text: 'Pro $49 /mo Billed monthly',
    extractedText: 'Simple transparent pricing. Starter $19. Pro $49. Team $99.',
    tags: ['pricing', 'pro plan', 'screenshot'],
    isFavorite: true,
    status: 'active',
    createdAt: '2024-05-08T10:42:00.000Z',
    updatedAt: '2024-05-08T10:42:00.000Z',
    thumbnailColor: 'pricing'
  },
  {
    id: 'seed-pricing-link',
    type: 'link',
    title: 'Our Pricing Plans - Screenie',
    url: 'https://screenie.app/pricing',
    text: 'Pro plan includes advanced analytics and priority support.',
    tags: ['pricing', 'pro plan', 'features'],
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-07T15:15:00.000Z',
    updatedAt: '2024-05-07T15:15:00.000Z',
    thumbnailColor: 'link'
  },
  {
    id: 'seed-hero-image',
    type: 'image',
    title: 'Landing page hero',
    text: 'Filename contains pricing and the image was tagged pricing.',
    tags: ['pricing', 'hero'],
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-06T09:31:00.000Z',
    updatedAt: '2024-05-06T09:31:00.000Z',
    thumbnailColor: 'hero'
  },
  {
    id: 'seed-onboarding-snippet',
    type: 'snippet',
    title: 'User onboarding flow',
    text: 'A short description of the new onboarding sequence and activation checklist.',
    tags: ['onboarding', 'research'],
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-05T16:18:00.000Z',
    updatedAt: '2024-05-05T16:18:00.000Z',
    thumbnailColor: 'snippet'
  },
  {
    id: 'seed-design-link',
    type: 'link',
    title: 'Design inspiration',
    url: 'https://www.notion.so/home',
    text: 'Reference links for a visual design exploration.',
    tags: ['design', 'inspiration'],
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-04T11:12:00.000Z',
    updatedAt: '2024-05-04T11:12:00.000Z',
    thumbnailColor: 'design'
  }
];
