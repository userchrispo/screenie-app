import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getStoredPreference, resolveTheme, setThemePreference, type ResolvedTheme } from '../lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredPreference()));
  const nextTheme: ResolvedTheme = theme === 'dark' ? 'light' : 'dark';

  function toggle() {
    setTheme(setThemePreference(nextTheme));
  }

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      onClick={toggle}
    >
      {theme === 'dark' ? (
        <Sun size={18} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.5} aria-hidden="true" />
      )}
    </button>
  );
}
