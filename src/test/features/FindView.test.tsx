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

function FindViewHarness({
  items,
  initialSearch = ''
}: {
  items: SavedItem[];
  initialSearch?: string;
}) {
  const [searchText, setSearchText] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<ScreenieSort>('best-match');

  return (
    <FindView
      items={items}
      filter="inbox"
      searchText={searchText}
      sortBy={sortBy}
      onSearchTextChange={setSearchText}
      onSortChange={setSortBy}
      typeFilter={[]}
      tagFilter={[]}
      onToggleFavorite={vi.fn()}
      onMoveToTrash={vi.fn()}
      onRestore={vi.fn()}
      onOpenDetail={vi.fn()}
      onTagClick={vi.fn()}
    />
  );
}

describe('FindView', () => {
  it('exposes the page header and sort combobox', () => {
    render(<FindViewHarness items={pricingFixtures} />);

    expect(screen.getByRole('heading', { name: /^Find$/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Newest' })).toBeInTheDocument();
  });

  it('shows result count and pricing matches for seeded-style fixtures', () => {
    render(<FindViewHarness items={pricingFixtures} initialSearch="pricing pro plan" />);

    expect(screen.getByText(/\d+ results found/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pricing screenshot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Our Pricing Plans - Screenie' })).toBeInTheDocument();
  });

  it('finds screenshots by OCR-only text and marks the result as OCR-backed', () => {
    const ocrOnlyFixture: SavedItem = {
      id: 'fixture-ocr-only',
      type: 'screenshot',
      title: 'Receipt capture',
      extractedText: 'Invoice zebra total 118 paid by card',
      tags: ['receipt'],
      isFavorite: false,
      status: 'active',
      createdAt: '2026-01-04T00:00:00.000Z',
      updatedAt: '2026-01-04T00:00:00.000Z'
    };

    render(<FindViewHarness items={[...pricingFixtures, ocrOnlyFixture]} initialSearch="zebra 118" />);

    expect(screen.getByText('1 results found')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Receipt capture' })).toBeInTheDocument();
    expect(screen.getByText('OCR ready')).toBeInTheDocument();
    expect(screen.getByText('Matched text')).toBeInTheDocument();
    expect(screen.getByText(/Invoice zebra total 118/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Our Pricing Plans - Screenie' })).not.toBeInTheDocument();
  });

  it('updates sort order from the header control', async () => {
    const user = userEvent.setup();
    render(<FindViewHarness items={pricingFixtures} initialSearch="pricing" />);

    await user.selectOptions(screen.getByRole('combobox', { name: /sort by/i }), 'newest');
    expect(screen.getByRole('combobox', { name: /sort by/i })).toHaveValue('newest');
  });
});
