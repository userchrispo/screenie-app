import {
  createProject,
  createSavedItem,
  updateSavedItem,
  type CreateProjectInput,
  type CreateSavedItemInput,
  type Project,
  type SavedItem,
  type ScreenieRepository,
  type UpdateSavedItemInput
} from '../../domain/savedItem';
import { createWorkspaceSnapshot, normalizeWorkspaceSnapshot } from '../../domain/workspaceSnapshot';
import { seedItems, seedProjects } from './seedData';

export function createMemoryScreenieRepository(
  initialItems: SavedItem[] = [],
  initialProjects: Project[] = []
): ScreenieRepository {
  const items = new Map(initialItems.map((item) => [item.id, item]));
  const projects = new Map(initialProjects.map((project) => [project.id, project]));

  return {
    async list() {
      return sortNewest(Array.from(items.values()));
    },

    async get(id: string) {
      return items.get(id);
    },

    async create(input: CreateSavedItemInput) {
      const item = createSavedItem(input);
      items.set(item.id, item);
      return item;
    },

    async update(id: string, input: UpdateSavedItemInput) {
      const existing = items.get(id);
      if (!existing) {
        throw new Error(`Saved item not found: ${id}`);
      }
      const updated = updateSavedItem(existing, input);
      items.set(id, updated);
      return updated;
    },

    async trash(id: string) {
      return this.update(id, { status: 'trash' });
    },

    async restore(id: string) {
      return this.update(id, { status: 'active' });
    },

    async toggleFavorite(id: string) {
      const existing = items.get(id);
      if (!existing) {
        throw new Error(`Saved item not found: ${id}`);
      }
      return this.update(id, { isFavorite: !existing.isFavorite });
    },

    async remove(id: string) {
      items.delete(id);
    },

    async listProjects() {
      return sortProjects(Array.from(projects.values()));
    },

    async createProject(input: CreateProjectInput) {
      const project = createProject(input);
      projects.set(project.id, project);
      return project;
    },

    async renameProject(id: string, name: string) {
      const existing = projects.get(id);
      if (!existing) {
        throw new Error(`Project not found: ${id}`);
      }
      const updated: Project = { ...existing, name: name.trim() || 'Untitled project' };
      projects.set(id, updated);
      return updated;
    },

    async removeProject(id: string) {
      for (const [itemId, item] of items) {
        if (item.projectId === id) {
          items.set(itemId, updateSavedItem(item, { projectId: null }));
        }
      }
      projects.delete(id);
    },

    async exportWorkspace(now?: string) {
      return createWorkspaceSnapshot(Array.from(items.values()), Array.from(projects.values()), now);
    },

    async importWorkspace(snapshot) {
      const normalized = normalizeWorkspaceSnapshot(snapshot);
      items.clear();
      projects.clear();
      for (const item of normalized.items) {
        items.set(item.id, item);
      }
      for (const project of normalized.projects) {
        projects.set(project.id, project);
      }
    },

    async resetDemo() {
      items.clear();
      projects.clear();
      for (const item of seedItems) {
        items.set(item.id, item);
      }
      for (const project of seedProjects) {
        projects.set(project.id, project);
      }
    },

    async seed(seedItems: SavedItem[], seedProjectsList: Project[] = []) {
      for (const item of seedItems) {
        items.set(item.id, item);
      }
      for (const project of seedProjectsList) {
        projects.set(project.id, project);
      }
    },

    async clear() {
      items.clear();
      projects.clear();
    }
  };
}

function sortNewest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}
