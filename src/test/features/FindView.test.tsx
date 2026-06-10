import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SavedItem, ScreenieSort } from '../../domain/savedItem';
import { FindView } from '../../features/find/FindView';

const pricingFixtures: SavedItem[] = [
  {
    id: 'fixture-pricing-screenshot',
    type: 'screenshot',
    title: 'Pricing screenshot',
    extractedText: 'Starter $19 Pro $49 Team $99',
    tags: ['pricing', 'pro plan'],
    isFavorite: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'fixture-pricing-link',
    type: 'link',
    title: 'Our Pricing Plans - Screenie',
    url: 'https://screenie.app/pricing',
    text: 'Saved link from screenie.app',
    tags: ['pricing', 'pro plan'],
    isFavorite: false,
    status: 'active',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'fixture-onboarding',
    type: 'snippet',
    title: 'User onboarding flow',
    text: 'Collect role and team size during signup.',
    tags: ['onboarding'],
    isFavorite: false,
    status: 'active',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z'
  }
];

function FindViewHarness({ items }: { items: SavedItem[] }) {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<ScreenieSort>('best-match');

  return (
    <FindView
      items={items}
      filter="inbox"
      searchText={searchText}
      sortBy={sortBy}
      onSearchTextChange={setSearchText}
      onSortChange={setSortBy}
      onToggleFavorite={vi.fn()}
      onMoveToTrash={vi.fn()}
      onRestore={vi.fn()}
    />
  );
}

describe('FindView', () => {
  it('exposes an accessible search field and sort combobox', () => {
    render(<FindViewHarness items={pricingFixtures} />);

    expect(screen.getByRole('textbox', { name: /search everything in screenie/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Newest' })).toBeInTheDocument();
  });

  it('shows result count and pricing matches for seeded-style fixtures', async () => {
    const user = userEvent.setup();
    render(<FindViewHarness items={pricingFixtures} />);

    await user.type(screen.getByRole('textbox', { name: /search everything in screenie/i }), 'pricing pro plan');

    expect(screen.getByText(/\d+ results found/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pricing screenshot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Our Pricing Plans - Screenie' })).toBeInTheDocument();
  });
});
