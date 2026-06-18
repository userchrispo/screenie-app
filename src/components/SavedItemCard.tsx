import {
  useEffect,
  useState
} from 'react';
import {
  ChevronRight,
  FileImage,
  Image,
  Link,
  RotateCcw,
  Star,
  Trash2,
  Type
} from 'lucide-react';
import type { SavedItem } from '../domain/savedItem';
import { formatBytes, formatItemDate } from '../lib/format';
import { getSavedItemPreviewImage } from '../lib/previewImages';
import { SurfaceCard } from './SurfaceCard';

interface SavedItemCardProps {
  item: SavedItem;
  matchedText?: string;
  matchSummary?: string;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
  onOpenDetail?: (item: SavedItem) => void;
  onTagClick?: (tag: string) => void;
  onDeletePermanently?: (item: SavedItem) => void;
}

export function SavedItemCard({
  item,
  matchedText,
  matchSummary,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onOpenDetail,
  onTagClick,
  onDeletePermanently
}: SavedItemCardProps) {
  const meta = getItemMeta(item);
  const ocrStatus = getOcrStatus(item);
  const previewText = matchedText ?? item.text ?? item.description ?? 'No preview available.';
  const matchLabel = matchedText ? 'Matched text' : matchSummary ? 'Why it matched' : 'Saved text';
  const previewImage = getSavedItemPreviewImage(item);
  const [failedPreviewImage, setFailedPreviewImage] = useState<string | null>(null);
  const shouldShowPreviewImage = Boolean(previewImage && failedPreviewImage !== previewImage);

  useEffect(() => {
    setFailedPreviewImage(null);
  }, [previewImage]);

  return (
    <SurfaceCard
      as="article"
      className={`item-card${onOpenDetail ? ' item-card--interactive' : ''}`}
      onClick={onOpenDetail ? () => onOpenDetail(item) : undefined}
    >
      <div className={`item-thumb item-thumb-${item.thumbnailColor ?? item.type}`}>
        {shouldShowPreviewImage ? (
          <img
            src={previewImage}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedPreviewImage(previewImage ?? null)}
          />
        ) : (
          <ItemTypeIcon type={item.type} size={28} strokeWidth={1.5} />
        )}
      </div>

      <div className="item-content">
        <div className="item-kicker">
          <ItemTypeIcon type={item.type} size={18} strokeWidth={1.5} />
          <span>{meta}</span>
          {ocrStatus ? <span className={`ocr-chip ocr-chip--${ocrStatus.variant}`}>{ocrStatus.label}</span> : null}
        </div>
        <h3>{item.title}</h3>
        {item.url ? <p className="item-url">{item.url}</p> : null}
        <p className="matched-copy">
          <span>{matchLabel}</span>
          {matchedText ? (
            <HighlightedText text={previewText} highlight={matchedText} />
          ) : matchSummary ? (
            matchSummary
          ) : (
            previewText
          )}
        </p>
        <div className="tag-row" aria-label={`${item.title} tags`}>
          {item.tags.map((tag) =>
            onTagClick ? (
              <button
                type="button"
                className="tag-chip tag-chip--button"
                key={tag}
                onClick={(event) => {
                  event.stopPropagation();
                  onTagClick(tag);
                }}
              >
                {tag}
              </button>
            ) : (
              <span className="tag-chip" key={tag}>
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      <div className="item-side">
        <time dateTime={item.createdAt}>{formatItemDate(item.createdAt)}</time>
        <div className="item-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={
              item.isFavorite ? `Remove ${item.title} from favorites` : `Favorite ${item.title}`
            }
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(item);
            }}
          >
            <Star size={18} strokeWidth={1.5} fill={item.isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          {item.status === 'trash' ? (
            <>
              <button
                className="icon-button"
                type="button"
                aria-label={`Restore ${item.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRestore(item);
                }}
              >
                <RotateCcw size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
              {onDeletePermanently ? (
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Delete ${item.title} permanently`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeletePermanently(item);
                  }}
                >
                  <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>
              ) : null}
            </>
          ) : (
            <button
              className="icon-button"
              type="button"
              aria-label={`Move ${item.title} to trash`}
              onClick={(event) => {
                event.stopPropagation();
                onMoveToTrash(item);
              }}
            >
              <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="icon-button item-card__open"
            aria-label={`Open ${item.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail?.(item);
            }}
          >
            <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </SurfaceCard>
  );
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  const index = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (index < 0) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + highlight.length);
  const after = text.slice(index + highlight.length);

  return (
    <>
      {before}
      <mark className="match-highlight">{match}</mark>
      {after}
    </>
  );
}

function getOcrStatus(item: SavedItem): { label: string; variant: 'ready' | 'queued' | 'processing' | 'failed' } | null {
  if (item.type !== 'screenshot' && item.type !== 'image') {
    return null;
  }

  if (item.ocrStatus === 'ready' || item.extractedText) {
    return { label: 'OCR ready', variant: 'ready' };
  }

  if (item.ocrStatus === 'processing') {
    return { label: 'OCR processing', variant: 'processing' };
  }

  if (item.ocrStatus === 'failed') {
    return { label: 'OCR failed', variant: 'failed' };
  }

  if (item.ocrStatus === 'queued' || item.imageDataUrl || item.mimeType) {
    return { label: 'OCR queued', variant: 'queued' };
  }

  return null;
}

function ItemTypeIcon({
  type,
  size,
  strokeWidth = 1.5
}: {
  type: SavedItem['type'];
  size: number;
  strokeWidth?: number;
}) {
  if (type === 'link') {
    return <Link size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  if (type === 'snippet') {
    return <Type size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  if (type === 'image') {
    return <Image size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  return <FileImage size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

function getItemMeta(item: SavedItem): string {
  if (item.type === 'link') {
    return 'Link';
  }

  if (item.type === 'snippet') {
    return 'Snippet';
  }

  if (item.type === 'image') {
    return formatBytes(item.sizeBytes) ? `Image · ${formatBytes(item.sizeBytes)}` : 'Image';
  }

  return formatBytes(item.sizeBytes) ? `Screenshot · ${formatBytes(item.sizeBytes)}` : 'Screenshot';
}
