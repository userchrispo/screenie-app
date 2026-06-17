import { afterEach, describe, expect, it, vi } from 'vitest';
import { canRunOcr, recognizeImageText, terminateOcrWorkerForTests } from './localOcr';
import type { SavedItem } from '../../domain/savedItem';

const recognize = vi.fn();
const terminate = vi.fn();
const createWorker = vi.fn(async () => ({ recognize, terminate }));

vi.mock('tesseract.js', () => ({
  createWorker
}));

describe('local OCR', () => {
  afterEach(async () => {
    recognize.mockReset();
    terminate.mockReset();
    createWorker.mockClear();
    await terminateOcrWorkerForTests();
  });

  it('recognizes image data through a lazy worker and normalizes text', async () => {
    recognize.mockResolvedValue({ data: { text: '  Pro $49  \n\n Team $99 ' } });

    const result = await recognizeImageText('data:image/png;base64,abc');

    expect(createWorker).toHaveBeenCalledWith('eng');
    expect(recognize).toHaveBeenCalledWith('data:image/png;base64,abc');
    expect(result).toEqual({ language: 'eng', text: 'Pro $49\nTeam $99' });
  });

  it('only allows OCR for image-like saved items with image data', () => {
    const base = {
      id: 'item',
      title: 'Item',
      tags: [],
      isFavorite: false,
      status: 'active',
      createdAt: '2026-06-16T12:00:00.000Z',
      updatedAt: '2026-06-16T12:00:00.000Z'
    } satisfies Partial<SavedItem>;

    expect(canRunOcr({ ...base, type: 'image', imageDataUrl: 'data:image/png;base64,abc' } as SavedItem)).toBe(true);
    expect(canRunOcr({ ...base, type: 'screenshot' } as SavedItem)).toBe(false);
    expect(canRunOcr({ ...base, type: 'link', imageDataUrl: 'data:image/png;base64,abc' } as SavedItem)).toBe(false);
  });
});
