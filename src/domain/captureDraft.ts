import type { CreateSavedItemInput, SavedItemType } from './savedItem';

export const CAPTURE_BRIDGE_MESSAGE = 'screenie.captureDraft.v1';

export interface CaptureDraft {
  type: SavedItemType;
  title: string;
  url?: string;
  text?: string;
  imageDataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  tags?: string[];
  source?: CreateSavedItemInput['source'];
}

export interface CaptureBridgeMessage {
  type: typeof CAPTURE_BRIDGE_MESSAGE;
  draft: CaptureDraft;
}

export function parseCaptureBridgeMessage(value: unknown): CaptureBridgeMessage | null {
  if (!isRecord(value) || value.type !== CAPTURE_BRIDGE_MESSAGE || !isRecord(value.draft)) {
    return null;
  }

  const draft = parseCaptureDraft(value.draft);
  return draft ? { type: CAPTURE_BRIDGE_MESSAGE, draft } : null;
}

export function captureDraftToCreateInput(draft: CaptureDraft): CreateSavedItemInput {
  return {
    type: draft.type,
    title: draft.title,
    url: draft.url,
    text: draft.text,
    imageDataUrl: draft.imageDataUrl,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
    tags: draft.tags,
    source: draft.source ?? 'extension',
    ocrStatus: draft.imageDataUrl && isImageType(draft.type) ? 'queued' : 'not_applicable',
    ocrLanguage: draft.imageDataUrl && isImageType(draft.type) ? 'eng' : undefined,
    thumbnailColor: draft.type === 'link' ? 'link' : draft.type === 'snippet' ? 'snippet' : 'hero'
  };
}

function parseCaptureDraft(value: Record<string, unknown>): CaptureDraft | null {
  const type = parseItemType(value.type);
  const title = cleanString(value.title);

  if (!type || !title) {
    return null;
  }

  const draft: CaptureDraft = {
    type,
    title,
    url: cleanString(value.url),
    text: cleanString(value.text),
    imageDataUrl: cleanString(value.imageDataUrl),
    mimeType: cleanString(value.mimeType),
    sizeBytes: typeof value.sizeBytes === 'number' && Number.isFinite(value.sizeBytes) ? value.sizeBytes : undefined,
    tags: Array.isArray(value.tags) ? normalizeTags(value.tags) : undefined,
    source: value.source === 'extension' ? 'extension' : undefined
  };

  if (type === 'link' && !draft.url) {
    return null;
  }

  if (type === 'snippet' && !draft.text) {
    return null;
  }

  if (isImageType(type) && !draft.imageDataUrl) {
    return null;
  }

  return draft;
}

function parseItemType(value: unknown): SavedItemType | null {
  return value === 'link' || value === 'screenshot' || value === 'snippet' || value === 'image'
    ? value
    : null;
}

function isImageType(type: SavedItemType): boolean {
  return type === 'image' || type === 'screenshot';
}

function normalizeTags(value: unknown[]): string[] {
  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
    )
  );
}

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
