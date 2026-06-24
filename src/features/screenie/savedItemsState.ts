import type { Project, SavedItem } from '../../domain/savedItem';

export function sortItemsNewestFirst(items: SavedItem[]): SavedItem[] {
  return [...items].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export function upsertItemInState(items: SavedItem[], item: SavedItem): SavedItem[] {
  const withoutItem = items.filter((current) => current.id !== item.id);
  return sortItemsNewestFirst([...withoutItem, item]);
}

export function upsertProjectlessItemsInState(items: SavedItem[], affectedItems: SavedItem[]): SavedItem[] {
  return affectedItems.reduce(
    (currentItems, item) => upsertItemInState(currentItems, item),
    items
  );
}

export function removeItemFromState(items: SavedItem[], id: string): SavedItem[] {
  return items.filter((item) => item.id !== id);
}

export function sortProjectsByName(projects: Project[]): Project[] {
  return [...projects].sort((first, second) => first.name.localeCompare(second.name));
}

export function upsertProjectInState(projects: Project[], project: Project): Project[] {
  const withoutProject = projects.filter((current) => current.id !== project.id);
  return sortProjectsByName([...withoutProject, project]);
}

export function removeProjectFromState(projects: Project[], id: string): Project[] {
  return projects.filter((project) => project.id !== id);
}
