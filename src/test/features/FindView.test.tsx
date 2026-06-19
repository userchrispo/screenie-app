import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project, SavedItem, ScreenieSort } from '../../domain/savedItem';
import { FindView } from '../../features/find/FindView';

const projects: Project[] = [
  {
    id: 'project-pricing',
    name: 'Pricing Research',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

const pricingFixtures: SavedItem[] = [
  {
    id: 'fixture-pricing-screenshot',
    type: 'screenshot',
    title: 'Pricing screenshot',
    extractedText: 'Starter $19 Pro $49 Team $99',
    tags: ['pricing', 'pro plan'],
    projectId: 'project-pricing',
    source: 'paste',
    ocrStatus: 'ready',
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
    projectId: 'project-pricing',
    source: 'manual',
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
      projects={projects}
      filter="library"
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
    expect(screen.getAllByRole('heading', { name: 'Pricing screenshot' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: 'Our Pricing Plans - Screenie' }).length).toBeGreaterThan(0);
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
    expect(screen.getAllByRole('heading', { name: 'Receipt capture' }).length).toBeGreaterThan(0);
    expect(screen.getByText('OCR ready')).toBeInTheDocument();
    expect(screen.getByText('Matched text')).toBeInTheDocument();
    expect(screen.getAllByText(/Invoice zebra total 118/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: 'Our Pricing Plans - Screenie' })).not.toBeInTheDocument();
  });

  it('shows a best memory match with local recall evidence', () => {
    render(<FindViewHarness items={pricingFixtures} initialSearch="starter team" />);

    const recallRegion = screen.getByRole('region', { name: 'Best memory match' });

    expect(within(recallRegion).getByText('Pricing screenshot')).toBeInTheDocument();
    expect(within(recallRegion).getByText('OCR text')).toBeInTheDocument();
    expect(within(recallRegion).getByText('Pricing Research')).toBeInTheDocument();
    expect(within(recallRegion).getByText(/OCR matched/)).toBeInTheDocument();
  });

  it('offers recall suggestions when no results match', async () => {
    const user = userEvent.setup();
    render(<FindViewHarness items={pricingFixtures} initialSearch="no matching memory" />);

    expect(screen.getByRole('region', { name: 'Recall search suggestions' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '#pricing' }));

    expect(screen.getByText(/results found/)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Pricing screenshot' }).length).toBeGreaterThan(0);
  });

  it('updates sort order from the header control', async () => {
    const user = userEvent.setup();
    render(<FindViewHarness items={pricingFixtures} initialSearch="pricing" />);

    await user.selectOptions(screen.getByRole('combobox', { name: /sort by/i }), 'newest');
    expect(screen.getByRole('combobox', { name: /sort by/i })).toHaveValue('newest');
  });
});
