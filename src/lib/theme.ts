export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'screenie-theme';

export function getStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') {
    return 'system';
  }

  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function prefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark() ? 'dark' : 'light';
  }

  return preference;
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
  return resolved;
}

export function setThemePreference(preference: ThemePreference): ResolvedTheme {
  if (typeof localStorage !== 'undefined') {
    if (preference === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  }

  return applyTheme(preference);
}

export function initTheme(): void {
  applyTheme(getStoredPreference());

  if (typeof matchMedia === 'undefined') {
    return;
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredPreference() === 'system') {
      applyTheme('system');
    }
  });
}
