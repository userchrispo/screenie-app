import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CreateSavedItemInput, SavedItem, UpdateSavedItemInput } from '../../domain/savedItem';
import { screenieRepository } from '../../lib/storage/screenieRepository';

export function useSavedItems() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setItems(await screenieRepository.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Screenie items.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createItem = useCallback(
    async (input: CreateSavedItemInput) => {
      const item = await screenieRepository.create(input);
      await reload();
      return item;
    },
    [reload]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateSavedItemInput) => {
      const item = await screenieRepository.update(id, input);
      await reload();
      return item;
    },
    [reload]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await screenieRepository.remove(id);
      await reload();
    },
    [reload]
  );

  const counts = useMemo(() => {
    const active = items.filter((item) => item.status === 'active');
    return {
      inbox: active.length,
      library: active.length,
      favorites: active.filter((item) => item.isFavorite).length,
      tags: new Set(active.flatMap((item) => item.tags)).size,
      trash: items.filter((item) => item.status === 'trash').length
    };
  }, [items]);

  return {
    items,
    counts,
    isLoading,
    error,
    reload,
    createItem,
    updateItem,
    deleteItem
  };
}
