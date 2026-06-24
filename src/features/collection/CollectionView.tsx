import type { ReactNode } from 'react';
import type { SavedItem } from '../../domain/savedItem';
import { SavedItemCard } from '../../components/SavedItemCard';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { SectionLabel } from '../../components/SectionLabel';
import { EmptyState } from '../../components/EmptyState';
import type { searchSavedItems } from '../../lib/search/searchSavedItems';

export type CollectionResult = ReturnType<typeof searchSavedItems>[number];

export interface CollectionCardHandlers {
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
  onOpenDetail?: (item: SavedItem) => void;
  onTagClick?: (tag: string) => void;
  onDeletePermanently?: (item: SavedItem) => void;
}

export interface CollectionSection {
  id: string;
  label: string;
  results: CollectionResult[];
}

interface CollectionViewProps {
  titleId: string;
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
  header?: ReactNode;
  metaText?: string;
  results?: CollectionResult[];
  sections?: CollectionSection[];
  empty: { icon?: ReactNode; title: string; description?: string };
  handlers: CollectionCardHandlers;
  layout?: 'list' | 'grid';
}

export function CollectionView({
  titleId,
  title,
  subtitle,
  eyebrow,
  actions,
  header,
  metaText,
  results,
  sections,
  empty,
  handlers,
  layout = 'grid'
}: CollectionViewProps) {
  const hasContent = sections ? sections.length > 0 : (results?.length ?? 0) > 0;

  return (
    <div className="saved-view page-stack">
      <PageHeader titleId={titleId} eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} />

      <SurfaceCard as="section" className="content-section" aria-labelledby={titleId}>
        {header}
        {metaText ? <p className="text-muted saved-view__meta">{metaText}</p> : null}

        {hasContent ? (
          sections ? (
            <div className="library-sections">
              {sections.map((section) => (
                <section key={section.id} className="library-section" aria-label={section.label}>
                  <SectionLabel>{section.label}</SectionLabel>
                  <ResultGrid results={section.results} handlers={handlers} layout={layout} />
                </section>
              ))}
            </div>
          ) : (
            <ResultGrid results={results ?? []} handlers={handlers} layout={layout} />
          )
        ) : (
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
        )}
      </SurfaceCard>
    </div>
  );
}

function ResultGrid({
  results,
  handlers,
  layout
}: {
  results: CollectionResult[];
  handlers: CollectionCardHandlers;
  layout: 'list' | 'grid';
}) {
  return (
    <div className={`item-list${layout === 'grid' ? ' dashboard-card-grid' : ''}`}>
      {results.map((result) => (
        <SavedItemCard
          key={result.item.id}
          item={result.item}
          matchedText={result.matchedText}
          matchSummary={result.matchSummary}
          {...handlers}
        />
      ))}
    </div>
  );
}
