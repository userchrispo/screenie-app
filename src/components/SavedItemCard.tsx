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

interface SavedItemCardProps {
  item: SavedItem;
  matchedText?: string;
  onToggleFavorite: (item: SavedItem) => void;
  onMoveToTrash: (item: SavedItem) => void;
  onRestore: (item: SavedItem) => void;
}

export function SavedItemCard({
  item,
  matchedText,
  onToggleFavorite,
  onMoveToTrash,
  onRestore
}: SavedItemCardProps) {
  const meta = getItemMeta(item);

  return (
    <article className="item-card">
      <div className={`item-thumb item-thumb-${item.thumbnailColor ?? item.type}`}>
        {item.imageDataUrl ? (
          <img src={item.imageDataUrl} alt="" />
        ) : (
          <ItemTypeIcon type={item.type} size={34} />
        )}
      </div>

      <div className="item-content">
        <div className="item-kicker">
          <ItemTypeIcon type={item.type} size={18} />
          <span>{meta}</span>
          {item.extractedText && <span className="ocr-chip">OCR</span>}
        </div>
        <h3>{item.title}</h3>
        {item.url && <p className="item-url">{item.url}</p>}
        <p className="matched-copy">
          <span>{matchedText ? 'Matched text' : 'Saved text'}</span>
          {matchedText ?? item.text ?? item.description ?? 'No preview available.'}
        </p>
        <div className="tag-row" aria-label={`${item.title} tags`}>
          {item.tags.map((tag) => (
            <span className="tag-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="item-side">
        <time dateTime={item.createdAt}>{formatItemDate(item.createdAt)}</time>
        <div className="item-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={item.isFavorite ? `Remove ${item.title} from favorites` : `Favorite ${item.title}`}
            onClick={() => onToggleFavorite(item)}
          >
            <Star size={18} fill={item.isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          {item.status === 'trash' ? (
            <button
              className="icon-button"
              type="button"
              aria-label={`Restore ${item.title}`}
              onClick={() => onRestore(item)}
            >
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              className="icon-button"
              type="button"
              aria-label={`Move ${item.title} to trash`}
              onClick={() => onMoveToTrash(item)}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          )}
          <ChevronRight size={22} aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function ItemTypeIcon({ type, size }: { type: SavedItem['type']; size: number }) {
  if (type === 'link') {
    return <Link size={size} aria-hidden="true" />;
  }

  if (type === 'snippet') {
    return <Type size={size} aria-hidden="true" />;
  }

  if (type === 'image') {
    return <Image size={size} aria-hidden="true" />;
  }

  return <FileImage size={size} aria-hidden="true" />;
}

function getItemMeta(item: SavedItem): string {
  if (item.type === 'link') {
    return 'Link';
  }

  if (item.type === 'snippet') {
    return 'Snippet';
  }

  if (item.type === 'image') {
    return formatBytes(item.sizeBytes) ? `Image - ${formatBytes(item.sizeBytes)}` : 'Image';
  }

  return formatBytes(item.sizeBytes) ? `Screenshot - ${formatBytes(item.sizeBytes)}` : 'Screenshot';
}
