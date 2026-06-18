import type { SavedItem } from '../../domain/savedItem';

export interface LocalOcrResult {
  text: string;
  language: string;
}

type TesseractWorker = {
  recognize(image: string): Promise<{ data: { text?: string } }>;
  terminate(): Promise<unknown>;
};

type TesseractModule = {
  createWorker?: (language: string) => Promise<TesseractWorker>;
  default?: {
    createWorker?: (language: string) => Promise<TesseractWorker>;
  };
};

let workerPromise: Promise<TesseractWorker> | undefined;
let workerLanguage = 'eng';

export function canRunOcr(item: SavedItem): boolean {
  return (item.type === 'image' || item.type === 'screenshot') && Boolean(item.imageDataUrl);
}

export async function recognizeImageText(
  imageDataUrl: string,
  language = 'eng'
): Promise<LocalOcrResult> {
  const worker = await getWorker(language);
  const result = await worker.recognize(imageDataUrl);

  return {
    text: normalizeOcrText(result.data.text ?? ''),
    language
  };
}

export async function terminateOcrWorkerForTests() {
  const worker = await workerPromise?.catch(() => undefined);
  await worker?.terminate();
  workerPromise = undefined;
  workerLanguage = 'eng';
}

async function getWorker(language: string): Promise<TesseractWorker> {
  if (!workerPromise || workerLanguage !== language) {
    await terminateOcrWorkerForTests();
    workerLanguage = language;
    workerPromise = createTesseractWorker(language);
  }

  return workerPromise;
}

async function createTesseractWorker(language: string): Promise<TesseractWorker> {
  const tesseract = (await import('tesseract.js')) as unknown as TesseractModule;
  const createWorker = tesseract.createWorker ?? tesseract.default?.createWorker;

  if (!createWorker) {
    throw new Error('Local OCR worker could not be loaded.');
  }

  return createWorker(language) as Promise<TesseractWorker>;
}

function normalizeOcrText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}
