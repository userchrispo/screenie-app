import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CreateProjectInput,
  CreateSavedItemInput,
  Project,
  SavedItem,
  UpdateSavedItemInput,
  WorkspaceSnapshot
} from '../../domain/savedItem';
import { screenieRepository } from '../../lib/storage/screenieRepository';

export function useSavedItems() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextItems, nextProjects] = await Promise.all([
        screenieRepository.list(),
        screenieRepository.listProjects()
      ]);
      setItems(nextItems);
      setProjects(nextProjects);
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

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      const project = await screenieRepository.createProject(input);
      await reload();
      return project;
    },
    [reload]
  );

  const renameProject = useCallback(
    async (id: string, name: string) => {
      const project = await screenieRepository.renameProject(id, name);
      await reload();
      return project;
    },
    [reload]
  );

  const removeProject = useCallback(
    async (id: string) => {
      await screenieRepository.removeProject(id);
      await reload();
    },
    [reload]
  );

  const clearAll = useCallback(async () => {
    await screenieRepository.clear();
    await reload();
  }, [reload]);

  const exportWorkspace = useCallback(async () => screenieRepository.exportWorkspace(), []);

  const importWorkspace = useCallback(
    async (snapshot: WorkspaceSnapshot) => {
      await screenieRepository.importWorkspace(snapshot);
      await reload();
    },
    [reload]
  );

  const resetDemo = useCallback(async () => {
    await screenieRepository.resetDemo();
    await reload();
  }, [reload]);

  const counts = useMemo(() => {
    const active = items.filter((item) => item.status === 'active');
    return {
      inbox: active.filter((item) => !item.projectId).length,
      library: active.length,
      favorites: active.filter((item) => item.isFavorite).length,
      tags: new Set(active.flatMap((item) => item.tags)).size,
      trash: items.filter((item) => item.status === 'trash').length,
      projects: projects.length
    };
  }, [items, projects]);

  return {
    items,
    projects,
    counts,
    isLoading,
    error,
    reload,
    createItem,
    updateItem,
    deleteItem,
    createProject,
    renameProject,
    removeProject,
    clearAll,
    exportWorkspace,
    importWorkspace,
    resetDemo
  };
}
