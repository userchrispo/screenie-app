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
import type { CaptureTemplate } from '../../domain/captureTemplate';
import { createWorkspaceSnapshot, normalizeWorkspaceSnapshot } from '../../domain/workspaceSnapshot';
import { seedItems, seedProjects } from './seedData';

export function createMemoryScreenieRepository(
  initialItems: SavedItem[] = [],
  initialProjects: Project[] = []
): ScreenieRepository {
  const items = new Map(initialItems.map((item) => [item.id, item]));
  const projects = new Map(initialProjects.map((project) => [project.id, project]));
  const templates = new Map<string, CaptureTemplate>();

  async function updateItem(id: string, input: UpdateSavedItemInput) {
    const existing = items.get(id);
    if (!existing) {
      throw new Error(`Saved item not found: ${id}`);
    }
    const updated = updateSavedItem(existing, input);
    items.set(id, updated);
    return updated;
  }

  async function seedWorkspace(nextItems: SavedItem[], nextProjects: Project[] = seedProjects) {
    for (const item of nextItems) {
      items.set(item.id, item);
    }
    for (const project of nextProjects) {
      projects.set(project.id, project);
    }
  }

  async function clearWorkspace() {
    items.clear();
    projects.clear();
    templates.clear();
  }

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

    update: updateItem,

    async trash(id: string) {
      return updateItem(id, { status: 'trash' });
    },

    async restore(id: string) {
      return updateItem(id, { status: 'active' });
    },

    async toggleFavorite(id: string) {
      const existing = items.get(id);
      if (!existing) {
        throw new Error(`Saved item not found: ${id}`);
      }
      return updateItem(id, { isFavorite: !existing.isFavorite });
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
      const affected: SavedItem[] = [];
      for (const [itemId, item] of items) {
        if (item.projectId === id) {
          const updated = updateSavedItem(item, { projectId: null });
          items.set(itemId, updated);
          affected.push(updated);
        }
      }
      projects.delete(id);
      return affected;
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
      await clearWorkspace();
      await seedWorkspace(seedItems, seedProjects);
    },

    seed: seedWorkspace,

    clear: clearWorkspace,

    async listTemplates() {
      return Array.from(templates.values()).sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      );
    },

    async saveTemplate(template: CaptureTemplate) {
      templates.set(template.id, template);
      return template;
    },

    async deleteTemplate(id: string) {
      templates.delete(id);
    }
  };
}

function sortNewest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}
