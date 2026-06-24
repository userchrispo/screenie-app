export type Density = 'comfortable' | 'compact';
export type CaptureMode = 'link' | 'snippet' | 'image';

export interface ScreeniePreferences {
  defaultCaptureMode: CaptureMode;
  linkTags: string;
  snippetTags: string;
  imageTags: string;
  ocrLanguage: string;
  autoClipboardCapture: boolean;
  maxImageMb: number;
  density: Density;
  sidebarCollapsed: boolean;
}

export interface OcrLanguageOption {
  value: string;
  label: string;
}

/**
 * Tesseract language codes shown in the OCR language picker. Selecting a new
 * language may trigger a one-time language-data download on the next OCR run.
 */
export const OCR_LANGUAGE_OPTIONS: OcrLanguageOption[] = [
  { value: 'eng', label: 'English' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'ita', label: 'Italian' },
  { value: 'por', label: 'Portuguese' },
  { value: 'nld', label: 'Dutch' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kor', label: 'Korean' },
  { value: 'chi_sim', label: 'Chinese (Simplified)' }
];

export const DEFAULT_PREFERENCES: ScreeniePreferences = {
  defaultCaptureMode: 'link',
  linkTags: 'link, intake',
  snippetTags: 'snippet, intake',
  imageTags: 'image, intake',
  ocrLanguage: 'eng',
  autoClipboardCapture: true,
  maxImageMb: 10,
  density: 'comfortable',
  sidebarCollapsed: false
};

const STORAGE_KEY = 'screenie-prefs';

type Listener = (preferences: ScreeniePreferences) => void;

const listeners = new Set<Listener>();
let cache: ScreeniePreferences | null = null;

export function getPreferences(): ScreeniePreferences {
  if (cache) {
    return cache;
  }

  cache = readPreferences();
  return cache;
}

export function setPreferences(patch: Partial<ScreeniePreferences>): ScreeniePreferences {
  const next = sanitize({ ...getPreferences(), ...patch });
  cache = next;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  applyDensity(next.density);
  for (const listener of listeners) {
    listener(next);
  }

  return next;
}

export function resetPreferences(): ScreeniePreferences {
  return setPreferences(DEFAULT_PREFERENCES);
}

export function subscribePreferences(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyDensity(density: Density): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-density', density);
  }
}

export function initPreferences(): void {
  applyDensity(getPreferences().density);

  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    cache = readPreferences();
    applyDensity(cache.density);
    for (const listener of listeners) {
      listener(cache);
    }
  });
}

function readPreferences(): ScreeniePreferences {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_PREFERENCES };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ScreeniePreferences>;
    return sanitize({ ...DEFAULT_PREFERENCES, ...parsed });
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function sanitize(preferences: ScreeniePreferences): ScreeniePreferences {
  const mode: CaptureMode =
    preferences.defaultCaptureMode === 'snippet' || preferences.defaultCaptureMode === 'image'
      ? preferences.defaultCaptureMode
      : 'link';
  const density: Density = preferences.density === 'compact' ? 'compact' : 'comfortable';
  const maxImageMb = clamp(Number(preferences.maxImageMb) || DEFAULT_PREFERENCES.maxImageMb, 1, 50);

  return {
    defaultCaptureMode: mode,
    linkTags: String(preferences.linkTags ?? DEFAULT_PREFERENCES.linkTags),
    snippetTags: String(preferences.snippetTags ?? DEFAULT_PREFERENCES.snippetTags),
    imageTags: String(preferences.imageTags ?? DEFAULT_PREFERENCES.imageTags),
    ocrLanguage: String(preferences.ocrLanguage || DEFAULT_PREFERENCES.ocrLanguage),
    autoClipboardCapture: Boolean(preferences.autoClipboardCapture),
    maxImageMb,
    density,
    sidebarCollapsed: Boolean(preferences.sidebarCollapsed)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
