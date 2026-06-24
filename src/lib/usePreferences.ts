import { useCallback, useEffect, useState } from 'react';
import {
  getPreferences,
  resetPreferences,
  setPreferences,
  subscribePreferences,
  type ScreeniePreferences
} from './preferences';

export function usePreferences() {
  const [preferences, setLocal] = useState<ScreeniePreferences>(() => getPreferences());

  useEffect(() => subscribePreferences(setLocal), []);

  const update = useCallback((patch: Partial<ScreeniePreferences>) => {
    setLocal(setPreferences(patch));
  }, []);

  const reset = useCallback(() => {
    setLocal(resetPreferences());
  }, []);

  return { preferences, update, reset };
}
