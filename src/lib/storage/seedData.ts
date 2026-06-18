import type { Project, SavedItem } from '../../domain/savedItem';

export const seedProjectIds = {
  websiteRedesign: 'seed-project-website-redesign',
  q2Campaign: 'seed-project-q2-campaign',
  pricingResearch: 'seed-project-pricing-research'
} as const;

export const seedProjects: Project[] = [
  {
    id: seedProjectIds.websiteRedesign,
    name: 'Website Redesign',
    createdAt: '2024-05-01T09:00:00.000Z'
  },
  {
    id: seedProjectIds.q2Campaign,
    name: 'Q2 Campaign',
    createdAt: '2024-05-02T09:00:00.000Z'
  },
  {
    id: seedProjectIds.pricingResearch,
    name: 'Pricing Research',
    createdAt: '2024-05-03T09:00:00.000Z'
  }
];

export const seedItems: SavedItem[] = [
  {
    id: 'seed-pricing-screenshot',
    type: 'screenshot',
    title: 'Pricing screenshot from last week',
    text: 'Pro $49 /mo Billed monthly',
    extractedText: 'Simple transparent pricing. Starter $19. Pro $49. Team $99. Priority support.',
    tags: ['pricing', 'pro plan', 'screenshot'],
    projectId: seedProjectIds.pricingResearch,
    source: 'seed',
    ocrStatus: 'ready',
    ocrLanguage: 'eng',
    ocrUpdatedAt: '2024-05-08T10:42:00.000Z',
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
    projectId: seedProjectIds.pricingResearch,
    source: 'seed',
    ocrStatus: 'not_applicable',
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-07T15:15:00.000Z',
    updatedAt: '2024-05-07T15:15:00.000Z',
    thumbnailColor: 'link'
  },
  {
    id: 'seed-hero-image',
    type: 'image',
    title: 'Pricing hero image',
    text: 'Filename contains pricing; tagged pricing.',
    tags: ['pricing', 'hero'],
    projectId: seedProjectIds.pricingResearch,
    source: 'seed',
    ocrStatus: 'ready',
    ocrLanguage: 'eng',
    ocrUpdatedAt: '2024-05-06T09:31:00.000Z',
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
    source: 'seed',
    ocrStatus: 'not_applicable',
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
    projectId: seedProjectIds.websiteRedesign,
    source: 'seed',
    ocrStatus: 'not_applicable',
    isFavorite: false,
    status: 'active',
    createdAt: '2024-05-04T11:12:00.000Z',
    updatedAt: '2024-05-04T11:12:00.000Z',
    thumbnailColor: 'design'
  }
];
